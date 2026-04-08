import type { Evaluator, Generator, Planner } from '@forge/agents';
import type { EvalReport, RunRequest } from '@forge/schemas';

import type { HarnessOptions } from './config';
import type { Module } from './module';
import {
  resolveRuleConflicts,
  type RuleConflict,
} from './conflict-resolver';

export interface HarnessAgents {
  planner: Planner;
  generator: Generator;
  evaluator: Evaluator;
}

/**
 * Top-level orchestrator for a single P-G-E run.
 *
 * The Harness is deliberately thin — its job is to:
 * 1. Validate that the active module set declared in config has been
 *    resolved and loaded.
 * 2. Surface rule conflicts between modules at construction time, so
 *    misconfigurations fail fast rather than on the first commit.
 * 3. (Step 9) Drive the Planner → Generator → Evaluator → (fix loop)
 *    pipeline, writing every transition to `.forge/runs/<runId>/`.
 *
 * Everything that requires an `AgentRuntime` lives inside `run()`;
 * construction is pure so that the CLI, docs tools, and tests can
 * instantiate a Harness without a live host environment.
 */
export class Harness {
  readonly #opts: HarnessOptions;
  readonly #agents: HarnessAgents;
  readonly #conflicts: readonly RuleConflict[];

  constructor(opts: HarnessOptions, agents: HarnessAgents) {
    this.#opts = opts;
    this.#agents = agents;
    this.#validateModules();
    this.#conflicts = resolveRuleConflicts(opts.modules);
  }

  get modules(): readonly Module[] {
    return this.#opts.modules;
  }

  get conflicts(): readonly RuleConflict[] {
    return this.#conflicts;
  }

  get agents(): HarnessAgents {
    return this.#agents;
  }

  /**
   * Execute a single P-G-E run. Implemented in Step 9 once the
   * Claude Code runtime adapter exists. The signature is frozen here so
   * modules, the CLI, and tests can type-check against it today.
   */
  async run(_request: RunRequest): Promise<EvalReport> {
    throw new Error(
      'Harness.run() is pending Step 9 (Claude Code runtime). ' +
        'See docs/ARCHITECTURE.md for the planned pipeline.'
    );
  }

  #validateModules(): void {
    const provided = new Set(
      this.#opts.modules.map((m) => m.manifest.name)
    );
    const missing = this.#opts.config.activeModules.filter(
      (n) => !provided.has(n)
    );
    if (missing.length > 0) {
      throw new Error(
        `forge: active modules declared in config but not loaded: ${missing.join(', ')}`
      );
    }
  }
}
