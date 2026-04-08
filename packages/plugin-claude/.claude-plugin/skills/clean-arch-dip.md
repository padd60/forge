---
name: clean-arch-dip
description: Apply the Dependency Inversion Principle — inner layer defines the interface, outer layer implements it.
stage: generate
triggers: ["dip", "interface", "adapter", "port"]
---

# Dependency Inversion on the frontend

> High-level modules should not depend on low-level modules. Both should depend on abstractions. — Robert C. Martin

In a frontend app, "high-level" means business logic (use cases, entities) and "low-level" means fetch, localStorage, analytics, feature flags. DIP says the business logic should depend on **interfaces** it owns, and the infrastructure should *implement* those interfaces from the outside.

## The mistake DIP prevents

```ts
// ❌ useCheckoutCart.ts — business logic importing infrastructure directly
import axios from 'axios';
import { analytics } from '@/shared/analytics';

export async function checkoutCart(cart: Cart) {
  await axios.post('/api/checkout', { cart });
  analytics.track('cart_checkout', { total: cart.total });
}
```

Every test of `checkoutCart` now has to mock `axios` and `analytics`. Swapping axios for fetch means editing every call site. The business logic knows too much about delivery mechanism.

## The DIP fix

```ts
// ✅ checkout-cart.ts — depends on interfaces the feature owns
export interface PaymentAdapter {
  charge(amount: Money): Promise<Receipt>;
}

export interface AnalyticsAdapter {
  track(event: string, props: Record<string, unknown>): void;
}

export interface CheckoutDeps {
  payment: PaymentAdapter;
  analytics: AnalyticsAdapter;
}

export async function checkoutCart(
  cart: Cart,
  deps: CheckoutDeps
): Promise<CheckoutResult> {
  const receipt = await deps.payment.charge(cart.total);
  deps.analytics.track('cart_checkout', { total: cart.total.amount });
  return { kind: 'ok', receipt };
}
```

Tests pass fake implementations. Production wires real ones at a single composition root (e.g. `src/app/providers.tsx`).

## Common questions

**"Isn't this just dependency injection?"** Yes. DIP is the principle; dependency injection is the technique.

**"Do I need a DI container?"** No. Pass dependencies explicitly or through a React context at the composition root. Heavy DI containers are over-engineering for frontends.

**"How is this different from FSD's shared/api layer?"** `shared/api` is where adapters are *implemented*. The interfaces they implement should be declared by the inner layer (the feature that needs them). The two layers together give you the ports-and-adapters shape Clean Architecture asks for.

## What forge's Evaluator scores

The `r-clean-arch-dip` rubric scores your diff on:

1. How much business logic imports infrastructure directly.
2. Whether adapters are wired at a single composition root.

Advisory only — it's a judgment call, not a syntactic check.
