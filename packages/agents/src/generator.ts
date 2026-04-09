import type { EvalReport, Spec } from '@forge-kit-dev/schemas';
import type { AgentRuntime } from './runtime.js';

export interface GeneratorInput {
  runId: string;
  spec: Spec;
  repoRoot: string;
  /** Absolute path to the `spec.md` the generator reads in its prompt. */
  specMdPath: string;
  /**
   * One absolute directory per sprint, in order. The Harness pre-creates
   * these; the generator just writes plan.md / diff.patch / self-check.json
   * / handoff.json into each one.
   */
  sprintDirs: readonly string[];
  /**
   * Set only when Harness re-enters the Generator after a failed eval.
   * In that case the first sprint is spawned with `freshContext:true`
   * and the report is included in its input files.
   */
  previousReport?: EvalReport;
  previousReportMdPath?: string;
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
