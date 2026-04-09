---
description: Initialize forge in this project — select modules, set enforcement level, generate config files.
argument-hint: Optional path (defaults to current directory)
---

# /forge-init

Arguments: optional target directory path. Defaults to `.` (current
working directory).

Example: `/forge-init` or `/forge-init ./my-app`.

## What this command does

You are the orchestrator. This command sets up forge in the user's
project by running the CLI's init wizard.

1. **Run the init command via npx.** Execute:

   ```bash
   npx @forge-kit-dev/cli init <path>
   ```

   Where `<path>` is the argument the user provided, or `.` if omitted.

   This launches an interactive wizard that asks the user to:
   - Select which modules to activate (FSD, Clean Code, DDD, Clean
     Architecture, CQRS)
   - Choose an enforcement level (hybrid, block-all, advisory-only)

2. **If npx is not available or fails**, fall back to checking if
   `@forge-kit-dev/cli` is installed locally or globally:

   ```bash
   pnpm exec forge init <path>
   # or
   npx --yes @forge-kit-dev/cli init <path>
   ```

3. **After init completes**, confirm to the user what was created:
   - `.forge/config.json` — active modules and enforcement settings
   - `eslint.config.js` — ESLint flat config with forge plugin
   - `.husky/pre-commit` — pre-commit hook (if enforcement ≠ advisory-only)
   - `.claude/skills/` — auto-activated skill files for each module

4. **Tell the user the next step:**
   `forge is ready! Run /forge-run "your goal" to start the pipeline.`

## Non-interactive mode

If the user provides specific modules in their message (e.g.
`/forge-init with FSD and DDD`), you can skip the wizard by running:

```bash
npx @forge-kit-dev/cli init . --modules fsd,ddd --enforcement hybrid
```

Module name mapping:
- "FSD" → `fsd`
- "Clean Code" → `clean-code`
- "DDD" → `ddd`
- "Clean Architecture" / "Clean Arch" → `clean-arch`
- "CQRS" → `cqrs`

## Important notes

- This command must run BEFORE `/forge-run`, `/forge-plan`, or any
  other forge pipeline command. Those commands read
  `.forge/config.json` which init creates.
- If `.forge/config.json` already exists, init will overwrite it.
  Warn the user if you detect an existing config.
- The wizard handles CQRS → FSD dependency automatically (CQRS
  requires FSD).
