import { z } from 'zod';
import { EnforcementLevelSchema } from './enforcement';

/**
 * Metadata for one P-G-E execution, written at `.forge/runs/<runId>/request.json`.
 * `runId` is produced by `@forge/core` (timestamp + nanoid) and reused
 * as the folder name so runs are sortable by creation time.
 */
export const RunRequestSchema = z.object({
  runId: z.string().min(1),
  goal: z.string().min(1),
  enforcement: EnforcementLevelSchema,
  activeModules: z.array(z.string()),
  repoRoot: z.string().min(1),
  /** Optional seed for deterministic re-runs in the meta-eval harness. */
  seed: z.number().int().optional(),
  createdAt: z.string().datetime(),
});
export type RunRequest = z.infer<typeof RunRequestSchema>;
