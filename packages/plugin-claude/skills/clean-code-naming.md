---
name: clean-code-naming
description: Pick intention-revealing names that survive being quoted out of context.
stage: plan
triggers: ["name", "rename", "variable", "function", "helper"]
---

# Intention-revealing names

A good name answers three questions before you need to read the code:

1. **What does this hold or do?**
2. **Why does it exist?**
3. **How will it be used?**

## Tests your name must pass

- **The out-of-context test.** Quote the name in a code review comment with no surrounding file. If the reader still knows what it is, the name is good.
- **The antonym test.** Can you picture the opposite? `isLoading` has `isLoaded`. `data` does not have a meaningful opposite and is therefore hollow.
- **The boundary test.** Would this name also be correct inside a completely different slice? If yes, it is too generic.

## Rename signals forge will surface

- Variables named `data`, `info`, `tmp`, `value`, `obj`, `x` inside non-trivial bodies
- Functions named by type (`userHelper`, `dataValidator`, `postManager`)
- Parameters named for their position (`first`, `arg1`, `a`, `b`) in functions with 2+ args
- Boolean variables without a predicate prefix (`loading` → `isLoading`, `disabled` → `isDisabled`, `submit` → `canSubmit`)

## What about shorthand?

Short names are fine inside short scopes. The rule Clean Code actually applies is:

> The length of a name should correspond to the size of its scope.

A loop counter `i` is fine inside a three-line `for`. A module-level function `i` is a crime.

## Domain vocabulary

In a forge project with FSD + DDD modules active, names should use the domain's **ubiquitous language**. If your product says "Basket", your code says `basket`, not `cart`. Renaming concepts between domain and code is a classic source of bugs, and the Evaluator will flag it as an advisory violation of the DDD rubric when `module-ddd` is on.

## When you cannot pick a name

If you spend more than ~30 seconds naming a symbol, the symbol probably does too many things. Split it first; the names will then come for free.
