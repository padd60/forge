# forge

> Frontend AI code harness — enforces **FSD**, **DDD**, **Clean Architecture**, **Clean Code**, and **CQRS** via a **Planner → Generator → Evaluator** pipeline.

`forge` is a framework-agnostic harness that wraps Claude Code (and any AI code agent) to make sure generated React/Next.js code cannot violate the architecture you have chosen. It combines **mechanical enforcement** (ESLint, tsc, knip) with an **independent agent-level evaluator** backed by rubrics — the two-layer safety net described in Anthropic's [harness design for long-running applications](https://www.anthropic.com/engineering/harness-design-long-running-apps).

## Why forge

Existing FSD linters (Steiger, `eslint-plugin-boundaries`, `@feature-sliced/eslint-config`) check **what you already wrote**. forge checks **how the code is being written** — by splitting work across a Planner, a Generator, and an Evaluator that run in fresh contexts so one agent cannot rubber-stamp another.

- **5 opt-in modules**: FSD / DDD / Clean Architecture / Clean Code / CQRS
- **Hybrid enforcement**: mechanical rules block commits; semantic rubrics advise
- **P-G-E pipeline**: physically separated agents with file-based handoff
- **Dual distribution**: `npx @forge-kit-dev/cli init` or `/plugin install forge`
- **React/Next.js first**: all rules and rubrics are tuned for this stack

## Install

### Claude Code plugin (recommended)

forge is designed to work inside **Claude Code**. Install it as a plugin and get slash commands (`/forge-run`, `/forge-plan`, `/forge-eval`), auto-activated skills, and the full P-G-E pipeline out of the box:

```
# In Claude Code
/plugin marketplace add padd60/forge
/plugin install forge
```

Then initialize your project:

```
/forge-run "set up FSD architecture with login feature"
```

That's it — forge plans, generates, evaluates, and fixes in one command.

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

| Module | Block rules (pre-commit) | Advisory rubric (Evaluator) | Skills |
|---|---|---|---|
| **module-fsd** | `fsd-slice-boundary` | composition, public-API usage | `fsd-layer-placement`, `fsd-public-api`, `fsd-composition` |
| **module-clean-code** | `component-max-lines`, `no-boolean-flag-arg`, `max-params`, `no-console`, `complexity` | intent clarity, props drilling, SRP | `clean-code-naming`, `clean-code-srp`, `clean-code-component-size` |
| **module-ddd** | `ddd-entity-id` | ubiquitous language, anemic model | `ddd-aggregate-root`, `ddd-bounded-context`, `ddd-value-object` |
| **module-clean-arch** | `clean-arch-domain-isolation` | DIP compliance, interface segregation | `clean-arch-use-case`, `clean-arch-dip` |
| **module-cqrs** | `cqrs-layer-role` | eventual consistency, sync strategy | `cqrs-read-model`, `cqrs-command` |

## Architecture

forge's architecture is built on two ideas: **physical separation of Generator and Evaluator** (so agents can't rubber-stamp their own work) and a **three-layer rule system** (Mechanical → Skill → Rubric) where each module contributes to one or more layers.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full P-G-E pipeline diagram, file-based handoff contract, module system, and enforcement levels.

## Quickstart

See [QUICKSTART.md](QUICKSTART.md) for a 5-minute walkthrough from `npx @forge-kit-dev/cli init` to `/forge-eval`.

## Repository layout

```
forge/
├── apps/
│   ├── cli/                 # @forge-kit-dev/cli — npx entry
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
2. **Three-layer rule system.** Every module contributes to one or more of: **Mechanical** (ESLint, pre-commit, block), **Skill** (auto-activated prompt in Claude Code), **Rubric** (Evaluator advisory score).
3. **Options are internal abstractions.** Because every architecture concern is an opt-in module, forge's core is forced to treat them as first-class plug-ins.
4. **Harness, not assistant.** forge does not help you write code. It refuses to generate code that violates the architecture you picked, and it tells you why.

## Status

This is **v0.1** — the first public release. The API may change. See [docs/PUBLISHING.md](docs/PUBLISHING.md) for release procedures.

## License

MIT © forge contributors
