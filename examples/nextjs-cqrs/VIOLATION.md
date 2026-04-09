# Intentional violation: `demo/cqrs-write-in-entity`

**Changed file:** `src/entities/cart/model/cart.ts`

**What was changed:** Added `export function createCart(...)` — a
command-named function — directly inside the `entities/` layer.

**Expected `forge check` output:**

```
src/entities/cart/model/cart.ts
  20:8  error  Command export "createCart" is declared in entities/.
               Commands must live in features/  @forge/forge/cqrs-layer-role

✖ 1 problem (1 error, 0 warnings)
```

**Rule:** `@forge/forge/cqrs-layer-role`

**How to fix:** Move the `createCart` function to
`src/features/cart-create/model/create-cart.command.ts` (or another
features/ slice). The entities layer is the read model and must not
export mutation functions.
