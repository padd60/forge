# Quickstart — forge in 5 minutes

## Prerequisites

- **Claude Code** (recommended — gives you the full P-G-E pipeline with slash commands)
- Node.js 20+
- A Next.js / React project

---

## Minute 1 — Install the plugin

Open Claude Code and run:

```
/plugin marketplace add padd60/forge
/plugin install forge
```

This gives you `/forge-run`, `/forge-plan`, `/forge-generate`, `/forge-eval`, `/forge-fix` commands plus 13 auto-activated skills.

<details>
<summary>Alternative: npx (without Claude Code)</summary>

```bash
cd my-next-app
npx @forge-kit-dev/cli init .

# Non-interactive shortcut
npx @forge-kit-dev/cli init . --modules fsd,clean-code --enforcement hybrid
```

This sets up the mechanical gate (ESLint + pre-commit) but without the AI pipeline.
</details>

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

## Minute 3 — /forge-run (auto mode)

Open Claude Code in your project and run:

```
/forge-run "add a profile edit page with email validation"
```

This single command chains the entire pipeline automatically:
1. **Plans** — creates a structured spec with sprints
2. **Generates** — writes code in sprint batches, self-checks lint/tsc
3. **Evaluates** — a fresh agent scores the result against rubrics
4. **Fixes** — if evaluation fails, re-generates and re-evaluates (up to 3 times)

You get a final pass/fail report at the end. All artifacts are saved under `.forge/runs/<id>/`.

---

## Minute 4 — Review the results

Check the generated code:
```bash
ls .forge/runs/            # find your run ID
cat .forge/runs/<id>/evaluator/final.json   # see the score
```

---

## Minute 5 — Step-by-step mode (optional)

If you want to review each stage before proceeding, use the individual commands:

```
/forge-plan "add a profile edit page"   # review spec.md before continuing
/forge-generate                          # review diff.patch
/forge-eval                              # review report.json
/forge-fix                               # only if evaluation failed
```

This is useful when you want to edit the spec, inspect a sprint's diff, or understand why evaluation scored low.

---

## Troubleshooting

**ESLint: "Definition for rule '@forge-kit-dev/forge/...' was not found"**
- Make sure `@forge-kit-dev/eslint-plugin-forge` is installed as a devDependency.
- Verify the generated `eslint.config.js` contains `import forgePlugin from '@forge-kit-dev/eslint-plugin-forge'`.

**Husky hook not running on commit**
- Check that `.husky/pre-commit` exists and is executable (`chmod +x .husky/pre-commit`).
- If enforcement is `advisory-only`, the hook is intentionally not created.

**Skills not auto-activating in Claude Code**
- Confirm `.claude/skills/` contains `.md` files (they're created by `forge init`).
- Run `/forge-plan` once — Claude Code discovers skills on first slash command invocation.

**`forge check` passes but ESLint in IDE shows errors**
- Your IDE may be using an older ESLint version or a different config file. Ensure the IDE picks up `eslint.config.js` (ESLint 9+ flat config format).
