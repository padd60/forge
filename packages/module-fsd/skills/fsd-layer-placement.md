---
name: fsd-layer-placement
description: Decide which FSD layer a new piece of code belongs to, before any file is created.
stage: plan
triggers: ["new file", "new component", "layer", "feature", "widget"]
---

# FSD layer placement

When you are about to create a new file in a forge-managed project, stop and answer these in order:

## 1. Is this framework or library glue?

- Webpack/Vite loaders, ESLint rules, Storybook decorators, generic form helpers → `shared/`
- A generic `<Button>` that knows nothing about users, posts, or carts → `shared/ui/`
- A Zod extension or a typed `fetch` wrapper → `shared/lib/` or `shared/api/`

If yes, this file is **shared/**. Stop.

## 2. Does it model a domain concept as data?

- `User`, `Post`, `CartItem` types and their mappers → `entities/<noun>/`
- Read-only derived data: `entities/<noun>/model/selectors.ts`

Entities are **nouns**. They never own mutations. When forge's CQRS module is active, `entities/*` is literally read-only at the type level.

## 3. Does it execute a user-visible action?

A feature is an **action**, not a thing. Its name should be a verb phrase: `auth-login`, `cart-checkout`, `post-publish`, not `user` or `cart`.

- Mutations, form submission, optimistic updates → `features/<verb>/`
- The UI and model of that action live together in the same slice.

## 4. Does it compose multiple features into one UI region?

Headers, dashboards, settings panels that stitch together login + notifications + profile → `widgets/<region>/`.

A widget should not implement feature logic; it should orchestrate features. If a "widget" has state of its own, it is probably a feature.

## 5. Is it a page?

- Route-level screens that exist once per URL → `pages/<page>/`
- Wrap the page output and re-export it from the Next.js routing file:
  ```ts
  // <repoRoot>/app/example/page.tsx
  export { ExamplePage as default } from '@/pages/example';
  ```

## 6. Is it app-wide configuration?

Providers, store bootstrap, i18n init, router wrapping → `src/app/`. Remember: `src/app/` is forge's FSD `app` layer, distinct from Next.js's `<repoRoot>/app/` routing folder.

## Tie-breaking

If two answers feel equally correct, choose the **lower** (wider) layer — it's easier to promote a file up than to demote it. Lower layers are: shared → entities → features → widgets → pages → app.

## What forge will reject

- Creating `src/features/user/` — features must be verbs
- Putting domain types in `shared/`
- Creating a widget with its own mutations
- Cross-slice imports between sibling features
- Deep imports that bypass a slice's `index.ts`
