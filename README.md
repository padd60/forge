# forge

> Frontend AI code harness — enforces **FSD**, **DDD**, **Clean Architecture**, **Clean Code**, and **CQRS** via a **Planner → Generator → Evaluator** pipeline.

`forge` is a framework-agnostic harness that wraps Claude Code (and any AI code agent) to make sure generated React/Next.js code cannot violate the architecture you have chosen. It combines **mechanical enforcement** (ESLint, tsc, knip) with an **independent agent-level evaluator** backed by rubrics — the two-layer safety net described in Anthropic's [harness design for long-running applications](https://www.anthropic.com/engineering/harness-design-long-running-apps).

## Why forge

Existing FSD linters (Steiger, `eslint-plugin-boundaries`, `@feature-sliced/eslint-config`) check **what you already wrote**. forge checks **how the code is being written** — by splitting work across a Planner, a Generator, and an Evaluator that run in fresh contexts so one agent cannot rubber-stamp another.

- **5 opt-in modules**: FSD / DDD / Clean Architecture / Clean Code / CQRS
- **Hybrid enforcement**: mechanical rules block commits; semantic rubrics advise
- **P-G-E pipeline**: physically separated agents with file-based handoff
- **Dual distribution**: `npx @forge/cli init` or `/plugin install forge`
- **React/Next.js first**: all rules and rubrics are tuned for this stack

## Quickstart (once v0.1 is published)

```bash
# 1. Bootstrap a new Next.js project with forge
npx @forge/cli init my-app

# 2. Or add forge to an existing repo
cd my-app
npx @forge/cli init .

# 3. Install the Claude Code plugin (optional)
/plugin marketplace add github.com/<your-org>/forge
/plugin install forge
```

## Repository layout

```
forge/
├── apps/
│   ├── cli/                 # @forge/cli — npx entry
│   └── playground/          # Next.js demo app (FSD showcase)
├── packages/
│   ├── schemas/             # @forge/schemas — Zod schemas for Spec/Handoff/Rubric
│   ├── agents/              # @forge/agents — Planner/Generator/Evaluator interfaces
│   ├── core/                # @forge/core — Harness orchestrator + module loader
│   ├── eslint-plugin-forge/ # custom ESLint rules (component-max-lines, slice-boundary, …)
│   ├── module-fsd/
│   ├── module-clean-code/
│   ├── module-ddd/
│   ├── module-clean-arch/
│   ├── module-cqrs/
│   ├── plugin-claude/       # Claude Code plugin bundle
│   └── testkit/             # shared rule test harness
├── examples/
│   ├── nextjs-fsd-minimal/
│   ├── nextjs-fsd-ddd/
│   └── nextjs-cqrs/
└── docs/                    # ARCHITECTURE.md, CONTRIBUTING.md …
```

## Core philosophy

1. **Physical separation of Generator and Evaluator.** Agents that evaluate their own work confidently praise mediocrity. forge always spawns the Evaluator in a fresh Claude Code sub-agent with no shared context.
2. **Three-layer rule system.** Every module contributes to one or more of: **Mechanical** (ESLint, pre-commit, block), **Skill** (auto-activated prompt in Claude Code), **Rubric** (Evaluator advisory score). Hybrid enforcement is an emergent property of this split.
3. **Options are internal abstractions.** Because every architecture concern is an opt-in module, forge's core is forced to treat them as first-class plug-ins — you get the benefit of modular design whether you turn one on or all five.
4. **Harness, not assistant.** forge does not help you write code. It refuses to generate code that violates the architecture you picked, and it tells you why.

## Status

This is **v0.1 in active development**. The public API will change. See [`/Users/kimjunghwan/.claude/plans/glittery-zooming-flurry.md`](../../.claude/plans/glittery-zooming-flurry.md) for the current implementation plan.

## License

MIT © forge contributors
