---
name: clean-arch-use-case
description: Decide whether a piece of logic belongs in a use case, a UI handler, or an entity method.
stage: plan
triggers: ["use case", "service", "action", "workflow"]
---

# Use cases

A **use case** is a named, callable function that represents *one thing the user or system can do* — "check out cart", "reset password", "publish draft post". Clean Architecture insists that use cases live in a dedicated layer, separate from both the UI that triggers them and the entities they operate on.

## Why separate them

- **Readability.** You can list all the things your system does by listing the use-case files. A new hire can navigate the business flow without decoding React components.
- **Testability.** Use cases can be tested with pure function tests; no component mounting, no `userEvent`.
- **Portability.** If you add a CLI or a background job that needs to "check out cart", you call the use case directly — no UI required.

## forge's recommended placement

When `module-fsd` is active, use cases live inside feature slices:

```
src/features/cart-checkout/
├── index.ts                      # public API: re-exports the use case + UI
├── model/
│   ├── checkout-cart.ts          # ← use case (verb + noun name)
│   └── checkout-cart.types.ts
└── ui/
    └── checkout-button.tsx       # calls the use case
```

The UI component's `onClick` handler calls `checkoutCart(input)`. The use case coordinates entities, adapters, and side effects. The UI never contains orchestration logic.

## What a use case looks like

```ts
// src/features/cart-checkout/model/checkout-cart.ts
import type { Cart } from '@/entities/cart';
import type { PaymentAdapter } from '@/shared/api/payment';

export interface CheckoutCartInput {
  cart: Cart;
  paymentAdapter: PaymentAdapter;
}

export async function checkoutCart(
  input: CheckoutCartInput
): Promise<CheckoutResult> {
  // 1. Validate cart invariants (delegates to cart aggregate).
  if (input.cart.lines.length === 0) {
    return { kind: 'error', reason: 'cart-empty' };
  }
  // 2. Charge via injected adapter.
  const receipt = await input.paymentAdapter.charge(input.cart.total);
  // 3. Return a result the UI can render.
  return { kind: 'ok', receipt };
}
```

Notice: the payment adapter is **injected**, not imported from an infrastructure package. That's DIP in practice — see `clean-arch-dip` for more.

## When NOT to make a use case

Don't create a use case for trivial event handlers. `onClose={() => setOpen(false)}` is fine inline. The test is: **would this make sense to call from outside the UI?** If not, it's a UI handler, not a use case.
