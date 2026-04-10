import type { EslintConfigFragment } from '@forge-kit-dev/core';

/**
 * ESLint config fragment contributed by module-clean-code. It focuses
 * on rules that are *broadly applicable*, *cheap in pre-commit*, and
 * *not already covered elsewhere*. Things like PascalCase component
 * names or hook-use prefixes will be delegated to
 * `@typescript-eslint/naming-convention` in v0.2 once a CLI wizard
 * can install that plugin into the user's workspace — for v0.1 we
 * ship only rules that do not require extra peer dependencies.
 *
 * What's Block (pre-commit):
 *   - `@forge-kit-dev/forge/component-max-lines`   — Clean Code #3 "Small!"
 *   - `@forge-kit-dev/forge/no-boolean-flag-arg`  — Clean Code #3 "flag args"
 *   - `max-params` (ESLint core)           — Clean Code #3 "few args"
 *   - `no-console`                         — mild form of SRP discipline
 *   - `complexity` (ESLint core)           — cognitive-complexity proxy
 *
 * What's Advisory (Evaluator rubric only, see `rubrics.ts`):
 *   - Intent clarity in naming
 *   - Null-return vs Result pattern
 *   - Props drilling depth
 *   - Custom hook extraction opportunities
 *   - SRP violations at the component level
 */
export function cleanCodeEslintConfig(): EslintConfigFragment {
  return {
    plugins: ['@forge-kit-dev/forge'],
    rules: {
      '@forge-kit-dev/forge/component-max-lines': ['error', { max: 50 }],
      '@forge-kit-dev/forge/no-boolean-flag-arg': 'error',
      // Flag any, as casts, @ts-ignore, non-null assertions in exported code.
      '@forge-kit-dev/forge/no-type-escape': 'error',
      'max-params': ['error', 3],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      complexity: ['warn', 12],
    },
  };
}
