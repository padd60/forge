# Intentional violation: `demo/fsd-bad-slice`

**Changed file:** `src/features/newsletter-signup/ui/signup-form.tsx`

**What was changed:** Added a deep import bypassing `@/widgets/hero`'s
public API — `import { Hero } from '@/widgets/hero/hero'`. This also
violates layer direction (features/ importing from widgets/).

**Expected `forge check` output:**

```
✗ eslint
    Command failed with exit code 1: npx eslint . --max-warnings 0

src/features/newsletter-signup/ui/signup-form.tsx
  7:22  error  FSD violation: "features/" imports from "widgets/". Layer order is strict — higher layers may import lower, never the reverse  @forge/forge/fsd-slice-boundary

✖ 1 problem (1 error, 0 warnings)
```

**Rule:** `@forge/forge/fsd-slice-boundary`

**How to fix:** Remove the upward import. If you need the `Hero`
widget, compose it in the `widgets/` or `pages/` layer instead.
