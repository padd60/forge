# @forge/example-nextjs-cqrs

Next.js 14 example showing forge's **CQRS mapping**:

- `src/entities/cart/` — **read model.** All exports are `readonly`
  types plus selectors (`selectCartTotal`). No mutation functions
  live here; the `@forge/forge/cqrs-layer-role` rule enforces that.
- `src/features/cart-add-item/` and `src/features/cart-checkout/` —
  **write side.** Each slice exports a command function
  (`addItemToCart`, `submitCheckout`) and React UI that dispatches
  the command.

Run from the monorepo root:

```bash
pnpm seed:examples
pnpm --filter @forge/example-nextjs-cqrs forge:check
```

## Demo violation branch

- `demo/cqrs-write-in-entity` — adds `export function createCart(...)`
  to `entities/cart/model/cart.ts`, expected to fail
  `@forge/forge/cqrs-layer-role` (entities must not expose commands).
