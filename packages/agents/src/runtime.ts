import type { AgentRole } from './role';
import type { AgentToolkit } from './toolkit';

/**
 * A handle representing one in-flight agent execution. Runtimes decide
 * how to materialize this (Claude Code sub-agent via the Task tool, a
 * direct Anthropic SDK session, a local LLM, etc.), but every
 * implementation must preserve two guarantees:
 *
 * 1. `waitForCompletion` resolves only when the agent has produced every
 *    file declared in `expectedOutputs`. This is how runtimes prove they
 *    honored the file-based handoff protocol.
 * 2. `kill` must be safe to call even after completion (idempotent).
 */
export interface AgentHandle {
  readonly role: AgentRole;
  readonly handleId: string;
  waitForCompletion(): Promise<void>;
  kill(): Promise<void>;
}

/**
 * The spec an `AgentRuntime` needs to spawn an agent. Intentionally
 * minimal — anything domain-specific (rubrics, active modules, spec)
 * must already be persisted on disk and referenced through
 * `inputFiles` and `systemPrompt`.
 */
export interface SpawnRequest {
  role: AgentRole;
  /**
   * The agent's base instructions. Modules inject their skill prompts
   * via `@forge/core`'s `composePrompt()`, not directly here.
   */
  systemPrompt: string;
  /** Absolute paths the agent is allowed (and expected) to read first. */
  inputFiles: readonly string[];
  /**
   * Absolute paths the agent must produce before `waitForCompletion`
   * resolves. Used to detect silent early exits.
   */
  expectedOutputs: readonly string[];
  toolkit: AgentToolkit;
  /**
   * When true, the runtime MUST start the agent in a fresh context with
   * no history from the calling agent. This flag is how forge enforces
   * Generator↔Evaluator isolation — treat it as a hard contract, not a
   * hint.
   */
  freshContext: boolean;
}

/**
 * Host abstraction for running agents. `@forge/core`'s `Harness` depends
 * only on this interface; the concrete implementations live in
 * `src/runtime.claude-code.ts` and (later) `src/runtime.standalone.ts`.
 */
export interface AgentRuntime {
  readonly id: string;
  spawn(req: SpawnRequest): Promise<AgentHandle>;
}
