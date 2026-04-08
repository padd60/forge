import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { runInit } from '../commands/init';
import type { ForgeConfigOnDisk } from '../io/write-config';

describe('forge init (smoke)', () => {
  let repoRoot: string;

  beforeEach(async () => {
    repoRoot = await mkdtemp(join(tmpdir(), 'forge-init-'));
  });

  afterEach(async () => {
    await rm(repoRoot, { recursive: true, force: true });
  });

  it('creates config, eslint, husky, gitignore, and skills from a preset selection', async () => {
    const result = await runInit({
      repoRoot,
      modules: ['module-fsd', 'module-clean-code', 'module-cqrs'],
      enforcement: 'hybrid',
    });
    // Config persisted.
    const cfg = JSON.parse(
      await readFile(result.configPath, 'utf8')
    ) as ForgeConfigOnDisk;
    expect(cfg.enforcement).toBe('hybrid');
    expect(cfg.activeModules).toEqual(
      expect.arrayContaining([
        'module-fsd',
        'module-clean-code',
        'module-cqrs',
      ])
    );
    // eslint.config.js exists (no pre-existing file, so primary name used).
    expect(result.eslintPath).toBe(join(repoRoot, 'eslint.config.js'));
    await stat(result.eslintPath);
    // Husky hook written because enforcement !== advisory-only.
    expect(result.huskyPath).toBe(join(repoRoot, '.husky', 'pre-commit'));
    await stat(result.huskyPath!);
    // .gitignore with the forge line.
    const gi = await readFile(result.gitignorePath, 'utf8');
    expect(gi).toContain('.forge/runs/');
    // Skills staged.
    expect(result.skillsDir).toBe(join(repoRoot, '.claude', 'skills'));
  });

  it('auto-adds module-fsd when only module-cqrs is selected', async () => {
    const result = await runInit({
      repoRoot,
      modules: ['module-cqrs'],
      enforcement: 'hybrid',
    });
    expect(result.resolvedModules).toContain('module-fsd');
    expect(result.resolvedModules).toContain('module-cqrs');
    expect(result.autoAddedModules).toContain('module-fsd');
  });

  it('skips the husky hook when enforcement is advisory-only', async () => {
    const result = await runInit({
      repoRoot,
      modules: ['module-fsd'],
      enforcement: 'advisory-only',
    });
    expect(result.huskyPath).toBeNull();
  });

  it('is idempotent: running init twice leaves a stable .gitignore', async () => {
    await runInit({
      repoRoot,
      modules: ['module-fsd'],
      enforcement: 'hybrid',
    });
    await runInit({
      repoRoot,
      modules: ['module-fsd'],
      enforcement: 'hybrid',
    });
    const gi = await readFile(join(repoRoot, '.gitignore'), 'utf8');
    // Exactly one `.forge/runs/` line.
    const matches = gi.match(/\.forge\/runs\//g) ?? [];
    expect(matches.length).toBe(1);
  });
});
