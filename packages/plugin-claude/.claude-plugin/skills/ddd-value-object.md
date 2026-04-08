---
name: ddd-value-object
description: Choose between an entity and a value object, and model value objects as immutable structures.
stage: generate
triggers: ["value object", "readonly", "immutable", "type"]
---

# Value objects vs entities

An **entity** has identity — the same `User` persists across changes to its fields. A **value object** is defined entirely by its attributes — two `Money(5, "USD")` are indistinguishable, and if you change one, it isn't "the same thing with new values", it is a different value entirely.

## The identity test

Ask: *if two instances had the same field values, would we consider them the same thing?*

- **Yes → value object.** `Money`, `DateRange`, `Address`, `Percentage`, `Color`.
- **No → entity.** `User`, `Order`, `Post`. Two users can have identical profile fields and still be distinct.

## How forge models each

**Entities** are declared under `entities/<noun>/model/` and must include an `id` field (enforced by `@forge/forge/ddd-entity-id`). Changing a field returns the same entity; you don't "make a new user because the email changed".

**Value objects** live as plain TypeScript types with `readonly` properties. Changing a field returns a new value object:

```ts
type Money = {
  readonly amount: number;
  readonly currency: 'USD' | 'KRW' | 'EUR';
};

function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new Error('currency mismatch');
  return { amount: a.amount + b.amount, currency: a.currency };
}
```

Notice: no `id`, no methods on the object itself, `readonly` everywhere. Operations are pure functions that return new values.

## The "free upgrade" from primitives

A common refactor: wrap a primitive that gets validated or formatted in many places into a value object.

```ts
// Before
function sendEmail(to: string, subject: string) { ... }

// After
type EmailAddress = { readonly value: string };
function parseEmail(raw: string): EmailAddress | null { ... }
function sendEmail(to: EmailAddress, subject: string) { ... }
```

Now the validation lives once, callers cannot pass a raw string, and the type itself documents what `to` means.

## What forge's Evaluator checks

- Entity types have an `id` field (mechanical).
- Types named after obvious value concepts (`Money`, `DateRange`, `Address`) use `readonly` on every field (advisory rubric).
- Pure functions live alongside value-object types, not methods on the type itself (advisory rubric).
