import type { EslintConfigFragment } from '@forge-kit-dev/core';

/**
 * Mechanical rules for Clean Architecture on the frontend.
 *
 * We ship exactly one hard rule: the domain layer cannot import UI
 * framework packages. Every other Clean Arch concern (DIP, use-case
 * layer presence, adapter patterns) is advisory because enforcing
 * them by syntax would either require brittle project-wide graph
 * checks or produce constant false positives against ordinary React
 * code.
 */
export function cleanArchEslintConfig(): EslintConfigFragment {
  return {
    plugins: ['@forge-kit-dev/forge'],
    rules: {
      '@forge-kit-dev/forge/clean-arch-domain-isolation': 'error',
    },
  };
}
