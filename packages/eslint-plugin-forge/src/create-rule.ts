import { ESLintUtils } from '@typescript-eslint/utils';

/**
 * Factory used by every rule in this package. Standardizes the `docs`
 * URL pattern and forces every new rule to register against the
 * `forge/` namespace.
 *
 * The URL points to the rule doc in the forge monorepo; when we publish
 * docs (Step 12) we'll flip the base to the hosted site.
 */
export const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/your-org/forge/blob/main/packages/eslint-plugin-forge/docs/rules/${name}.md`
);
