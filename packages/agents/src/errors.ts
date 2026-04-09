import type { EvalReport } from '@forge-kit-dev/schemas';

/**
 * Thrown by `DefaultPlanner` when the sub-agent's `spec.json` fails
 * `SpecSchema.parse()`. The original Zod (or file IO) error is attached
 * as the standard `Error.cause` so `/forge-plan` can surface it
 * verbatim.
 */
export class PlannerValidationError extends Error {
  constructor(cause: unknown) {
    super(
      `forge: planner returned an invalid Spec — ${(cause as Error)?.message ?? String(cause)}`,
      { cause }
    );
    this.name = 'PlannerValidationError';
  }
}

/**
 * Thrown by `DefaultGenerator` when a sprint's `self-check.json` reports
 * `ok: false`. The sprint number and its log are preserved so
 * `Harness.run()` can either surface them directly or, in future, feed
 * them back into a fix loop.
 */
export class SprintFailedError extends Error {
  readonly sprintIndex: number;
  readonly log: string;
  constructor(sprintIndex: number, log: string) {
    super(
      `forge: sprint-${String(sprintIndex).padStart(2, '0')} self-check failed`
    );
    this.name = 'SprintFailedError';
    this.sprintIndex = sprintIndex;
    this.log = log;
  }
}

/**
 * Thrown by `Harness.run()` when the evaluator never reaches a passing
 * score within `config.evaluator.maxIterations`. The last `report` is
 * attached so callers can still render the final rubric breakdown.
 */
export class RunLimitError extends Error {
  readonly runId: string;
  readonly iterations: number;
  readonly lastReport: EvalReport;
  constructor(runId: string, iterations: number, lastReport: EvalReport) {
    super(
      `forge: run ${runId} did not pass after ${iterations} evaluator iterations`
    );
    this.name = 'RunLimitError';
    this.runId = runId;
    this.iterations = iterations;
    this.lastReport = lastReport;
  }
}
