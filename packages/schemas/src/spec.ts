import { z } from 'zod';

/**
 * FSD layers, in their official strict-descent order.
 * Used by Spec to declare the target layer of a work unit, and by
 * `module-fsd` / `module-cqrs` to validate import directionality.
 */
export const FsdLayerSchema = z.enum([
  'app',
  'pages',
  'widgets',
  'features',
  'entities',
  'shared',
]);
export type FsdLayer = z.infer<typeof FsdLayerSchema>;

/**
 * A single Generator sprint — the smallest unit the Generator commits to
 * complete in one context. Sprints keep Generator work bounded and make
 * self-check (mechanical lint) feasible between iterations.
 */
export const SprintSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  filesTouched: z.array(z.string()).default([]),
  acceptanceCriteria: z.array(z.string()).min(1),
});
export type Sprint = z.infer<typeof SprintSchema>;

/**
 * Planner's output. Written to
 * `.forge/runs/<runId>/planner/spec.json` (+ `.md`) and consumed by the
 * Generator in a fresh context.
 *
 * Invariants:
 * - `activeModules` is a subset of the modules loaded by `@forge-kit-dev/core`.
 * - `sprints[*].acceptanceCriteria` must be checkable by the Evaluator
 *   through either a rubric or a mechanical rule.
 */
export const SpecSchema = z.object({
  runId: z.string().min(1),
  goal: z.string().min(1),
  activeModules: z.array(z.string()).default([]),
  targetLayer: FsdLayerSchema.optional(),
  targetSlice: z.string().optional(),
  sprints: z.array(SprintSchema).min(1),
  successCriteria: z.array(z.string()).min(1),
  createdAt: z.string().datetime(),
});
export type Spec = z.infer<typeof SpecSchema>;
