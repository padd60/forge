---
name: fsd-composition
description: Detect widgets that merely re-export a single feature, or shared code leaking domain concepts.
stage: evaluate
triggers: ["composition", "widget", "shared"]
---

# FSD composition health

This skill powers the Evaluator's review of widget / shared code shape. It's an advisory pass — it does not block commits. Use it to give the user a gentle nudge when the shape is wrong but the code still compiles.

## Widget smell: single-feature passthrough

If a widget's `index.ts` is 100% a re-export of one feature:

```ts
// ❌ widgets/login-section/index.ts
export { LoginForm } from '@/features/auth-login';
```

…then the widget is not composing. Either delete the widget and let the page import the feature directly, or add the missing composition (mixing multiple features, layout primitives, or copy).

## Widget smell: inline feature logic

If a widget owns `useState`, a mutation, or an API call that is **about the domain**, that logic belongs to a feature. The widget's job is to wire features together.

```tsx
// ❌ widgets/dashboard/dashboard.tsx
const [status, setStatus] = useState<"loading" | "ready">("loading");
const { data } = useQuery(["dashboard"], fetchDashboard);
```

Move the query and state into a feature like `dashboard-overview` and have the widget render `<DashboardOverview />`.

## Shared smell: domain vocabulary

`shared/` must be completely reusable outside this project. If you can take a file from `shared/` and drop it into an unrelated repo without renaming symbols, it belongs there.

```ts
// ❌ shared/lib/format-cart-total.ts
export function formatCartTotal(cart: Cart) { ... }
```

"Cart" is a domain concept. This belongs in `entities/cart/` or `features/cart-checkout/`, not shared.

## Shared smell: React imports in lib

`shared/lib/*` should be framework-agnostic. Anything that imports React is probably a UI primitive and belongs in `shared/ui/` instead.

## What the Evaluator reports

For each smell above, the Evaluator emits:

- the file path
- the specific symbol or line that triggered the smell
- a one-sentence suggested move (which layer or slice the code should land in)

Scoring uses `r-fsd-cohesion`:

- **10** — no smells detected in the diff
- **5** — one or two local smells that are easy to move
- **0** — widespread leaks; the diff cannot be merged as-is without splitting responsibilities
