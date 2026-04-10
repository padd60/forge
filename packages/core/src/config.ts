import type { EnforcementLevel } from '@forge-kit-dev/schemas';
import type { Module } from './module.js';

/**
 * What `@forge-kit-dev/cli init` writes to `.forge/config.json` and what
 * `Harness` expects at runtime.
 *
 * Deliberately separated from `ModuleManifest`: the manifest describes
 * *what a module offers*, while this config describes *what the user
 * chose to activate for this project*.
 */
export interface ForgeConfig {
  enforcement: EnforcementLevel;
  activeModules: readonly string[];
  evaluator: {
    /** 0..100, used when enforcement === 'block-all'. */
    minScore: number;
    /** Hard cap on self-correction iterations before failing the run. */
    maxIterations: number;
  };
  paths: {
    /** Absolute repo root. */
    repoRoot: string;
    /** Usually `<repoRoot>/.forge`. */
    forgeDir: string;
  };
  /**
   * Optional per-module weight overrides for scoring. Keys are module
   * names (e.g. `"module-fsd"`), values are positive numbers. When
   * omitted, every active module contributes equally to the total score.
   *
   * Example: `{ "module-fsd": 3, "module-cqrs": 1 }` gives FSD 75%
   * and CQRS 25% of the total score (weights are normalized to sum to 1).
   */
  moduleWeights?: Record<string, number>;
}

/**
 * Bundle passed to `new Harness({...})`. Modules are resolved by the
 * `ModuleLoader` before landing here — core never reaches into package
 * registries or disk to find modules.
 */
export interface HarnessOptions {
  config: ForgeConfig;
  modules: readonly Module[];
}

export const DEFAULT_EVALUATOR_SETTINGS = {
  minScore: 70,
  maxIterations: 3,
} as const;
