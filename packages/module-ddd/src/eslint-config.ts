import type { EslintConfigFragment } from '@forge-kit-dev/core';

/**
 * Mechanical rules for the DDD module.
 *
 * Front-end DDD is largely a discipline of naming and shape, not of
 * runtime checks. The one check that is both cheap and universally
 * agreed-upon is: every entity has an identity field (`id`). Anything
 * more ambitious — aggregate roots, value-object immutability,
 * bounded-context isolation — is surfaced through the Evaluator's
 * rubrics in `rubrics.ts`, because enforcing them mechanically
 * produces more false positives than genuine catches.
 */
export function dddEslintConfig(): EslintConfigFragment {
  return {
    plugins: ['@forge-kit-dev/forge'],
    rules: {
      '@forge-kit-dev/forge/ddd-entity-id': 'error',
    },
  };
}
