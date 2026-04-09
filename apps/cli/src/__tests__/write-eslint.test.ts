import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { defineModule } from '@forge-kit-dev/core';
import type { Module } from '@forge-kit-dev/core';

import { writeEslintConfig } from '../io/write-eslint';

function makeModule(
  name: string,
  precedence: number,
  rules: Record<string, unknown>
): Module {
  return defineModule({
    manifest: {
      name,
      version: '0.0.0',
      description: `test ${name}`,
      precedence,
      dependencies: [],
      provides: { eslintConfig: true, skills: false, rubrics: false },
    },
    eslintConfig: () => ({ rules }),
  });
}

describe('writeEslintConfig', () => {
  async function withTmpDir<T>(fn: (d: string) => Promise<T>): Promise<T> {
    const d = await mkdtemp(join(tmpdir(), 'forge-eslint-'));
    try {
      return await fn(d);
    } finally {
      await rm(d, { recursive: true, force: true });
    }
  }

  it('writes eslint.config.js containing merged rules', async () => {
    await withTmpDir(async (dir) => {
      const modA = makeModule('module-a', 10, { 'no-console': 'error' });
      const modB = makeModule('module-b', 20, {
        'max-lines': ['warn', 300],
      });
      const result = await writeEslintConfig({
        repoRoot: dir,
        modules: [modA, modB],
      });
      expect(result.filePath).toBe(join(dir, 'eslint.config.js'));
      expect(result.mergedRuleCount).toBe(2);
      const body = await readFile(result.filePath, 'utf8');
      expect(body).toContain('"no-console": "error"');
      expect(body).toContain('"max-lines"');
      expect(body).toContain('module-a, module-b');
      // Generated config must register the forge plugin so that
      // downstream ESLint can resolve @forge-kit-dev/forge/* rule ids.
      expect(body).toContain(
        "import forgePlugin from '@forge-kit-dev/eslint-plugin-forge';"
      );
      expect(body).toContain("'@forge-kit-dev/forge': forgePlugin");
    });
  });

  it('omits the forge plugin import when no rules are contributed', async () => {
    await withTmpDir(async (dir) => {
      const empty = makeModule('empty', 10, {});
      const result = await writeEslintConfig({
        repoRoot: dir,
        modules: [empty],
      });
      const body = await readFile(result.filePath, 'utf8');
      expect(body).not.toContain('@forge-kit-dev/eslint-plugin-forge');
      expect(body).toContain('export default []');
    });
  });

  it('reports conflicts when two modules set the same rule differently', async () => {
    await withTmpDir(async (dir) => {
      const strict = makeModule('strict', 10, { 'max-lines': ['error', 50] });
      const loose = makeModule('loose', 40, { 'max-lines': ['warn', 200] });
      const result = await writeEslintConfig({
        repoRoot: dir,
        modules: [strict, loose],
      });
      // resolveRuleConflicts should surface exactly one conflict.
      expect(result.conflictCount).toBe(1);
    });
  });

  it('falls back to eslint.forge.config.js when a user config already exists', async () => {
    await withTmpDir(async (dir) => {
      await writeFile(
        join(dir, 'eslint.config.js'),
        'export default [];\n',
        'utf8'
      );
      const mod = makeModule('x', 10, { 'no-debugger': 'error' });
      const result = await writeEslintConfig({
        repoRoot: dir,
        modules: [mod],
      });
      expect(result.filePath).toBe(join(dir, 'eslint.forge.config.js'));
    });
  });
});
