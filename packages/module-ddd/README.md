# @forge-kit-dev/module-ddd

Domain-Driven Design as a forge module. Precedence **40** — weaker than Clean Code (10) and FSD (20). DDD is about language and shape, not about runtime checks, so most of this module's enforcement is advisory rather than mechanical.

## What is mechanical (pre-commit block)

| Rule | What it does |
|---|---|
| `@forge-kit-dev/forge/ddd-entity-id` | Every type declared under `src/entities/**` (or explicitly marked with a `@entity` JSDoc tag) must include an `id` field. |

Only one mechanical rule lives here because every other DDD concept depends on reading intent. Forcing them at the lint level produces more noise than signal.

## What is advisory (Evaluator rubrics)

- `r-ddd-ubiquitous-language` — does the code reuse business vocabulary (basket vs cart) and is the glossary updated alongside?
- `r-ddd-aggregate-integrity` — do writes go through aggregate roots, and are invariants enforced inside the aggregate rather than scattered in UI?

## Skills

- `ddd-bounded-context` (plan stage) — pick a context for a new file, respect its language
- `ddd-aggregate-root` (generate stage) — find the root, put mutations on it
- `ddd-value-object` (generate stage) — entity vs value object decision, immutable modeling

## Why DDD is so sparse here

If your frontend is a thin UI for a fat backend, DDD on the frontend is mostly unnecessary. Turn this module on when:

- The frontend holds non-trivial business rules (e.g. a financial calculator, a rules engine UI, an offline-first app)
- Multiple teams contribute and need a shared vocabulary
- You have a clear domain expert driving the language

Otherwise, leave it off. It will just add rubric noise.
