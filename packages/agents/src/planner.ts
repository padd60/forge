import type { Spec } from '@forge/schemas';
import type { AgentRuntime } from './runtime';

/**
 * Input the Harness hands to the Planner. Everything except the goal
 * comes from `ForgeConfig` already persisted on disk.
 *
 * The Harness pre-computes absolute file paths (`requestPath`,
 * `specJsonPath`) so the Planner never has to know where
 * `.forge/runs/<runId>/` lives. This keeps `@forge/agents` free of any
 * dependency on `@forge/core`'s path utilities.
 */
export interface PlannerInput {
  runId: string;
  goal: string;
  repoRoot: string;
  activeModules: readonly string[];
  /** Absolute path to the `request.json` the Planner will read. */
  requestPath: string;
  /** Absolute path where the Planner's sub-agent must write `spec.json`. */
  specJsonPath: string;
}

/**
 * The Planner produces a Spec and nothing else. It is forbidden from
 * touching source files — enforced at the runtime level via its
 * `PLANNER_TOOLKIT` (see `toolkit.ts`).
 */
export interface Planner {
  readonly id: 'planner';
  plan(input: PlannerInput, runtime: AgentRuntime): Promise<Spec>;
}
