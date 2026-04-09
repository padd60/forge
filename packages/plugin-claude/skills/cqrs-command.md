---
name: cqrs-command
description: Own commands in features/ — named after actions, return a result, sync the read side explicitly.
stage: generate
triggers: ["command", "mutation", "write", "feature", "action"]
---

# Commands in features/

Commands are the "write" half of CQRS. In forge they live exclusively in `features/` — nothing in `entities/` is allowed to mutate anything. Commands have four required properties:

1. **They are named after the action.** `placeOrder`, `cancelSubscription`, `favoritePost` — always a verb phrase.
2. **They accept a purpose-built input type.** Not the read-side `OrderView` — a dedicated `PlaceOrderInput` that only contains the fields the command needs.
3. **They return a result, not void.** Typically `Result<Success, Failure>` or at minimum the updated read-side representation. Even side-effect-only commands return an explicit "ok" shape so the caller can handle failure.
4. **They declare how the read side reacts.** Via a dedicated hook (`useMutation` with `onSuccess` invalidation, for example) or via a short code comment explaining the sync strategy.

## Example: a well-formed command

```ts
// src/features/cart-checkout/model/place-order.ts
import type { Cart } from '@/entities/cart';
import type { OrderView } from '@/entities/order';

export interface PlaceOrderInput {
  cart: Cart;
  paymentMethod: 'card' | 'paypal';
}

export type PlaceOrderResult =
  | { kind: 'ok'; order: OrderView }
  | { kind: 'error'; reason: 'payment-declined' | 'out-of-stock' };

export async function placeOrder(
  input: PlaceOrderInput,
  deps: PlaceOrderDeps
): Promise<PlaceOrderResult> {
  // 1. Validate invariants.
  if (input.cart.lines.length === 0) {
    return { kind: 'error', reason: 'out-of-stock' };
  }
  // 2. Charge through the injected payment adapter (DIP).
  const charge = await deps.payment.charge(input.cart.total);
  if (!charge.ok) return { kind: 'error', reason: 'payment-declined' };
  // 3. Return the new read-side shape. Caller invalidates the
  //    `orders` query on success.
  return { kind: 'ok', order: charge.createdOrder };
}
```

## Sync strategies the Evaluator looks for

- **Invalidation.** Mutation finishes → caller invalidates the relevant read queries.
- **Optimistic update.** Mutation starts → caller writes the expected new shape into the cache immediately, rolls back on failure.
- **Refetch-on-success.** Mutation finishes → caller refetches the specific queries it knows changed.

The Evaluator scores `r-cqrs-split.sync-strategy` on whether *any* explicit strategy is present. Silent writes that leave the read side stale score zero.

## What forge will reject at the entities side

Anything in `entities/<slice>/` named `createX`, `updateX`, `deleteX`, `submitX`, `saveX`, `removeX`, `addX`, `resetX`, or `patchX`. The rule does not care about the body — just the name and location. Move it to `features/` and give `entities/` a read-side selector instead.
