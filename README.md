# forge

> Frontend AI code harness — enforces **FSD**, **DDD**, **Clean Architecture**, **Clean Code**, **CQRS**, and **Testing** via a **Planner → Generator → Evaluator** pipeline.

`forge` is a React/Next.js-first harness that wraps Claude Code (and any AI code agent) to make sure generated code cannot violate the architecture you have chosen. It combines **mechanical enforcement** (ESLint, tsc) with an **independent agent-level evaluator** backed by rubrics — the two-layer safety net described in Anthropic's [harness design for long-running applications](https://www.anthropic.com/engineering/harness-design-long-running-apps).

## Why forge

Existing FSD linters (Steiger, `eslint-plugin-boundaries`, `@feature-sliced/eslint-config`) check **what you already wrote**. forge checks **how the code is being written** — by splitting work across a Planner, a Generator, and an Evaluator that run in fresh contexts so one agent cannot rubber-stamp another.

- **6 opt-in modules**: FSD / DDD / Clean Architecture / Clean Code / CQRS / Testing
- **Hybrid enforcement**: 11 mechanical ESLint rules block commits; 40 semantic rubric criteria advise
- **Score verification**: evaluator scores are recomputed in code with module-level weight normalization
- **P-G-E pipeline**: physically separated agents with file-based handoff
- **Dual distribution**: Claude Code plugin (`/forge-init`) or standalone CLI
- **React/Next.js first**: all rules and rubrics are tuned for this stack

## Install

### Claude Code plugin (recommended)

forge is designed to work inside **Claude Code**. Install the plugin, initialize your project, then run:

```
# Step 1: Install the forge plugin (one-time)
/plugin marketplace add padd60/forge
/plugin install forge

# Step 2: Initialize your project (select modules + create config)
/forge-init
#   → Or with specific modules: /forge-init with FSD and DDD

# Step 3: Run the full pipeline
/forge-run "add a login page with email validation"
```

**Step 2 is required** — `/forge-run` reads `.forge/config.json` to know which modules and rules to apply. `/forge-init` creates this config interactively.

> **Default modules**: FSD, Clean Code, Testing are always included (9 ESLint rules + 10 rubric criteria). You only choose whether to add DDD, Clean Architecture, or CQRS on top.

### npx (standalone CLI)

If you prefer using forge outside Claude Code, or want to set up the mechanical gate (ESLint + pre-commit) without the AI pipeline:

```bash
cd my-app
npx @forge-kit-dev/cli init .

# Non-interactive: skip the wizard and specify modules directly
npx @forge-kit-dev/cli init . --modules fsd,clean-code,ddd --enforcement hybrid
```

This creates `.forge/config.json`, `eslint.config.js` (with the forge plugin registered), `.husky/pre-commit`, and `.claude/skills/`.

## Usage (Claude Code)

### Auto mode — one command does everything

```
/forge-run "add a login form to the marketing site"
```

This chains the full pipeline automatically: **Plan → Generate → Evaluate → Fix loop** (up to 3 iterations). You get a final pass/fail report at the end.

### Step-by-step mode — review each stage

```
/forge-plan "add a login form to the marketing site"
# → .forge/runs/<id>/planner/spec.json + spec.md
# Review the spec, then:

/forge-generate
# → .forge/runs/<id>/generator/sprint-01/diff.patch

/forge-eval
# → .forge/runs/<id>/evaluator/iteration-01/report.json (score 0–10)

# If the score is below threshold:
/forge-fix
# → re-enters the Generator with the Evaluator's feedback
```

Use step-by-step when you want to inspect or edit intermediate artifacts (the spec, the diff, the rubric scores) before proceeding.

## Modules

