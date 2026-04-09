# @forge-kit-dev/example-nextjs-fsd-ddd

Next.js 14 example showing **FSD + Clean Code + DDD + Clean
Architecture**. Demonstrates:

- **DDD entity identity** — `src/entities/order/model/order.ts`
  exposes `Order` with a required `id` field. The
  `@forge-kit-dev/forge/ddd-entity-id` rule enforces that anything exported
  from `/entities/` has an `id`.
- **Clean Architecture domain isolation** — the `entities/` layer is
  framework-free (no `react`/`next` imports). This is checked by
  `@forge-kit-dev/forge/clean-arch-domain-isolation`.
- **Use-case layer** — `src/features/place-order/model/place-order.use-case.ts`
  holds the write-side orchestration; React UI lives next to it in
  `ui/place-order-form.tsx`.

Run from the monorepo root:

```bash
pnpm seed:examples
pnpm --filter @forge-kit-dev/example-nextjs-fsd-ddd forge:check
```

## Demo violation branches

- `demo/ddd-entity-no-id` — strips the `id` field from `Order`,
  expected to fail `@forge-kit-dev/forge/ddd-entity-id`.
- `demo/clean-arch-react-in-domain` — adds `import { useState } from 'react'`
  to `entities/order/model/order.ts`, expected to fail
  `@forge-kit-dev/forge/clean-arch-domain-isolation`.
