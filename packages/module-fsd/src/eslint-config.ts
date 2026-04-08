import type { EslintConfigFragment } from '@forge/core';

/**
 * ESLint config fragment contributed by module-fsd.
 *
 * forge does not generate a full `.eslintrc` on its own — it emits
 * fragments and the CLI merges them into the user's config through
 * `@forge/core`'s conflict-resolver. Anything beyond the three
 * FSD-specific rules below stays out of this file by design; general
 * Clean Code rules belong to module-clean-code, not here.
 */
export function fsdEslintConfig(): EslintConfigFragment {
  return {
    plugins: ['@forge/forge'],
    rules: {
      // Layer-direction, cross-slice, and public-API checks in one rule.
      '@forge/forge/fsd-slice-boundary': 'error',
    },
  };
}
