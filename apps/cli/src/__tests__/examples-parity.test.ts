import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { runInit } from '../commands/init.js';
import type { ForgeConfigOnDisk } from '../io/write-config.js';
import type { BuiltinModule } from '../wizard/dependency-resolver.js';

/**
 * Drift guard for the playground + examples directories.
 *
 * The committed `.forge/config.json` and `eslint.config.js` files
 * under `apps/playground/` and `examples/*` must match what
 * `runInit()` would produce for the module set that each example is
 * supposed to demonstrate. If someone edits the committed file by
 * hand — or if `writeEslintConfig` changes shape — this test flags
 * it immediately so the `pnpm seed:examples` step has to be rerun
 * before the change can land.
 *
 * The comparison is byte-exact on eslint.config.js (because the
 * renderer is deterministic) and order-insensitive on
 * config.json's `activeModules` (because dependency resolution can
 * reorder the input). This is the same contract the parity CI job
 * enforces in Step 11.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
// Walk up: __tests__ → src → apps/cli → apps → <repoRoot>
const repoRoot = resolve(__dirname, '..', '..', '..', '..');

interface ExampleTarget {
  readonly name: string;
  readonly dir: string;
  readonly modules: readonly BuiltinModule[];
}

const TARGETS: readonly ExampleTarget[] = [
  {
    name: 'apps/playground',
    dir: 'apps/playground',
    modules: [
      'module-fsd',
      'module-clean-code',
      'module-ddd',
      'module-clean-arch',
      'module-cqrs',
    ],
  },
  {
    name: 'examples/nextjs-fsd-minimal',
    dir: 'examples/nextjs-fsd-minimal',
    modules: ['module-fsd', 'module-clean-code'],
  },
  {
    name: 'examples/nextjs-fsd-ddd',
    dir: 'examples/nextjs-fsd-ddd',
    modules: [
      'module-fsd',
      'module-clean-code',
      'module-ddd',
      'module-clean-arch',
    ],
  },
  {
    name: 'examples/nextjs-cqrs',
    dir: 'examples/nextjs-cqrs',
    modules: ['module-fsd', 'module-clean-code', 'module-cqrs'],
  },
];

describe('examples/playground parity with runInit()', () => {
  for (const target of TARGETS) {
    it(`${target.name} matches runInit output`, async () => {
      const committedDir = resolve(repoRoot, target.dir);
      const committedConfig = JSON.parse(
        await readFile(join(committedDir, '.forge', 'config.json'), 'utf8')
      ) as ForgeConfigOnDisk;
      const committedEslint = await readFile(
        join(committedDir, 'eslint.config.js'),
        'utf8'
      );

      const tmp = await mkdtemp(join(tmpdir(), `forge-parity-`));
      try {
        await runInit({
          repoRoot: tmp,
          modules: target.modules,
          enforcement: 'hybrid',
        });

        const generatedConfig = JSON.parse(
          await readFile(join(tmp, '.forge', 'config.json'), 'utf8')
        ) as ForgeConfigOnDisk;
        const generatedEslint = await readFile(
          join(tmp, 'eslint.config.js'),
          'utf8'
        );

        // activeModules can be reordered by dependency resolution;
        // compare as sorted sets.
        expect([...generatedConfig.activeModules].sort()).toEqual(
          [...committedConfig.activeModules].sort()
        );
        expect(generatedConfig.enforcement).toBe(committedConfig.enforcement);
        expect(generatedConfig.version).toBe(committedConfig.version);
        expect(generatedConfig.evaluator).toEqual(committedConfig.evaluator);
        // eslint.config.js is a byte-for-byte contract.
        expect(generatedEslint).toBe(committedEslint);
      } finally {
        await rm(tmp, { recursive: true, force: true });
      }
    });
  }
});
