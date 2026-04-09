import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { FORGE_COMMANDS, FORGE_PLUGIN_VERSION } from '..';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolve(__dirname, '..', '..', '.claude-plugin');

async function readJson<T = unknown>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

describe('plugin.json manifest', () => {
  it('has the expected name, version, and description', async () => {
    const manifest = await readJson<{
      name: string;
      version: string;
      description: string;
      agents: readonly string[];
      skills: readonly string[];
      commands: readonly string[];
    }>(join(pluginRoot, 'plugin.json'));
    expect(manifest.name).toBe('forge');
    expect(manifest.version).toBe(FORGE_PLUGIN_VERSION);
    expect(manifest.description).toMatch(/forge|harness/i);
  });

  it('has all three agent files on disk (auto-discovered by Claude Code)', async () => {
    for (const agent of ['planner', 'generator', 'evaluator']) {
      const body = await readFile(
        join(pluginRoot, 'agents', `${agent}.json`),
        'utf8'
      );
      expect(body.length).toBeGreaterThan(0);
    }
  });
});

describe('agents/*.json', () => {
  it('planner is not fresh-context (reusable context is fine)', async () => {
    const planner = await readJson<{
      role: string;
      freshContext: boolean;
      tools: readonly string[];
    }>(join(pluginRoot, 'agents', 'planner.json'));
    expect(planner.role).toBe('planner');
    expect(planner.freshContext).toBe(false);
    // Planner must not have write access.
    expect(planner.tools).not.toContain('Edit');
    expect(planner.tools).not.toContain('Write');
  });

  it('generator has Edit/Write and shell allowlist', async () => {
    const generator = await readJson<{
      role: string;
      freshContext: boolean;
      tools: readonly string[];
      shellAllowlist: readonly string[];
    }>(join(pluginRoot, 'agents', 'generator.json'));
    expect(generator.role).toBe('generator');
    expect(generator.tools).toEqual(
      expect.arrayContaining(['Edit', 'Write', 'Bash'])
    );
    expect(generator.shellAllowlist).toEqual(
      expect.arrayContaining(['pnpm lint', 'pnpm typecheck'])
    );
  });

  it('evaluator is freshContext: true (forge invariant)', async () => {
    const evaluator = await readJson<{
      role: string;
      freshContext: boolean;
      tools: readonly string[];
    }>(join(pluginRoot, 'agents', 'evaluator.json'));
    expect(evaluator.role).toBe('evaluator');
    // This is THE critical check. If this ever flips to false, the
    // entire P-G-E separation promised by the plugin is broken.
    expect(evaluator.freshContext).toBe(true);
    // Evaluator must not be able to mutate code.
    expect(evaluator.tools).not.toContain('Edit');
    expect(evaluator.tools).not.toContain('Write');
  });
});

describe('FORGE_COMMANDS constant', () => {
  it('names match the files actually on disk', async () => {
    for (const name of FORGE_COMMANDS) {
      const body = await readFile(
        join(pluginRoot, 'commands', `${name}.md`),
        'utf8'
      );
      expect(body.length).toBeGreaterThan(0);
    }
  });
});
