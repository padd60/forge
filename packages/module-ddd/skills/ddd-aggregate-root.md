---
name: ddd-aggregate-root
description: Identify the aggregate root for a new write operation and keep the invariants inside the aggregate.
stage: generate
triggers: ["aggregate", "invariant", "transaction", "write"]
---

# Aggregate root

An **aggregate** is a cluster of domain objects that must stay consistent together. The **root** is the single entity in that cluster that outsiders are allowed to reference. Everything else in the aggregate is reachable only through the root.

## The rule of thumb

Ask: *which object's invariants depend on the others?* That object is the root. For example, in a shopping cart the `Cart` is the root, and `CartLine` is internal — because the cart's invariant ("total matches sum of lines, and there are at most 50 lines") cannot be validated by looking at a single line.

## Writing a new write operation

1. **Find the aggregate.** Which cluster of objects has to be updated together?
2. **Find the root.** Which object owns the invariants for that cluster?
3. **Put the mutation on the root.** Add a method like `cart.addLine(product, quantity)`, not a standalone `addLineToCart(cartId, line)` helper.
4. **Validate inside.** The invariant check lives in the method, not in the caller.

## What forge's rule-of-thumb rejects

- External code that mutates `cart.lines[0].quantity` directly. Go through `cart.updateLineQuantity(...)` instead.
- Helper functions named `updateOrderStatus(order, newStatus)` that live outside the `Order` aggregate root.
- "Bag of setters" aggregates: if your root exposes `setName`, `setStatus`, `setTotal` without any invariant logic, you don't actually have an aggregate — you have a DTO.

## When the aggregate gets too big

A classic DDD anti-pattern is the "mega-aggregate" that owns half the domain. If your aggregate root exceeds a handful of fields or has methods that touch unrelated concerns, it has probably grown past what invariants actually require. Split it along the real invariant boundaries.
