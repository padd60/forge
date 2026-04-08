---
name: fsd-public-api
description: Ensure slice-to-slice imports always go through a slice index.ts public API.
stage: generate
triggers: ["import", "export", "index.ts", "public api"]
---

# FSD public API

Every slice (a folder under a non-shared layer, e.g. `features/auth-login/`) must expose a **single public surface** through its `index.ts`. Consumers never import the slice's internals.

## The rules forge enforces

1. **Every slice has an `index.ts`.** Creating a slice without one is a scaffolding bug — write the index first.
2. **Cross-slice imports go through `index.ts`.** If feature `auth-login` needs a helper from feature `auth-profile`, the import must be `from '@/features/auth-profile'`, never `from '@/features/auth-profile/model/selectors'`.
3. **Internal files are private.** Any file inside a slice other than `index.ts` is private to that slice. The boundary rule will flag deep imports.
4. **Re-export only what is meant to be public.** Don't blanket-export every file. The purpose of `index.ts` is to *curate*, so if two files exist and only one should leak out, only re-export that one.

## Writing a well-shaped `index.ts`

```ts
// src/features/auth-login/index.ts

// Public UI the widget will render:
export { LoginForm } from './ui/login-form';

// Public hook downstream consumers might need:
export { useLoginSubmit } from './model/use-login-submit';

// Public types that are part of the slice contract:
export type { LoginInput } from './model/types';

// Everything else (selectors, helpers, fixtures) stays internal.
```

## Common smells

- **`export *` from an internal file.** That defeats the purpose of curating the surface. Name the exports explicitly.
- **`index.ts` re-exporting 30 things.** If a slice leaks 30 symbols, the slice probably does more than one thing — split it.
- **A consumer imports from `@/features/auth-login/model/...`.** That bypasses the public API. Either add the symbol to `index.ts` (if it should be public) or refactor the consumer (if it should not).

## When writing new code

- Adding a function the feature already needs internally? → Do NOT add it to `index.ts`.
- Adding a function a different slice will call? → Add it to `index.ts` together with the implementation.
- Deleting a function? → Also remove it from `index.ts` to keep the surface honest.