| Module | Block rules (pre-commit) | Advisory rubrics (Evaluator) | Skills |
|---|---|---|---|
| **module-fsd** | `fsd-slice-boundary`, `fsd-no-wildcard-reexport`, `fsd-layer-typo` | boundary integrity, naming, cohesion, segment discipline, app-layer | `fsd-layer-placement`, `fsd-public-api`, `fsd-composition` |
| **module-clean-code** | `component-max-lines`, `no-boolean-flag-arg`, `no-type-escape`, `max-params`, `no-console`, `complexity` | intent clarity, SRP, error boundaries, type safety, effect management | `clean-code-naming`, `clean-code-srp`, `clean-code-component-size` |
| **module-ddd** | `ddd-entity-id` | ubiquitous language, aggregate integrity, value objects, ACL, domain events, bounded context | `ddd-aggregate-root`, `ddd-bounded-context`, `ddd-value-object` |
| **module-clean-arch** | `clean-arch-domain-isolation` | DIP compliance, use-case centralization | `clean-arch-use-case`, `clean-arch-dip` |
| **module-cqrs** | `cqrs-layer-role` | read/write separation, command discipline, read-model discipline, sync patterns | `cqrs-read-model`, `cqrs-command` |
| **module-testing** | — | test presence, assertion quality, error-path coverage, behavior-driven naming | — |

## Architecture

forge's architecture is built on two ideas: **physical separation of Generator and Evaluator** (so agents can't rubber-stamp their own work) and a **three-layer rule system** (Mechanical → Skill → Rubric) where each module contributes to one or more layers.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full P-G-E pipeline diagram, file-based handoff contract, module system, and enforcement levels.

## Quickstart

See [QUICKSTART.md](QUICKSTART.md) for a 5-minute walkthrough from `/forge-init` to `/forge-run`.

## Repository layout

```
forge/
├── apps/
│   ├── cli/                 # @forge-kit-dev/cli — standalone CLI
│   └── playground/          # Next.js 14 demo (all 5 modules)
├── packages/
│   ├── schemas/             # @forge-kit-dev/schemas — Zod schemas
│   ├── agents/              # @forge-kit-dev/agents — P-G-E interfaces
│   ├── core/                # @forge-kit-dev/core — Harness orchestrator
│   ├── eslint-plugin-forge/ # Custom ESLint rules
│   ├── module-fsd/
│   ├── module-clean-code/
│   ├── module-ddd/
│   ├── module-clean-arch/
│   ├── module-cqrs/
│   ├── module-testing/      # Test quality evaluation
│   ├── plugin-claude/       # Claude Code plugin bundle
│   └── testkit/             # rule test harness (v0.2)
├── examples/
│   ├── nextjs-fsd-minimal/  # FSD + Clean Code
│   ├── nextjs-fsd-ddd/      # FSD + DDD + Clean Arch
│   └── nextjs-cqrs/         # FSD + CQRS
└── docs/                    # ARCHITECTURE.md, PUBLISHING.md
```

## Core philosophy

1. **Physical separation of Generator and Evaluator.** Agents that evaluate their own work confidently praise mediocrity. forge always spawns the Evaluator in a fresh Claude Code sub-agent with no shared context.
2. **Score verification.** The harness recomputes the evaluator's score in code using criterion weights. Each active module contributes equally to the total score regardless of how many criteria it ships — so activating CQRS (8 criteria) carries the same weight as FSD (13 criteria).
3. **Three-layer rule system.** Every module contributes to one or more of: **Mechanical** (11 ESLint rules, pre-commit, block), **Skill** (auto-activated prompt in Claude Code), **Rubric** (40 criteria scored 0/5/10 by the Evaluator).
4. **Options are internal abstractions.** Because every architecture concern is an opt-in module, forge's core is forced to treat them as first-class plug-ins.
5. **Harness, not assistant.** forge does not help you write code. It refuses to generate code that violates the architecture you picked, and it tells you why.

## Status

This is **v0.1** — the first public release. The API may change. See [docs/PUBLISHING.md](docs/PUBLISHING.md) for release procedures.

## License

MIT © forge contributors
