# Intentional violation: `demo/ddd-entity-no-id`

**Changed file:** `src/entities/order/model/order.ts`

**What was changed:** Removed the `id: string` field from the `Order`
interface and the `id` parameter from `makeOrder()`.

**Expected `forge check` output:**

```
src/entities/order/model/order.ts
  23:8  error  Entity type "Order" is missing an `id` field. DDD entities must be identifiable  @forge/forge/ddd-entity-id

✖ 1 problem (1 error, 0 warnings)
```

**Rule:** `@forge/forge/ddd-entity-id`

**How to fix:** Add `readonly id: string` (or any `id`-named field)
back to the interface.
