import { loadModules, type Module } from '@forge-kit-dev/core';
import type { EnforcementLevel } from '@forge-kit-dev/schemas';

import { writeForgeConfig } from '../io/write-config.js';
import { writeEslintConfig } from '../io/write-eslint.js';
import { writeGitignore } from '../io/write-gitignore.js';
import { writeHuskyHook } from '../io/write-husky.js';
import { writeSkills } from '../io/write-skills.js';
import { BUILTIN_REGISTRY, selectModules } from '../registry.js';
import {
  resolveModuleDependencies,
  type BuiltinModule,
} from '../wizard/dependency-resolver.js';

/**
 * Inputs the wizard collects. Exposed as a plain interface so tests
 * can feed preset answers without rendering clack UI.
 */
export interface InitOptions {
  repoRoot: string;
  /** Raw user selection; will be auto-resolved against dependencies. */
  modules: readonly BuiltinModule[];
  enforcement: EnforcementLevel;
  evaluator?: {
    minScore?: number;
    maxIterations?: number;
  };
}

export interface InitResult {
  configPath: string;
  eslintPath: string;
  huskyPath: string | null;
  gitignorePath: string;
  skillsDir: string;
  resolvedModules: readonly string[];
  autoAddedModules: readonly string[];
  recommendedModules: readonly string[];
}

/**
 * The side-effect heart of `forge init`. Everything in `InitOptions`
 * has already been validated by the wizard; this function's job is to
 * produce the on-disk artifacts atomically enough that a mid-run
 * failure leaves the project in a recoverable state.
 *
 * Execution order matters:
 *  1. Dependency resolution + module load (pure; fails fast)
 *  2. Config.json (the source of truth — everything else derives from it)
 *  3. eslint.config.js (depends on loaded modules)
 *  4. Husky hook (depends on enforcement level)
 *  5. .gitignore (pure text append; safe to run last)
 *  6. .claude/skills/ stage (heaviest IO; failure here doesn't
 *     corrupt config)
 */
export async function runInit(opts: InitOptions): Promise<InitResult> {
  const resolved = resolveModuleDependencies(opts.modules);
  const registry: readonly Module[] = Object.values(BUILTIN_REGISTRY);
  const load = loadModules(registry, resolved.activeModules);
  if (load.skipped.length > 0) {
    const details = load.skipped
      .map((s) => `${s.name} (${s.reason})`)
      .join('; ');
    throw new Error(`forge: module resolution failed — ${details}`);
  }
  const modules = selectModules(load.active.map((m) => m.manifest.name as BuiltinModule));

  const configPath = await writeForgeConfig({
    repoRoot: opts.repoRoot,
    config: {
      version: 1,
      enforcement: opts.enforcement,
      activeModules: load.active.map((m) => m.manifest.name),
      evaluator: {
        minScore: opts.evaluator?.minScore ?? 70,
        maxIterations: opts.evaluator?.maxIterations ?? 3,
      },
    },
  });

  const eslint = await writeEslintConfig({
    repoRoot: opts.repoRoot,
    modules,
  });

  const husky = await writeHuskyHook({
    repoRoot: opts.repoRoot,
    enforcement: opts.enforcement,
  });

  const gi = await writeGitignore(opts.repoRoot);

  const skills = await writeSkills(opts.repoRoot, modules);

  return {
    configPath,
    eslintPath: eslint.filePath,
    huskyPath: husky.filePath,
    gitignorePath: gi.filePath,
    skillsDir: skills.targetDir,
    resolvedModules: load.active.map((m) => m.manifest.name),
    autoAddedModules: resolved.autoAdded,
    recommendedModules: resolved.recommended,
  };
}
