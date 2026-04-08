import type { Spec } from '@forge/schemas';
import type { AgentRuntime } from './runtime';

export interface GeneratorInput {
  runId: string;
  spec: Spec;
  repoRoot: string;
}

/**
 * Opaque marker returned by a successful Generator run. It points to the
 * final handoff.json that the Evaluator will consume. We don't surface
 * diffs as JS objects here because forge treats patches as files,
 * not in-memory structures — this keeps sprints recoverable after a
 * crash and makes the meta-eval harness in Step 10 trivial to build.
 */
export interface GeneratorResult {
  finalSprintPath: string;
  finalHandoffPath: string;
  sprintsCompleted: number;
}

export interface Generator {
  readonly id: 'generator';
  generate(
    input: GeneratorInput,
    runtime: AgentRuntime
  ): Promise<GeneratorResult>;
}
