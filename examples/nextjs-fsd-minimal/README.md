# @forge-kit-dev/example-nextjs-fsd-minimal

Minimal forge-managed Next.js 14 project activating **FSD + Clean
Code**. Demonstrates layer direction (`app` → `widgets` → `features`
→ `entities`/`shared`), public-API-only imports between slices, and
the 50-line component cap.

Run from the monorepo root:

```bash
pnpm seed:examples                                    # regenerate forge config
pnpm --filter @forge-kit-dev/example-nextjs-fsd-minimal forge:check
```

## Demo violation branch

- `demo/fsd-bad-slice` — adds a cross-slice deep import under
  `features/newsletter-signup/`, expected to fail
  `@forge-kit-dev/forge/fsd-slice-boundary`.
