# @forge/module-fsd

Feature-Sliced Design module for forge. Ships the three-layer contribution every forge module can make:

| Layer | File(s) | Role |
|---|---|---|
| **Mechanical** | `src/eslint-config.ts` | ESLint rules that block on layer/slice/public-API violations |
| **Skill** | `skills/fsd-*.md` | Prompts Claude auto-activates while planning, generating, and evaluating FSD-shaped work |
| **Rubric** | `src/rubrics.ts` | Evaluator scoring guides for boundary, naming, and cohesion |

## Next.js compatibility

module-fsd follows the official [FSD + Next.js guide](https://feature-sliced.design/docs/guides/tech/with-nextjs) exactly: the Next.js `app/` (or `pages/`) directory lives at the **repo root**, while the FSD layers live under `src/`. Route files at the repo root only **re-export** page components from `src/pages/<page>`.

```
<repoRoot>/
├── app/                    # Next.js App Router (re-export wrappers only)
│   └── example/page.tsx    # export { ExamplePage as default } from '@/pages/example'
├── pages/                  # Next.js Pages Router (optional, empty folder)
└── src/
    ├── app/                # FSD app layer (providers, store, i18n)
    ├── pages/              # FSD pages (actual page components)
    ├── widgets/
    ├── features/
    ├── entities/
    └── shared/
```

`detectSliceLocation()` only inspects paths under `src/` and returns `null` for anything at the repo root, so the Next.js routing folder is transparent to every rule in this module.

## Rules

| Rule | Kind | Enforcement |
|---|---|---|
| `@forge/forge/fsd-slice-boundary` | Mechanical | Block. Covers upward imports, cross-slice references, and deep (non-public-API) imports in one pass. |

The three sub-checks live in one rule so a single walk over the AST handles every boundary concern — this keeps `forge check` fast in pre-commit.

## Skills

- `fsd-layer-placement` — planner stage; pick the right layer for a new file
- `fsd-public-api` — generator stage; keep slice surfaces small and explicit
- `fsd-composition` — evaluator stage; catch widgets that don't compose and shared code that leaks domain vocabulary

## Rubrics

- `r-fsd-boundary` (weight 1.0 across layer-direction/cross-slice/public-API)
- `r-fsd-naming` (feature verbs, entity nouns)
- `r-fsd-cohesion` (shared purity, widgets-compose)

Every criterion scores on 0 / 5 / 10 — there is no 7. The constraint is inherited from `RubricScoreSchema` in `@forge/schemas`, which refuses middle-ground scores so the Evaluator has to pick a side.
