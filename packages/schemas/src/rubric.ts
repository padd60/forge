import { z } from 'zod';

/**
 * A single criterion inside a rubric. Scoring is constrained to a
 * three-point ladder (0, 5, 10) to force the Evaluator to choose between
 * "broken", "flawed", or "acceptable" — no middle ground that lets the
 * Evaluator shrug.
 *
 * The three descriptions must each define a concrete, code-visible state
 * so the Evaluator can cite violating files when scoring below 10.
 */
export const RubricCriterionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  weight: z.number().min(0).max(1),
  scoreGuide: z.object({
    zero: z.string().min(1),
    five: z.string().min(1),
    ten: z.string().min(1),
  }),
});
export type RubricCriterion = z.infer<typeof RubricCriterionSchema>;

/**
 * A bundle of criteria shipped by a single module, loaded into the
 * Evaluator's prompt when that module is active.
 */
export const RubricSchema = z.object({
  id: z.string().min(1),
  module: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  criteria: z.array(RubricCriterionSchema).min(1),
});
export type Rubric = z.infer<typeof RubricSchema>;

/**
 * One score produced by the Evaluator for one criterion. `violatingFiles`
 * is required when `score < 10` so that `/forge-fix` can jump directly
 * to the code locations that need repair.
 */
export const RubricScoreSchema = z
  .object({
    criterionId: z.string().min(1),
    score: z.union([z.literal(0), z.literal(5), z.literal(10)]),
    rationale: z.string().min(1),
    violatingFiles: z.array(z.string()).default([]),
  })
  .refine((s) => (s.score === 10 ? true : s.violatingFiles.length > 0), {
    message: 'violatingFiles is required when score < 10',
    path: ['violatingFiles'],
  });
export type RubricScore = z.infer<typeof RubricScoreSchema>;

/**
 * The top-level Evaluator report, written to
 * `.forge/runs/<runId>/evaluator/iteration-<n>/report.json`.
 */
export const EvalReportSchema = z.object({
  runId: z.string().min(1),
  iteration: z.number().int().min(1),
  totalScore: z.number().min(0),
  maxScore: z.number().min(0),
  passed: z.boolean(),
  scores: z.array(RubricScoreSchema),
  suggestions: z.array(z.string()).default([]),
  shouldRetry: z.boolean(),
  createdAt: z.string().datetime(),
});
export type EvalReport = z.infer<typeof EvalReportSchema>;
