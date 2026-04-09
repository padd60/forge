# @forge-kit-dev/schemas

Zod schemas that define the file-based contracts shared by every agent and module in forge.

## Why schemas are a separate package

Forge's Planner, Generator, and Evaluator never share memory — they communicate by writing and reading JSON files under `.forge/runs/<runId>/`. If those files are the wire protocol, the schemas are the IDL. Extracting them into their own tiny package means:

- modules and agents depend on the contract, not on each other
- `forge check` can validate any persisted file in isolation
- third-party modules can be written against the schemas without pulling core

## Exports

- `EnforcementLevel` — `'hybrid' | 'block-all' | 'advisory-only'`
- `Spec` — Planner output (goal, sprints, active modules)
- `Handoff` — transition artifact between agents and sprints
- `Rubric`, `RubricCriterion`, `RubricScore`, `EvalReport` — Evaluator wire format
- `ModuleManifest` — declared capabilities of a module
- `RunRequest` — metadata for a P-G-E execution

All exports are Zod schemas plus their inferred TypeScript types.
