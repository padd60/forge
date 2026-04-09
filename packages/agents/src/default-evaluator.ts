import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { EvalReportSchema, type EvalReport } from '@forge/schemas';

import type { Evaluator, EvaluatorInput } from './evaluator.js';
import type { AgentRuntime, SpawnRequest } from './runtime.js';
import { EVALUATOR_TOOLKIT } from './toolkit.js';

export interface DefaultEvaluatorOptions {
  /** Base system prompt for the evaluator sub-agent. */
  systemPrompt: string;
}

/**
 * Reference `Evaluator`. The single most important invariant in forge:
 * **evaluator spawns are always `freshContext: true`.** The flag is
 * hard-coded into the `SpawnRequest` built here so an author cannot
 * accidentally reuse context by mis-typing an option; anything else
 * would silently defeat the Planner/Generator/Evaluator separation
 * Anthropic's harness paper is built on.
 */
export class DefaultEvaluator implements Evaluator {
  readonly id = 'evaluator' as const;
  readonly #systemPrompt: string;

  constructor(opts: DefaultEvaluatorOptions) {
    this.#systemPrompt = opts.systemPrompt;
  }

  async evaluate(
    input: EvaluatorInput,
    runtime: AgentRuntime
  ): Promise<EvalReport> {
    const reportJsonPath = join(input.iterationDir, 'report.json');
    const reportMdPath = join(input.iterationDir, 'report.md');

    const req: SpawnRequest = {
      role: 'evaluator',
      systemPrompt: this.#systemPrompt,
      inputFiles: [input.specMdPath, input.diffPath],
      expectedOutputs: [reportJsonPath, reportMdPath],
      toolkit: EVALUATOR_TOOLKIT,
      // Not configurable. See the class docstring.
      freshContext: true,
      label: `evaluator:${input.runId}:iter-${String(input.iteration).padStart(2, '0')}`,
    };

    const handle = await runtime.spawn(req);
    await handle.waitForCompletion();

    const raw = await readFile(reportJsonPath, 'utf8');
    const parsed: unknown = JSON.parse(raw);
    return EvalReportSchema.parse(parsed);
  }
}
