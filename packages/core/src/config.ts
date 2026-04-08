import type { EnforcementLevel } from '@forge/schemas';
import type { Module } from './module';

/**
 * What `@forge/cli init` writes to `.forge/config.json` and what
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
