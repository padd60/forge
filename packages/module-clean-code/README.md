# @forge-kit-dev/module-clean-code

Robert C. Martin's [Clean Code](https://www.oreilly.com/library/view/clean-code-a/9780136083238/) principles, narrowed to the 15 rules we can actually enforce on a React/Next.js codebase without drowning developers in false positives. 10 of them are mechanical (block); 5 are advisory (Evaluator rubrics).

## Mechanical rules (pre-commit block)

| Rule | Source | Owner |
|---|---|---|
| `@forge-kit-dev/forge/component-max-lines` | Clean Code ch. 3 "Small!" | custom ESLint rule (this repo) |
| `@forge-kit-dev/forge/no-boolean-flag-arg` | Clean Code ch. 3 "flag arguments" | custom ESLint rule (this repo) |
| `max-params` (limit 3) | Clean Code ch. 3 "few arguments" | ESLint core |
| `no-console` (allow warn/error) | soft SRP discipline | ESLint core |
| `complexity` (limit 12) | cognitive-complexity proxy | ESLint core |

v0.2 will add `@typescript-eslint/naming-convention`, `react/boolean-prop-naming`, and `@typescript-eslint/no-explicit-any` once the CLI wizard can install peer plugins automatically.

## Advisory rubrics (Evaluator)

- `r-clean-code-intent` — are variables and functions named after what they *mean*, not what they *are*?
- `r-clean-code-srp` — does this component have exactly one reason to change?
- `r-clean-code-boundary` — is error handling explicit, or buried under nulls and silent catches?

Every criterion is scored 0 / 5 / 10. The Evaluator is forbidden from picking 7 — see `RubricScoreSchema` in `@forge-kit-dev/schemas` for why. In short: a forced binary-ish choice stops the Evaluator from praising mediocre code.

## Skills

- `clean-code-component-size` — activated at Generator stage when the model is about to write a new React component.
- `clean-code-naming` — activated at Planner stage, before any file is created, so names start out intention-revealing.
- `clean-code-srp` — activated at Evaluator stage, after a sprint completes, so the reviewer can spot hidden responsibilities.

## Why only 50 lines?

Clean Code's explicit advice is "functions should hardly ever be 20 lines long". We chose 50 as a compromise because modern React components include a lot of JSX that Martin's original advice didn't anticipate. If your components routinely run past 50, consider whether *composition* or *hook extraction* is missing — not whether the rule is wrong.
