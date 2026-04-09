/**
 * Regenerate `.forge/config.json` + `eslint.config.js` for every
 * playground/example directory by calling `runInit()` directly.
 *
 * Usage (from repo root):
 *   pnpm seed:examples
 *
 * Rationale: the examples are meant to *represent* what `forge init`
 * would produce for a user selecting a given module combination, so
 * the forge config they ship must be byte-identical to that output.
 * Hand-writing it would drift. This script is the canonical source
 * of truth; the parity test in `apps/cli/src/__tests__/examples-parity.test.ts`
 * enforces that the committed files still match what the script
 * would produce.
 *
 * Only touches forge-owned artifacts — never the FSD source tree
 * under `src/`. That way you can re-run it any time rules evolve
 * without clobbering example fixtures.
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runInit, type BuiltinModule } from '@forge-kit-dev/cli';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

interface ExampleSeed {
  readonly dir: string;
  readonly modules: readonly BuiltinModule[];
}

const EXAMPLES: readonly ExampleSeed[] = [
  {
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
    dir: 'examples/nextjs-fsd-minimal',
    modules: ['module-fsd', 'module-clean-code'],
  },
  {
    dir: 'examples/nextjs-fsd-ddd',
    modules: [
      'module-fsd',
      'module-clean-code',
      'module-ddd',
      'module-clean-arch',
    ],
  },
  {
    dir: 'examples/nextjs-cqrs',
    modules: ['module-fsd', 'module-clean-code', 'module-cqrs'],
  },
];

for (const seed of EXAMPLES) {
  const target = resolve(repoRoot, seed.dir);
  const result = await runInit({
    repoRoot: target,
    modules: seed.modules,
    enforcement: 'hybrid',
  });
  // eslint-disable-next-line no-console
  console.log(`seeded ${seed.dir}: ${result.resolvedModules.join(', ')}`);
}
