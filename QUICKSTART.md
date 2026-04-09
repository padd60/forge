# Quickstart — forge in 5 minutes

## Prerequisites

- Node.js 20+
- pnpm 10+ (or use `npx` — it works too)
- A Next.js / React project (or forge will help you pick modules for a new one)
- Claude Code (optional but recommended for the full P-G-E loop)

---

## Minute 1 — Install

```bash
cd my-next-app
npx @forge/cli init .
```

The wizard asks which modules to activate and which enforcement level to use. For a quick start, pick **FSD + Clean Code** with **hybrid** enforcement:

```bash
# Non-interactive shortcut
npx @forge/cli init . --modules fsd,clean-code --enforcement hybrid
```

---

## Minute 2 — Review generated files

`forge init` created four things:

| File | Purpose |
|---|---|
| `.forge/config.json` | Source of truth — active modules, enforcement level, evaluator settings |
| `eslint.config.js` | Flat config with the forge ESLint plugin registered and all block rules from your modules |
| `.husky/pre-commit` | Runs `npx eslint . --max-warnings 0 && npx tsc --noEmit` on every commit (only if enforcement ≠ `advisory-only`) |
| `.claude/skills/` | Markdown skill files auto-activated by Claude Code while you write code |

---

## Minute 3 — /forge-plan

Open Claude Code in your project and run:

```
/forge-plan "add a profile edit page with email validation"
```

The Planner agent reads your project structure and active modules, then writes:

- `.forge/runs/<id>/planner/spec.json` — structured plan (sprints, success criteria)
- `.forge/runs/<id>/planner/spec.md` — human-readable version

Review the spec before continuing. Edit it if needed — it's just a file.

---

## Minute 4 — /forge-generate

```
/forge-generate
```

The Generator reads the spec and produces code in sprint batches. Each sprint creates:

- `diff.patch` — the actual code changes
- `self-check.json` — ESLint + tsc results (mechanical gate)

If the self-check fails, the Generator retries before handing off to the Evaluator.

---

## Minute 5 — /forge-eval

```
/forge-eval
```

A **fresh** Evaluator agent (no shared context with the Generator) scores the result:

- Reads the git diff + the original spec + your active rubrics
- Produces `report.json` with a 0–10 score per rubric dimension
- If the score is below threshold, suggests specific fixes

If the evaluation fails:

```
/forge-fix
```

This re-enters the Generator with the Evaluator's feedback. The fix loop runs up to 3 iterations (configurable in `.forge/config.json`).

---

## Troubleshooting

**ESLint: "Definition for rule '@forge/forge/...' was not found"**
- Make sure `@forge/eslint-plugin-forge` is installed as a devDependency.
- Verify the generated `eslint.config.js` contains `import forgePlugin from '@forge/eslint-plugin-forge'`.

**Husky hook not running on commit**
- Check that `.husky/pre-commit` exists and is executable (`chmod +x .husky/pre-commit`).
- If enforcement is `advisory-only`, the hook is intentionally not created.

**Skills not auto-activating in Claude Code**
- Confirm `.claude/skills/` contains `.md` files (they're created by `forge init`).
- Run `/forge-plan` once — Claude Code discovers skills on first slash command invocation.

**`forge check` passes but ESLint in IDE shows errors**
- Your IDE may be using an older ESLint version or a different config file. Ensure the IDE picks up `eslint.config.js` (ESLint 9+ flat config format).
