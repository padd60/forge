import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DefaultPlanner } from '../default-planner';
import { PlannerValidationError } from '../errors';
import { MockRuntime } from '../mock-runtime';
import type { PlannerInput } from '../planner';

const ISO = '2026-04-09T00:00:00.000Z';

const validSpecBody = JSON.stringify({
  runId: 'run-abc',
  goal: 'add login form',
  activeModules: ['module-fsd'],
  sprints: [
    {
      id: 'sprint-01',
      title: 'scaffold slice',
      description: 'create feature slice',
      filesTouched: [],
      acceptanceCriteria: ['slice exists'],
    },
  ],
  successCriteria: ['form submits'],
  createdAt: ISO,
});

const invalidSpecBody = JSON.stringify({
  runId: 'run-abc',
  goal: 'add login form',
  // sprints intentionally missing — SpecSchema requires at least one.
  successCriteria: ['form submits'],
  createdAt: ISO,
});

describe('DefaultPlanner', () => {
  let workDir: string;
  let input: PlannerInput;

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'forge-dplanner-'));
    input = {
      runId: 'run-abc',
      goal: 'add login form',
      repoRoot: workDir,
      activeModules: ['module-fsd'],
      requestPath: join(workDir, 'request.json'),
      specJsonPath: join(workDir, 'planner', 'spec.json'),
    };
  });

  afterEach(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  async function writeFixture(filename: string, body: string): Promise<string> {
    const dir = join(workDir, 'fixtures');
    await mkdir(dir, { recursive: true });
    const filePath = join(dir, filename);
    await writeFile(filePath, body, 'utf8');
    return filePath;
  }

  it('spawns a planner sub-agent and returns the parsed spec on success', async () => {
    const fixturePath = await writeFixture('valid-spec.json', validSpecBody);
    const runtime = new MockRuntime({
      fixtures: [
        {
          role: 'planner',
          outputs: { [input.specJsonPath]: fixturePath },
        },
      ],
    });
    const planner = new DefaultPlanner({
      systemPrompt: 'you are the planner',
    });
    const spec = await planner.plan(input, runtime);
    expect(spec.runId).toBe('run-abc');
    expect(spec.sprints).toHaveLength(1);
    expect(runtime.history[0]?.role).toBe('planner');
    expect(runtime.history[0]?.inputFiles).toEqual([input.requestPath]);
    expect(runtime.history[0]?.expectedOutputs).toEqual([input.specJsonPath]);
    expect(runtime.history[0]?.freshContext).toBe(false);
  });

  it('throws PlannerValidationError when the sub-agent writes a bad spec', async () => {
    const fixturePath = await writeFixture('bad-spec.json', invalidSpecBody);
    const runtime = new MockRuntime({
      fixtures: [
        {
          role: 'planner',
          outputs: { [input.specJsonPath]: fixturePath },
        },
      ],
    });
    const planner = new DefaultPlanner({ systemPrompt: 'x' });
    await expect(planner.plan(input, runtime)).rejects.toBeInstanceOf(
      PlannerValidationError
    );
  });

  it('surfaces missing spec.json as a PlannerValidationError', async () => {
    // No fixture → MockRuntime will throw "no fixture left" first.
    // Use a runtime that accepts the spawn but writes nothing.
    const runtime = new MockRuntime({
      fixtures: [
        {
          role: 'planner',
          // outputs empty — spec.json never created.
          outputs: {},
        },
      ],
    });
    const planner = new DefaultPlanner({ systemPrompt: 'x' });
    // MockRuntime pre-checks expectedOutputs subset, so supply one that
    // the fixture explicitly omits. This simulates a sub-agent that
    // forgot to write its output.
    await expect(planner.plan(input, runtime)).rejects.toBeInstanceOf(
      PlannerValidationError
    );
  });
});
