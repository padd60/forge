---
name: ddd-bounded-context
description: Decide which bounded context a new model belongs to, and how much ubiquitous language it must respect.
stage: plan
triggers: ["bounded context", "domain", "model", "entity"]
---

# Bounded context

A bounded context is a region of code where a single interpretation of the domain language holds. In a forge-managed Next.js app, a bounded context usually maps to a **group of FSD slices that share a vocabulary** — for example `features/cart-*` + `entities/cart` + `entities/cart-line` is one context called "Cart", while `features/auth-*` + `entities/user` is another called "Identity".

## Why this matters

The same word can mean different things in different contexts. "Order" to the shipping team is a physical delivery; to the billing team it is a payable invoice. If you conflate them, every change ripples sideways. DDD's answer is: **draw a boundary, give each context its own vocabulary, and translate at the border**.

## Rules forge's Evaluator checks

1. **Names inside a context match the business vocabulary.** If the business calls it a "basket", the code calls it `basket` — never `cart`.
2. **Concepts from another context enter through an anti-corruption layer.** If the Cart context needs a `User`, it imports a `Shopper` type shaped by what Cart actually needs, not the raw `User` from the Identity context.
3. **A single entity does not exist in two contexts.** If you find yourself importing `entities/user/User` from three different feature groups that disagree about its shape, split the type: give each context its own, narrower type.

## Writing new code

When you create a file, ask: **which bounded context is this?** Then check the `docs/glossary.md` (or wherever the domain vocabulary lives) and use the exact words the business uses. If a word is missing from the glossary, **add it first**, then use it.

## The easy mistake

Treating FSD slices as if they *are* bounded contexts. Slices are UI organization; contexts are domain organization. One context often spans several slices. A wrong shortcut is to pretend `features/some-slice` is its own context — usually it is a sub-capability of a wider context that deserves its own glossary entry.
