import { z } from 'zod';

/**
 * Discrete transitions between agents / sprints. Every handoff is
 * persisted as a single JSON file, so "context reset" works simply by
 * starting a fresh sub-agent with the handoff file as its only input.
 */
export const HandoffStageSchema = z.enum([
  'planner-to-generator',
  'generator-to-sprint',
  'generator-to-evaluator',
  'evaluator-to-generator',
  'final',
]);
export type HandoffStage = z.infer<typeof HandoffStageSchema>;

export const HandoffSchema = z.object({
  stage: HandoffStageSchema,
  runId: z.string().min(1),
  fromPath: z.string().min(1),
  /**
   * Paths the downstream agent MUST read. Map keys are semantic tags the
   * downstream agent references in its prompt template, e.g. `"spec"`,
   * `"previousDiff"`, `"evalReport"`.
   */
  toInputs: z.record(z.string(), z.string()),
  summary: z.string(),
  /**
   * Optional budget hint, used by `@forge-kit-dev/core` to decide between
   * preserving the current context and forcing a context reset.
   * Represented as a 0..1 fraction of the agent's token window.
   */
  contextBudgetHint: z.number().min(0).max(1).optional(),
  createdAt: z.string().datetime(),
});
export type Handoff = z.infer<typeof HandoffSchema>;
