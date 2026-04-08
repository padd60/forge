import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { ForgeConfigOnDisk } from '../io/write-config';
import { writeEslintConfig } from '../io/write-eslint';
import { writeSkills } from '../io/write-skills';
import { selectModules } from '../registry';
import {
  BUILTIN_MODULES,
  resolveModuleDependencies,
  type BuiltinModule,
} from '../wizard/dependency-resolver';

export interface AddOptions {
  repoRoot: string;
  moduleName: BuiltinModule;
}

export interface AddResult {
  updatedConfigPath: string;
  eslintPath: string;
  skillsDir: string;
  addedModules: readonly string[];
}

/**
 * Add a single module to an existing `.forge/config.json` and
 * regenerate every artifact that depends on the active module set.
 * Idempotent: running `forge add module-fsd` twice leaves the config
 * in the same state both times.
 *
 * This reuses `writeEslintConfig` and `writeSkills` — the same IO
 * helpers `init` uses — so there's exactly one place that decides how
 * merged ESLint config and staged skills look on disk.
 */
export async function runAdd(opts: AddOptions): Promise<AddResult> {
  if (!BUILTIN_MODULES.includes(opts.moduleName)) {
    throw new Error(`forge: unknown module '${opts.moduleName}'`);
  }

  const configPath = join(opts.repoRoot, '.forge', 'config.json');
  const raw = await readFile(configPath, 'utf8');
  const current = JSON.parse(raw) as ForgeConfigOnDisk;

  const merged = [...current.activeModules, opts.moduleName];
  const resolved = resolveModuleDependencies(merged);

  const nextConfig: ForgeConfigOnDisk = {
    version: 1,
    enforcement: current.enforcement,
    activeModules: [...resolved.activeModules],
    evaluator: current.evaluator,
  };
  await writeFile(
    configPath,
    `${JSON.stringify(nextConfig, null, 2)}\n`,
    'utf8'
  );

  const modules = selectModules(resolved.activeModules);
  const eslint = await writeEslintConfig({
    repoRoot: opts.repoRoot,
    modules,
  });
  const skills = await writeSkills(opts.repoRoot, modules);

  const newlyActive = nextConfig.activeModules.filter(
    (m) => !current.activeModules.includes(m)
  );
  return {
    updatedConfigPath: configPath,
    eslintPath: eslint.filePath,
    skillsDir: skills.targetDir,
    addedModules: newlyActive,
  };
}

