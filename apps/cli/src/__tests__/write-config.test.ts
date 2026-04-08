import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  writeForgeConfig,
  type ForgeConfigOnDisk,
} from '../io/write-config';

function baseConfig(): ForgeConfigOnDisk {
  return {
    version: 1,
    enforcement: 'hybrid',
    activeModules: ['module-fsd', 'module-cqrs'],
    evaluator: { minScore: 70, maxIterations: 3 },
  };
}

describe('writeForgeConfig', () => {
  let workDir: string;

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'forge-cfg-'));
  });

  afterEach(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  it('writes .forge/config.json with the expected shape', async () => {
    const filePath = await writeForgeConfig({
      repoRoot: workDir,
      config: baseConfig(),
    });
    expect(filePath).toBe(join(workDir, '.forge', 'config.json'));
    const parsed = JSON.parse(await readFile(filePath, 'utf8')) as ForgeConfigOnDisk;
    expect(parsed).toEqual(baseConfig());
  });

  it('produces a trailing newline (diff friendly)', async () => {
    const filePath = await writeForgeConfig({
      repoRoot: workDir,
      config: baseConfig(),
    });
    const raw = await readFile(filePath, 'utf8');
    expect(raw.endsWith('\n')).toBe(true);
  });

  it('overwrites an existing config idempotently', async () => {
    await writeForgeConfig({ repoRoot: workDir, config: baseConfig() });
    await writeForgeConfig({ repoRoot: workDir, config: baseConfig() });
    const raw = await readFile(
      join(workDir, '.forge', 'config.json'),
      'utf8'
    );
    expect(JSON.parse(raw)).toEqual(baseConfig());
  });

  it('preserves activeModules order as provided', async () => {
    const path = await writeForgeConfig({
      repoRoot: workDir,
      config: {
        ...baseConfig(),
        activeModules: ['module-clean-arch', 'module-fsd', 'module-clean-code'],
      },
    });
    const parsed = JSON.parse(await readFile(path, 'utf8')) as ForgeConfigOnDisk;
    expect(parsed.activeModules).toEqual([
      'module-clean-arch',
      'module-fsd',
      'module-clean-code',
    ]);
  });
});
