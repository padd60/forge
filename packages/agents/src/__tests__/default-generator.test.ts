import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { Spec, EvalReport } from '@forge-kit-dev/schemas';

import { DefaultGenerator } from '../default-generator';
import { SprintFailedError } from '../errors';
import { MockRuntime } from '../mock-runtime';
import type { MockFixture } from '../mock-runtime';
import type { GeneratorInput } from '../generator';

const ISO = '2026-04-09T00:00:00.000Z';

function makeSpec(sprintCount: number): Spec {
  return {
    runId: 'run-gen',
    goal: 'scaffold feature',
    activeModules: [],
    sprints: Array.from({ length: sprintCount }, (_, i) => ({
      id: `sprint-${String(i + 1).padStart(2, '0')}`,
      title: `work unit ${i + 1}`,
      description: 'do the thing',
      filesTouched: [],
      acceptanceCriteria: ['done'],
    })),
    successCriteria: ['feature exists'],
    createdAt: ISO,
  };
}

function makePassingReport(): EvalReport {
  return {
    runId: 'run-gen',
    iteration: 1,
    totalScore: 40,
    maxScore: 100,
    passed: false,
    scores: [
      {
        criterionId: 'fsd.layer-placement',
        score: 5,
        rationale: 'misplaced',
        violatingFiles: ['src/wrong.ts'],
      },
    ],
    suggestions: ['move the file'],
    shouldRetry: true,
    createdAt: ISO,
  };
}

describe('DefaultGenerator', () => {
  let workDir: string;
  let runRoot: string;

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'forge-dgen-'));
    runRoot = join(workDir, '.forge', 'runs', 'run-gen');
    await mkdir(runRoot, { recursive: true });
    // Write the spec.md so the input file exists on disk (not strictly
    // required for the mock runtime, but keeps tests honest).
    await writeFile(join(runRoot, 'spec.md'), '# Spec\n', 'utf8');
  });

  afterEach(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  async function writeSelfCheckFixture(ok: boolean, tag: string): Promise<string> {
    const dir = join(workDir, 'fixtures');
    await mkdir(dir, { recursive: true });
    const p = join(dir, `${tag}.json`);
    await writeFile(p, JSON.stringify({ ok, log: tag }), 'utf8');
    return p;
  }

  async function writeDummyFixture(name: string, body = 'stub'): Promise<string> {
    const dir = join(workDir, 'fixtures');
    await mkdir(dir, { recursive: true });
    const p = join(dir, name);
    await writeFile(p, body, 'utf8');
    return p;
  }

  function sprintDir(i: number): string {
    return join(runRoot, 'generator', `sprint-${String(i + 1).padStart(2, '0')}`);
  }

  async function buildSprintFixture(
    i: number,
    selfCheckOk: boolean
  ): Promise<MockFixture> {
    const dir = sprintDir(i);
    const planSrc = await writeDummyFixture(`sprint${i + 1}-plan.md`, '# plan');
    const diffSrc = await writeDummyFixture(`sprint${i + 1}-diff.patch`, 'diff');
    const selfSrc = await writeSelfCheckFixture(
      selfCheckOk,
      `sprint${i + 1}-self`
    );
    const handoffSrc = await writeDummyFixture(
      `sprint${i + 1}-handoff.json`,
      JSON.stringify({
        stage: 'generator-to-sprint',
        runId: 'run-gen',
        fromPath: 'irrelevant',
        toInputs: {},
        summary: 's',
        createdAt: ISO,
      })
    );
    return {
      role: 'generator',
      outputs: {
        [join(dir, 'plan.md')]: planSrc,
        [join(dir, 'diff.patch')]: diffSrc,
        [join(dir, 'self-check.json')]: selfSrc,
        [join(dir, 'handoff.json')]: handoffSrc,
      },
    };
  }

  function baseInput(spec: Spec): GeneratorInput {
    return {
      runId: 'run-gen',
      spec,
      repoRoot: workDir,
      specMdPath: join(runRoot, 'spec.md'),
      sprintDirs: spec.sprints.map((_, i) => sprintDir(i)),
    };
  }

  it('walks a one-sprint spec and returns the final handoff path', async () => {
    const spec = makeSpec(1);
    const fixtures = [await buildSprintFixture(0, true)];
    const runtime = new MockRuntime({ fixtures });
    const generator = new DefaultGenerator({ systemPrompt: 'gen' });
    const result = await generator.generate(baseInput(spec), runtime);
    expect(result.sprintsCompleted).toBe(1);
    expect(result.finalSprintPath).toBe(sprintDir(0));
    expect(result.finalHandoffPath).toBe(join(sprintDir(0), 'handoff.json'));
    expect(runtime.history).toHaveLength(1);
    expect(runtime.history[0]?.freshContext).toBe(false);
  });

  it('walks a two-sprint spec and spawns once per sprint', async () => {
    const spec = makeSpec(2);
    const fixtures = [
      await buildSprintFixture(0, true),
      await buildSprintFixture(1, true),
    ];
    const runtime = new MockRuntime({ fixtures });
    const generator = new DefaultGenerator({ systemPrompt: 'gen' });
    const result = await generator.generate(baseInput(spec), runtime);
    expect(result.sprintsCompleted).toBe(2);
    expect(runtime.history).toHaveLength(2);
    // Neither sprint should be fresh-context because this is not a fix loop.
    expect(runtime.history.every((h) => h.freshContext === false)).toBe(true);
  });

  it('aborts with SprintFailedError when a sprint self-check fails', async () => {
    const spec = makeSpec(2);
    const fixtures = [
      await buildSprintFixture(0, false), // fails immediately
      await buildSprintFixture(1, true),
    ];
    const runtime = new MockRuntime({ fixtures });
    const generator = new DefaultGenerator({ systemPrompt: 'gen' });
    await expect(
      generator.generate(baseInput(spec), runtime)
    ).rejects.toBeInstanceOf(SprintFailedError);
    // Only sprint-01 should have been spawned.
    expect(runtime.history).toHaveLength(1);
  });

  it('uses fresh context for the first sprint of a fix-loop re-entry', async () => {
    const spec = makeSpec(1);
    const reportMdPath = join(runRoot, 'report.md');
    await writeFile(reportMdPath, '# Report', 'utf8');
    const fixtures = [await buildSprintFixture(0, true)];
    const runtime = new MockRuntime({
      fixtures: [{ ...fixtures[0]!, requireFreshContext: true }],
    });
    const generator = new DefaultGenerator({ systemPrompt: 'gen' });
    await generator.generate(
      {
        ...baseInput(spec),
        previousReport: makePassingReport(),
        previousReportMdPath: reportMdPath,
      },
      runtime
    );
    expect(runtime.history[0]?.freshContext).toBe(true);
    expect(runtime.history[0]?.inputFiles).toContain(reportMdPath);
  });

  it('throws if sprintDirs count does not match spec.sprints length', async () => {
    const spec = makeSpec(2);
    const runtime = new MockRuntime({ fixtures: [] });
    const generator = new DefaultGenerator({ systemPrompt: 'gen' });
    await expect(
      generator.generate(
        {
          ...baseInput(spec),
          sprintDirs: [sprintDir(0)], // only 1 dir, spec has 2 sprints
        },
        runtime
      )
    ).rejects.toThrow(/sprint dirs but spec has/);
  });
});
