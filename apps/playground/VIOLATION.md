# Intentional violation: `demo/clean-code-long-component`

**Changed file:** `src/widgets/home-hero/home-hero.tsx`

**What was changed:** Bloated the component body to 57 lines (limit: 50)
by adding filler variables.

**Expected `forge check` output:**

```
src/widgets/home-hero/home-hero.tsx
  5:8  error  Component "HomeHero" has 57 body lines; the limit is 50.
              Extract a custom hook or split the component  @forge/forge/component-max-lines

✖ 1 problem (1 error, 0 warnings)
```

**Rule:** `@forge/forge/component-max-lines`

**How to fix:** Extract local state or computed values into a custom
hook, or split the component into smaller, focused components.
