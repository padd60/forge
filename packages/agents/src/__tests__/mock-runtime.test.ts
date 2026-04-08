import {
  mkdtemp,
  readFile,
  rm,
  writeFile,
  mkdir,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { MockRuntime } from '../mock-runtime';
import type { MockFixture } from '../mock-runtime';
import type { SpawnRequest } from '../runtime';
import {
  PLANNER_TOOLKIT,
  EVALUATOR_TOOLKIT,
  GENERATOR_TOOLKIT,
} from '../toolkit';

describe('MockRuntime', () => {
  let workDir: string;

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'forge-mockrt-'));
  });

  afterEach(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  async function makeFixtureFile(name: string, body: string): Promise<string> {
    const path = join(workDir, 'fixtures', name);
    await mkdir(join(workDir, 'fixtures'), { recursive: true });
    await writeFile(path, body, 'utf8');
    return path;
  }

  function makeSpawn(
    role: SpawnRequest['role'],
    overrides: Partial<SpawnRequest> = {}
  ): SpawnRequest {
    return {
      role,
      systemPrompt: 'stub',
      inputFiles: [],
      expectedOutputs: [],
      toolkit:
        role === 'planner'
          ? PLANNER_TOOLKIT
          : role === 'generator'
          ? GENERATOR_TOOLKIT
          : EVALUATOR_TOOLKIT,
      freshContext: false,
      ...overrides,
    };
  }

  it('copies fixture output files to the expected destination', async () => {
    const src = await makeFixtureFile('spec.json', '{"ok":true}');
    const dest = join(workDir, 'run', 'planner', 'spec.json');
    const fixture: MockFixture = {
      role: 'planner',
      outputs: { [dest]: src },
    };
    const rt = new MockRuntime({ fixtures: [fixture] });
    const handle = await rt.spawn(
      makeSpawn('planner', { expectedOutputs: [dest] })
    );
    await handle.waitForCompletion();
    const written = await readFile(dest, 'utf8');
    expect(written).toBe('{"ok":true}');
    expect(rt.consumedFixtureCount).toBe(1);
  });

  it('records every spawn request in history', async () => {
    const src = await makeFixtureFile('out.json', '{}');
    const dest = join(workDir, 'out.json');
    const rt = new MockRuntime({
      fixtures: [{ role: 'planner', outputs: { [dest]: src } }],
    });
    await rt.spawn(makeSpawn('planner', { expectedOutputs: [dest] }));
    expect(rt.history).toHaveLength(1);
    expect(rt.history[0]?.role).toBe('planner');
  });

  it('throws when no fixture is left for the next spawn', async () => {
    const rt = new MockRuntime({ fixtures: [] });
    await expect(rt.spawn(makeSpawn('planner'))).rejects.toThrow(
      /no fixture left/
    );
  });

  it('throws when the fixture role does not match the spawn role', async () => {
    const src = await makeFixtureFile('x.json', '{}');
    const dest = join(workDir, 'x.json');
    const rt = new MockRuntime({
      fixtures: [{ role: 'planner', outputs: { [dest]: src } }],
    });
    await expect(
      rt.spawn(makeSpawn('evaluator', { expectedOutputs: [dest] }))
    ).rejects.toThrow(/expected role 'planner'/);
  });

  it('enforces requireFreshContext when the fixture sets it', async () => {
    const src = await makeFixtureFile('r.json', '{}');
    const dest = join(workDir, 'r.json');
    const rt = new MockRuntime({
      fixtures: [
        {
          role: 'evaluator',
          outputs: { [dest]: src },
          requireFreshContext: true,
        },
      ],
    });
    await expect(
      rt.spawn(
        makeSpawn('evaluator', {
          expectedOutputs: [dest],
          freshContext: false,
        })
      )
    ).rejects.toThrow(/freshContext=true/);
  });

  it('accepts requireFreshContext when it matches', async () => {
    const src = await makeFixtureFile('r.json', '{"a":1}');
    const dest = join(workDir, 'r.json');
    const rt = new MockRuntime({
      fixtures: [
        {
          role: 'evaluator',
          outputs: { [dest]: src },
          requireFreshContext: true,
        },
      ],
    });
    const handle = await rt.spawn(
      makeSpawn('evaluator', {
        expectedOutputs: [dest],
        freshContext: true,
      })
    );
    await handle.waitForCompletion();
    expect(await readFile(dest, 'utf8')).toBe('{"a":1}');
  });

  it('rejects outputs not declared in SpawnRequest.expectedOutputs', async () => {
    const src = await makeFixtureFile('x.json', '{}');
    const unlisted = join(workDir, 'not-listed.json');
    const rt = new MockRuntime({
      fixtures: [{ role: 'planner', outputs: { [unlisted]: src } }],
    });
    await expect(
      rt.spawn(
        makeSpawn('planner', { expectedOutputs: [join(workDir, 'other.json')] })
      )
    ).rejects.toThrow(/not listed in SpawnRequest.expectedOutputs/);
  });

  it('invokes the onSpawn spy with the request and fixture', async () => {
    const src = await makeFixtureFile('y.json', '{}');
    const dest = join(workDir, 'y.json');
    const calls: string[] = [];
    const rt = new MockRuntime({
      fixtures: [
        { role: 'generator', outputs: { [dest]: src }, label: 'sprint-01' },
      ],
      onSpawn: (req, fx) => {
        calls.push(`${req.role}:${fx.label ?? ''}`);
      },
    });
    await rt.spawn(makeSpawn('generator', { expectedOutputs: [dest] }));
    expect(calls).toEqual(['generator:sprint-01']);
  });
});
