import type { EvalReport, Rubric, Spec } from '@forge-kit-dev/schemas';
import type { AgentRuntime } from './runtime.js';

export interface EvaluatorInput {
  runId: string;
  iteration: number;
  spec: Spec;
  rubrics: readonly Rubric[];
  repoRoot: string;
  /**
   * git refs used to compute the diff the Evaluator will review.
   * `baseRef` is usually the commit before the Generator started; `headRef`
   * is `HEAD`. The Evaluator is explicitly not allowed to inspect code
   * outside this diff (enforced by runtime via toolkit scoping).
   */
  baseRef: string;
  headRef: string;
  /** Absolute path to the Spec markdown the evaluator will read. */
  specMdPath: string;
  /** Absolute path to the diff.patch written by the final sprint. */
  diffPath: string;
  /**
   * Absolute directory for this iteration's artifacts
   * (`.forge/runs/<runId>/evaluator/iteration-0N/`). The evaluator writes
   * report.json and report.md into this directory.
   */
  iterationDir: string;
}

export interface Evaluator {
  readonly id: 'evaluator';
  /**
   * Always runs with `freshContext: true`. Any runtime that honors the
   * `SpawnRequest.freshContext` contract therefore guarantees isolation
   * from the Generator — this is the physical half of forge's
   * "separation of generation and evaluation" invariant.
   */
  evaluate(
    input: EvaluatorInput,
    runtime: AgentRuntime
  ): Promise<EvalReport>;
}
