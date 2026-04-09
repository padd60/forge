import { z } from 'zod';

/**
 * Declared capabilities of a forge module. Mirrors the runtime `Module`
 * interface in `@forge-kit-dev/core` but stays JSON-serializable so the CLI can
 * display module info without loading the package.
 *
 * `precedence` controls conflict resolution between overlapping rules.
 * Lower number = stricter wins. Defaults are reserved per module:
 *   module-clean-code: 10
 *   module-fsd:        20
 *   module-cqrs:       30
 *   module-ddd:        40
 *   module-clean-arch: 50
 */
export const ModuleManifestSchema = z.object({
  name: z.string().regex(/^[a-z][a-z0-9-]*$/),
  version: z.string().min(1),
  description: z.string(),
  precedence: z.number().int(),
  dependencies: z.array(z.string()).default([]),
  provides: z.object({
    eslintConfig: z.boolean(),
    skills: z.boolean(),
    rubrics: z.boolean(),
  }),
});
export type ModuleManifest = z.infer<typeof ModuleManifestSchema>;
