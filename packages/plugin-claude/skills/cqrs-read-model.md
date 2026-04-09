---
name: cqrs-read-model
description: Model the read side inside entities/ — readonly types, normalized shapes, no mutations.
stage: generate
triggers: ["read model", "query", "entities", "readonly"]
---

# Read models in entities/

When `module-cqrs` is active, the `entities/` layer is the **read side** of the CQRS pattern. Everything you place there must satisfy three invariants:

1. **Types are read-only.** Every exported `interface` or `type` in `entities/` has `readonly` on every property. The TypeScript compiler — and forge's `cqrs-layer-role` rule — refuses to mutate these shapes.
2. **No mutations live here.** Functions with command-shaped names (`create*`, `update*`, `delete*`, `submit*`, `save*`, `remove*`, `add*`, `reset*`, `patch*`) are forbidden in `entities/`. They belong to `features/`.
3. **Optimized for reading.** Shape your entities for fast rendering and easy selection. Normalize across aggregates if the UI reads them independently. Denormalize into a flat view model if a single screen needs everything at once.

## Example: a well-formed read model

```ts
// src/entities/order/model.ts

/** Read-only projection of an order for listing and detail screens. */
export interface OrderView {
  readonly id: string;
  readonly placedAt: string;
  readonly status: 'pending' | 'paid' | 'shipped' | 'delivered';
  readonly total: Money;
  readonly lines: readonly OrderLineView[];
}

export interface OrderLineView {
  readonly productId: string;
  readonly name: string;
  readonly quantity: number;
  readonly unitPrice: Money;
}

/** Selector over the read model. No mutations. */
export function totalLineCount(order: OrderView): number {
  return order.lines.reduce((acc, line) => acc + line.quantity, 0);
}
```

The `totalLineCount` function is fine because it **reads** the order and returns a derived value. It does not change anything.

## What forge rejects

- `export interface Order { id: string; }` — not marked `readonly`.
- `export type Order = { readonly id: string; lines: OrderLine[] };` — `lines` is not `readonly`.
- `export function addOrderLine(...) { ... }` — "add" prefix + function in `entities/` + command shape.

## When two "Orders" appear

It is normal for a CQRS-active app to have `OrderView` in `entities/order` and `PlaceOrderInput` in `features/cart-checkout`. They are two separate types serving two separate jobs. That is the whole point of CQRS — do not force them back into one shape.
