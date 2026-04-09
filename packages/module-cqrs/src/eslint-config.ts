import type { EslintConfigFragment } from '@forge-kit-dev/core';

/**
 * Mechanical rules for the CQRS mapping (entities = read model,
 * features = command/write side).
 *
 * We only ship one ESLint rule: `cqrs-layer-role`. It enforces the
 * entities-side half of the contract — all exported types are
 * read-only and no command-shaped functions leak out of entities.
 * The features-side half ("commands MUST live in features/") is
 * already implicit in FSD's layer direction, so we do not duplicate
 * it here.
 */
export function cqrsEslintConfig(): EslintConfigFragment {
  return {
    plugins: ['@forge-kit-dev/forge'],
    rules: {
      '@forge-kit-dev/forge/cqrs-layer-role': 'error',
    },
  };
}
