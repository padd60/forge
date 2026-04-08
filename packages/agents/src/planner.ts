import type { Spec } from '@forge/schemas';
import type { AgentRuntime } from './runtime';

/**
 * Input the Harness hands to the Planner. Everything except the goal
 * comes from `ForgeConfig` already persisted on disk.
 */
export interface PlannerInput {
  runId: string;
  goal: string;
  repoRoot: string;
  activeModules: readonly string[];
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
