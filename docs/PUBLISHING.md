# Publishing

## npm namespace status

Checked 2026-04-10:

| Package | Status | Notes |
|---|---|---|
| `@forge/cli` | **TAKEN** by Atlassian (v12.17.0, 723 versions) | Must rename before publishing. Alternatives: `@forge-fe/cli`, `@forgex/cli`, `forge-harness` |
| `@forge/core` | Available (404) | |
| `@forge/schemas` | Available (404) | |
| `@forge/agents` | Available (404) | |
| `@forge/eslint-plugin-forge` | Available (404) | |
| `@forge/module-fsd` | Available (404) | |
| `@forge/module-clean-code` | Available (404) | |
| `@forge/module-ddd` | Available (404) | |
| `@forge/module-clean-arch` | Available (404) | |
| `@forge/module-cqrs` | Available (404) | |
| `@forge/plugin-claude` | Available (404) | |

**Action required before publishing:** Rename `@forge/cli` to avoid the Atlassian collision. The `@forge` npm scope is owned by Atlassian for their Forge platform. Options:

1. **Register `@forgex` scope** — rename `@forge/cli` → `@forgex/cli` and keep all other packages under `@forge/*` (they're unclaimed). Pros: minimal blast radius (only bin name changes). Cons: inconsistent scoping.
2. **Register `@forge-fe` scope** — rename all 11 packages. Pros: consistent. Cons: large rename PR.
3. **Unscoped `forge-cli`** — use `forge-cli` without a scope for the bin entry. Pros: short command (`npx forge-cli init`). Cons: no scope protection.

Decision deferred to maintainer.

---

## Publishing checklist

```bash
# 1. Ensure all tests and checks pass
pnpm -r build
pnpm -r test
pnpm -r typecheck
pnpm seed:examples && git diff --exit-code

# 2. Add a changeset for the release
pnpm changeset

# 3. Version all packages (lockstep)
pnpm version-packages

# 4. Build again with updated versions
pnpm -r build

# 5. Publish (requires NPM_TOKEN with publish access + 2FA)
pnpm release
```

### npm 2FA

All `@forge/*` packages should require 2FA for publishing. Configure via:

```bash
npm profile enable-2fa auth-and-writes
```

---

## Lockstep v0.1 strategy

`.changeset/config.json` uses `"fixed": [["@forge/*"]]` — all 11 publishable packages share the same version number and are released together. This is appropriate for v0.1 because:

- Users consume 3-5 packages as a set (cli + core + modules)
- Internal APIs are still unstable; version divergence would be confusing
- There are no external consumers depending on a specific package version

When to split: once the internal APIs stabilize (v0.3+) and external plugins start depending on specific `@forge/core` versions, switch from `fixed` to `linked` grouping.

---

## Claude Code plugin marketplace

### Current state (2026-04)

The Claude Code plugin system is in beta. The `packages/plugin-claude/.claude-plugin/plugin.json` manifest is already structured for marketplace submission:

```json
{
  "name": "forge",
  "version": "0.1.0",
  "agents": ["agents/planner.json", "agents/generator.json", "agents/evaluator.json"],
  "skills": ["skills"],
  "commands": ["commands"],
  "hooks": []
}
```

### Installation (current)

Users install from a Git repository:

```
# In Claude Code
/plugin add github.com/<org>/forge
/plugin install forge
```

### Marketplace submission (when available)

1. Ensure `plugin.json` validates against the marketplace schema (TBD).
2. The plugin must include: `README.md`, at least one skill or command, and a valid `plugin.json`.
3. Submit via the marketplace web UI or CLI command (details TBD — the submission API is not yet public).
4. Expect a review period for security and quality.

### What ships in the plugin bundle

- `dist/` — compiled TypeScript (thin adapter layer)
- `.claude-plugin/plugin.json` — manifest
- `.claude-plugin/agents/` — 3 agent configs (planner, generator, evaluator)
- `.claude-plugin/commands/` — slash command definitions (`forge-plan`, `forge-generate`, `forge-eval`, `forge-fix`)
- `.claude-plugin/skills/` — 13 module skills synced from `packages/module-*/skills/`

---

## Dry-run checklist

Before pushing a version tag:

```bash
# Full gate
pnpm -r build
pnpm turbo run test --force
pnpm -r typecheck
pnpm seed:examples && git diff --exit-code
pnpm --filter @forge/plugin-claude sync-skills && git diff --exit-code packages/plugin-claude/.claude-plugin/skills/
for d in apps/playground examples/nextjs-fsd-minimal examples/nextjs-fsd-ddd examples/nextjs-cqrs; do
  (cd "$d" && pnpm exec forge check) || exit 1
done
pnpm changeset status

# Tag (do not push until verified)
git tag v0.1.0
```
