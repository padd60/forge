# @forge/playground

Kitchen-sink Next.js 14 demo that activates **all five forge modules**
(FSD, Clean Code, DDD, Clean Architecture, CQRS). Use it as a
reference for what a fully-wired forge project looks like, or as the
end-to-end target of changes to any module.

```bash
# From the monorepo root
pnpm seed:examples                            # regenerate .forge/ + eslint.config.js
pnpm --filter @forge/playground forge:check   # run the mechanical gate
pnpm --filter @forge/playground dev           # boot the sample app on localhost:3000
```

## What this demonstrates

| forge module | rule fired here | seen in |
|---|---|---|
| module-fsd | `fsd-slice-boundary` (layer direction + public-API) | `src/app/page.tsx` imports widgets only |
| module-clean-code | `component-max-lines` (50), `max-params` (3) | every `*.tsx` is under 50 body lines |
| module-ddd | `ddd-entity-id` (Entity must have `id`) | `src/entities/user/model/user.ts` |
| module-clean-arch | `clean-arch-domain-isolation` (no react in domain) | `entities/user/model` is framework-free |
| module-cqrs | `cqrs-layer-role` (entities = readonly, features = commands) | `entities/*` is `readonly`, `features/auth-login/model/login-command.ts` exports the command |

Demo violation branches (not merged):

- `demo/clean-code-long-component` — bloats `home-hero.tsx` past 50 lines
