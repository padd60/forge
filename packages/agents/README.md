# @forge/agents

Interface-only package. It defines the contracts for forge's three agents (Planner / Generator / Evaluator), their toolkits, and the abstract `AgentRuntime` every host environment must implement.

No runtime implementations live here — look in:

- `@forge/core/src/runtime.claude-code.ts` (Claude Code sub-agent runtime)
- `@forge/core/src/runtime.standalone.ts` (planned v0.2: Anthropic SDK direct)

## Why so many single-purpose files

Each role and each cross-cutting concept (toolkit, runtime, role enum) lives in its own file so the Generator's own forge checks can reason about imports narrowly. A module that only needs the `Evaluator` interface does not drag in the Planner or its imports.

## The two invariants

1. **`SpawnRequest.freshContext: true` is a hard contract.** Any runtime that ignores it violates forge's core architectural promise — the physical separation between Generator and Evaluator.
2. **Toolkits are capability-scoped, not suggestions.** A Planner cannot be given edit rights "just this once". Modules that want code-writing behavior belong to the Generator stage.
