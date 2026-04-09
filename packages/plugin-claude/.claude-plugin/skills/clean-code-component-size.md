---
name: clean-code-component-size
description: Keep React components small by deciding when to extract a custom hook or a sub-component.
stage: generate
triggers: ["component", "hook", "useEffect", "useState", "lines"]
---

# Component size

forge enforces a hard ceiling of **50 lines per component body**. The rule is not about pleasing a linter — it is Clean Code's "Small!" principle applied to React:

> The first rule of functions is that they should be small. The second rule is that they should be smaller than that. — *Clean Code*, ch. 3

## What "50 lines" counts

The counter looks at the function body (the `{ ... }` block), not the whole file. JSX counts as lines. Type declarations above the component do not. Comments above the return also do not.

```tsx
export function ProductCard(props: ProductCardProps) {   // ← opening brace
  const { product } = props;
  const price = useFormattedPrice(product.price);        // ← counted
  return (
    <article>                                            // ← counted
      ...
    </article>
  );
}                                                         // ← closing brace
```

## When your component hits the ceiling

Apply these in order until you are back under 50:

1. **Extract a custom hook.** If your component has 3+ lines of `useState` / `useEffect` setup, those belong to a `useX` hook. The hook becomes trivial to test and your component becomes readable.
2. **Split by *concern*, not by *section*.** Do not extract `<Header />`, `<Body />`, `<Footer />` just to hit 50. Extract **domain responsibilities** — a form's validation, a list's sort state, an image's loading state.
3. **Push formatting into helpers.** `formatCurrency`, `formatRelativeTime`, and friends belong in `shared/lib/` or `entities/<noun>/lib/`.
4. **Question the component's identity.** If none of 1–3 help, the component is probably doing two jobs at once — split it into two components with clearer names.

## What forge rejects

- 55-line components (even if "it was only five over")
- `eslint-disable-next-line @forge-kit-dev/forge/component-max-lines` sprinkled to dodge the rule
- Splitting a component only to reach 49 while leaving the responsibilities tangled

## Tie-breakers

If a component is genuinely close to the limit and splitting makes it worse, that is a signal the limit is *right for most code but wrong for this one file*. In that case, open a discussion — don't disable the rule. forge's Evaluator will note the exception and let reviewers decide whether the component deserves to stay intact.
