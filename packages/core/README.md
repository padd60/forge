# @forge-kit-dev/core

The orchestration layer. Defines the `Harness`, the `Module` contract, the module loader, the rule conflict resolver, and file-path helpers for `.forge/runs/<runId>/`.

## Design tenets

1. **Thin by construction.** `@forge-kit-dev/core` has no host-specific code. The CLI brings in a runtime adapter (`@forge-kit-dev/cli` imports `@forge-kit-dev/core` plus the `claude-code` runtime in v0.1) and wires it into `new Harness(...)`. That means:
   - core typechecks without Claude Code types in scope
   - tests instantiate Harnesses with a stub runtime
   - a v0.2 standalone adapter (Anthropic SDK) can be added without touching core
2. **Fail at construction, not at first run.** The Harness validates active module presence and detects rule conflicts in its constructor. A misconfigured project should be unable to start a run.
3. **Determinism.** `loadModules()` sorts by precedence, `composePrompt()` walks modules in load order and skills in declaration order. This is what makes `forge test:meta-eval` (Step 10) meaningful.

## What's here vs what's in Step 9

Everything except `Harness.run()` is fully implemented in v0.1. `run()` is intentionally a throwing stub — the pipeline it will drive depends on `@forge-kit-dev/agents` + a concrete runtime, both of which ship in Step 9. The signature is already frozen so the CLI and modules can type-check against the full API.
