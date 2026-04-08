---
name: clean-code-srp
description: Check whether a component or hook has more than one reason to change.
stage: evaluate
triggers: ["srp", "single responsibility", "component", "refactor"]
---

# SRP at the component level

Robert Martin defines SRP as:

> A module should be responsible to one, and only one, actor.

"Actor" is the key word. An *actor* is a group of people — or a stakeholder — who cause change. Finding SRP violations therefore means enumerating the change-reasons for a module and checking they all trace back to one actor.

## The change-reasons test

Pick any component in the diff. List, out loud, the kinds of future change that would require you to touch it:

- "If marketing changes the price copy..."
- "If the API adds a new field..."
- "If the layout designer tweaks the grid..."
- "If analytics adds a new event..."

If more than one of those bullets is plausible and they are **caused by different actors**, the component is violating SRP. It needs to be split.

## Common SRP violators in React

1. **"Smart card"** — a `<ProductCard>` that fetches its own data, handles add-to-cart, and renders the UI. Three reasons to change: data shape (backend actor), action logic (cart team actor), visual design (design actor).
2. **"Configurable swiss-army hook"** — `useUser()` that returns user data, permissions, and the current session token. Three consumers, three reasons to change.
3. **"Formatting helper that knows your API shape"** — `formatOrderSummary(order)` that takes a raw API response. Changes when the API changes *and* when the copy changes.

## The Evaluator's scoring

For this rubric (`r-clean-code-srp`), the Evaluator looks at the diff and:

1. For each new/changed component and hook, enumerates its change-reasons in the report.
2. Scores per the 0/5/10 guide in `rubrics.ts`.
3. Where the score is below 10, includes specific refactor suggestions: which responsibility to extract, into which layer.

## Why this is advisory, not blocking

SRP violations are real but judgment-dependent. A hard block would produce endless false positives on early-stage code where "one actor" is obvious only in hindsight. forge runs this check as a *rubric*, so the Evaluator can say "this looks SRP-y in five places, here's what I'd pull out", and the developer can decide.
