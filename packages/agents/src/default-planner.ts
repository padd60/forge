import { readFile } from 'node:fs/promises';

import { SpecSchema, type Spec } from '@forge-kit-dev/schemas';

import { PlannerValidationError } from './errors.js';
import type { Planner, PlannerInput } from './planner.js';
import type { AgentRuntime, SpawnRequest } from './runtime.js';
import { PLANNER_TOOLKIT } from './toolkit.js';

export interface DefaultPlannerOptions {
  /**
   * Base system prompt handed to the planner sub-agent. Module skill
   * prompts should already be composed in by the caller via
   * `composePrompt(modules, 'plan')`.
   */
  systemPrompt: string;
}

/**
 * The reference `Planner` implementation forge ships for v0.1.
 *
 * It is intentionally thin: it spawns one sub-agent, waits for
 * completion, and re-reads `spec.json` from disk before handing it back
 * to the Harness. All orchestration — directory creation, handoff
 * writing, fix-loop bookkeeping — lives in `Harness.run()`, and all
 * tool access lives in the runtime. Keeping the class this small is
 * what makes `MockRuntime` useful: the test harness can assert that
 * forge is driving the pipeline correctly without caring about LLM
 * behavior.
 */
export class DefaultPlanner implements Planner {
  readonly id = 'planner' as const;
  readonly #systemPrompt: string;

  constructor(opts: DefaultPlannerOptions) {
    this.#systemPrompt = opts.systemPrompt;
  }

  async plan(input: PlannerInput, runtime: AgentRuntime): Promise<Spec> {
    const req: SpawnRequest = {
      role: 'planner',
      systemPrompt: this.#systemPrompt,
      inputFiles: [input.requestPath],
      expectedOutputs: [input.specJsonPath],
      toolkit: PLANNER_TOOLKIT,
      // Planner never mutates code and always runs at the top of a run,
      // so context reuse across runs is safe. Fresh-context is reserved
      // for the Generator→Evaluator transition, which is the invariant
      // forge actually guards.
      freshContext: false,
      label: `planner:${input.runId}`,
    };
    const handle = await runtime.spawn(req);
    await handle.waitForCompletion();
    return readSpec(input.specJsonPath);
  }
}

async function readSpec(filePath: string): Promise<Spec> {
  let raw: string;
  try {
    raw = await readFile(filePath, 'utf8');
  } catch (err) {
    throw new PlannerValidationError(err);
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return SpecSchema.parse(parsed);
  } catch (err) {
    throw new PlannerValidationError(err);
  }
}
