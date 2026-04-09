# @forge-kit-dev/module-clean-arch

Clean Architecture principles distilled into what actually applies to a React/Next.js app. Precedence **50** — the weakest of the v0.1 modules, because Clean Architecture is a target shape, not a line-by-line rulebook.

## Mechanical (block)

| Rule | What it does |
|---|---|
| `@forge-kit-dev/forge/clean-arch-domain-isolation` | Forbids imports of framework packages (`react`, `react-dom`, `next`, `next/*`) from files that live inside a domain folder (`src/domain/**` or `src/entities/**` by default). |

This is the single hard rule because framework leakage into the domain is both easy to detect (path + import specifier) and genuinely harmful: once `react` is in the domain, you cannot test your business logic without a renderer.

## Advisory (Evaluator)

- `r-clean-arch-dip` — are adapters injected at a single composition root, and does inner-layer code depend on interfaces rather than concrete infrastructure?
- `r-clean-arch-use-case` — are user-facing actions expressed as use-case functions that can be read independently of the UI that triggers them?

## Skills

- `clean-arch-use-case` (plan stage) — decide what becomes a use case and what stays as a UI handler
- `clean-arch-dip` (generate stage) — declare interfaces the inner layer owns, let adapters implement from outside

## When to turn this on

- You have meaningful business logic on the frontend (not just UI glue)
- You want infrastructure (axios/fetch/analytics) to be swappable
- You care about testing business flows without mounting components

Otherwise, skip this module. A thin frontend does not need Clean Architecture and it will feel like ceremony.
