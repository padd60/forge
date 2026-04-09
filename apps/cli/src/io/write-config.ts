import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type { EnforcementLevel } from '@forge-kit-dev/schemas';

/**
 * The on-disk shape of `.forge/config.json`. A strict subset of
 * `ForgeConfig` from `@forge-kit-dev/core` with paths inferred at load time so
 * the file itself stays location-independent (users should be able to
 * rename the repo without editing config).
 *
 * Deliberately omitted from this shape:
 *  - `paths`: always derived from the file's location at read time
 *  - the `Module` objects: resolved from `activeModules` by the CLI
 *    registry
 */
export interface ForgeConfigOnDisk {
  version: 1;
  enforcement: EnforcementLevel;
  activeModules: readonly string[];
  evaluator: {
    minScore: number;
    maxIterations: number;
  };
}

export interface WriteConfigOptions {
  repoRoot: string;
  config: ForgeConfigOnDisk;
}

/**
 * Persist the config to `<repoRoot>/.forge/config.json`. Always emits
 * keys in a stable order so regenerating the file produces an empty
 * git diff when nothing changed — important for the idempotent
 * semantics of `forge init`/`forge add`.
 */
export async function writeForgeConfig(
  opts: WriteConfigOptions
): Promise<string> {
  const filePath = join(opts.repoRoot, '.forge', 'config.json');
  await mkdir(dirname(filePath), { recursive: true });
  const ordered: ForgeConfigOnDisk = {
    version: 1,
    enforcement: opts.config.enforcement,
    activeModules: [...opts.config.activeModules],
    evaluator: {
      minScore: opts.config.evaluator.minScore,
      maxIterations: opts.config.evaluator.maxIterations,
    },
  };
  await writeFile(filePath, `${JSON.stringify(ordered, null, 2)}\n`, 'utf8');
  return filePath;
}
