import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { SprintFailedError } from './errors';
import type {
  Generator,
  GeneratorInput,
  GeneratorResult,
} from './generator';
import type { AgentRuntime, SpawnRequest } from './runtime';
import { GENERATOR_TOOLKIT } from './toolkit';

export interface DefaultGeneratorOptions {
  /** Base system prompt. Module skills at stage 'generate' go here. */
  systemPrompt: string;
}

/**
 * Reference `Generator`. Walks `spec.sprints` in order, spawning one
 * sub-agent per sprint. Between sprints it reads the sub-agent's
 * mechanical self-check report and aborts the run with a
 * `SprintFailedError` on the first red result — this is how forge
 * ensures the "sprint-sized Generator" invariant: the agent commits to
 * a bounded unit and has to lint-clean it before moving on.
 *
 * Fix-loop entries set `input.previousReport`. The first sprint in a
 * fix-loop re-entry is spawned with `freshContext: true` so the
 * Generator's model forgets the state that produced the failure.
 */
export class DefaultGenerator implements Generator {
  readonly id = 'generator' as const;
  readonly #systemPrompt: string;

  constructor(opts: DefaultGeneratorOptions) {
    this.#systemPrompt = opts.systemPrompt;
  }

  async generate(
    input: GeneratorInput,
    runtime: AgentRuntime
  ): Promise<GeneratorResult> {
    const { spec, sprintDirs } = input;
    if (sprintDirs.length !== spec.sprints.length) {
      throw new Error(
        `forge: generator received ${sprintDirs.length} sprint dirs but spec has ${spec.sprints.length} sprints`
      );
    }
    const isFixLoop = input.previousReport !== undefined;

    for (let i = 0; i < spec.sprints.length; i++) {
      const sprintDir = sprintDirs[i];
      if (!sprintDir) {
        // Unreachable thanks to the length check above, but
        // `noUncheckedIndexedAccess` demands the guard.
        throw new Error(
          `forge: generator sprint dir missing at index ${i}`
        );
      }
      const expectedOutputs = [
        join(sprintDir, 'plan.md'),
        join(sprintDir, 'diff.patch'),
        join(sprintDir, 'self-check.json'),
        join(sprintDir, 'handoff.json'),
      ];
      const inputFiles: string[] = [input.specMdPath];
      if (i === 0 && isFixLoop && input.previousReportMdPath) {
        inputFiles.push(input.previousReportMdPath);
      }

      const req: SpawnRequest = {
        role: 'generator',
        systemPrompt: this.#systemPrompt,
        inputFiles,
        expectedOutputs,
        toolkit: GENERATOR_TOOLKIT,
        // Fresh context only for the first sprint of a fix-loop
        // re-entry; subsequent sprints of the same Generator call reuse
        // context so the model can remember what it just wrote.
        freshContext: i === 0 && isFixLoop,
        label: `generator:${input.runId}:sprint-${String(i + 1).padStart(2, '0')}`,
      };

      const handle = await runtime.spawn(req);
      await handle.waitForCompletion();

      // Mechanical self-check gate: read the file the sub-agent wrote
      // and refuse to proceed if it reports a failure. Tying this to the
      // file rather than to the sub-agent's return value keeps the
      // contract file-driven and crash-recoverable.
      const selfCheck = await readSelfCheck(sprintDir, i + 1);
      if (!selfCheck.ok) {
        throw new SprintFailedError(i + 1, selfCheck.log);
      }
    }

    const lastIdx = spec.sprints.length - 1;
    const finalSprintDir = sprintDirs[lastIdx] ?? '';
    return {
      finalSprintPath: finalSprintDir,
      finalHandoffPath: join(finalSprintDir, 'handoff.json'),
      sprintsCompleted: spec.sprints.length,
    };
  }
}

async function readSelfCheck(
  sprintDir: string,
  sprintNumber: number
): Promise<{ ok: boolean; log: string }> {
  const filePath = join(sprintDir, 'self-check.json');
  let raw: string;
  try {
    raw = await readFile(filePath, 'utf8');
  } catch (err) {
    throw new SprintFailedError(
      sprintNumber,
      `self-check.json unreadable: ${(err as Error).message}`
    );
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof (parsed as { ok?: unknown }).ok !== 'boolean' ||
      typeof (parsed as { log?: unknown }).log !== 'string'
    ) {
      throw new Error('self-check.json must be { ok: boolean, log: string }');
    }
    return parsed as { ok: boolean; log: string };
  } catch (err) {
    throw new SprintFailedError(
      sprintNumber,
      `self-check.json malformed: ${(err as Error).message}`
    );
  }
}
