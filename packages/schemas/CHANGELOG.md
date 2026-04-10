# @forge-kit-dev/schemas

## 0.2.0

### Minor Changes

- a720fdc: Initial public release: FSD, Clean Code, DDD, Clean Architecture, CQRS
  modules + Planner/Generator/Evaluator pipeline with file-based handoff
  under `.forge/runs/<runId>/`.

### Patch Changes

- 7cc915f: Fix stale-dist publish sending incomplete `@forge-kit-dev/eslint-plugin-forge`
  tarballs. The 0.1.0 artifact shipped only six of the nine rules, so any
  consumer that enabled `module-fsd` or `module-clean-code` saw ESLint fail
  with "Definition for rule '@forge-kit-dev/forge/fsd-no-wildcard-reexport'
  was not found" (and the same for `fsd-layer-typo` and `no-type-escape`).

  All three rules were implemented and built locally but never made it into
  the published tarball because the release path had no guarantee the `dist/`
  directory was rebuilt from current source before `npm publish` packed it.

  Two changes in this patch:

  1. Republish the fixed group at 0.1.1 with the full nine-rule set baked in.
  2. Add a `prepublishOnly` hook (`pnpm run clean && pnpm run build`) to every
     publishable package so the same class of bug cannot recur — publishing
     now forces a clean rebuild of each package immediately before `npm pack`
     captures its files.
