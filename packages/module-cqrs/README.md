# @forge/module-cqrs

CQRS as an opt-in module. Precedence **30**. Depends on `@forge/module-fsd` because the enforcement mapping relies on FSD's `entities/` and `features/` layers being real folders.

## The forge mapping (one sentence)

**`entities/` is the read side, `features/` is the write side.**

## Mechanical (block)

| Rule | What it enforces |
|---|---|
| `@forge/forge/cqrs-layer-role` | Every exported type under `src/entities/**` has `readonly` on every property, and no exported function in `entities/` has a command-shaped name (`create*`, `update*`, `delete*`, `submit*`, `save*`, `remove*`, `add*`, `reset*`, `patch*`). |

The rule fires on the **entities side** because that is where violations are cheapest to detect. The symmetric "commands must be in features/" is already implicit: if a command-named function exists in `shared/` or `widgets/`, FSD's own layer rules will flag it as a boundary violation.

## Advisory (Evaluator)

- `r-cqrs-split` — are read-side and write-side types distinct, and does every command declare how the read model will react to its success?

## Skills

- `cqrs-read-model` (generate stage) — readonly types, normalized shapes, no mutation methods in entities/
- `cqrs-command` (generate stage) — action-named, input-typed, result-returning, sync-aware commands in features/

## When this module is worth it

- Your read side and write side have different shapes or different performance characteristics (e.g. an admin dashboard that lists normalized data but submits flat form payloads)
- You use a cache layer like TanStack Query or Apollo that benefits from explicit mutation/invalidation separation
- You need to explain to future contributors *where* to add a new mutation vs a new selector

## When to skip it

For a 10-page CRUD app, CQRS is usually overkill. Fowler's original caution applies to forge as much as to backends: use sparingly. Forge's default CLI wizard therefore leaves this module **off** by default.
