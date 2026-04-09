# @forge-kit-dev/eslint-plugin-forge

Custom ESLint rules that ship with forge modules. Anything that the existing ecosystem already covers well (`@typescript-eslint/naming-convention`, `eslint-plugin-boundaries`, `eslint-plugin-react/boolean-prop-naming`) stays *outside* this package — we only host rules forge needs that don't exist elsewhere.

## Rules (v0.1 stubs)

| Rule | Module | Implemented in |
|---|---|---|
| `forge/component-max-lines` | `module-clean-code` | Step 3 |
| `forge/no-boolean-flag-arg` | `module-clean-code` | Step 3 |
| `forge/fsd-slice-boundary` | `module-fsd` | Step 2 |
| `forge/cqrs-layer-role` | `module-cqrs` | Step 6 |
| `forge/ddd-entity-id` | `module-ddd` | Step 4 |
| `forge/clean-arch-domain-isolation` | `module-clean-arch` | Step 5 |

Every rule is registered and typechecked in v0.1; their bodies are empty until their owning module lands. This lets `@forge-kit-dev/core` and `@forge-kit-dev/cli` reference the rules from their default configs without breaking the workspace build.

## Writing new rules

Use `createRule` from `src/create-rule.ts` so every rule gets a consistent docs URL pattern and plugs into the `forge/*` namespace.
