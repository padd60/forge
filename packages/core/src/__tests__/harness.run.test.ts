import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  DefaultEvaluator,
  DefaultGenerator,
  DefaultPlanner,
  MockRuntime,
  PlannerValidationError,
  RunLimitError,
  type MockFixture,
} from '@forge/agents';
import type { EvalReport, RunRequest, Spec } from '@forge/schemas';

import type { ForgeConfig } from '../config';
import { Harness } from '../harness';

const ISO = '2026-04-09T00:00:00.000Z';

// ---------- Fixture factories ----------

function buildValidSpec(sprintCount: number): Spec {
  return {
    runId: 'run-test',
    goal: 'add login form',
    activeModules: ['module-fsd'],
    sprints: Array.from({ length: sprintCount }, (_, i) => ({
      id: `sprint-${String(i + 1).padStart(2, '0')}`,
      title: `do step ${i + 1}`,
      description: 'desc',
      filesTouched: [],
      acceptanceCriteria: ['ok'],
    })),
    successCriteria: ['login works'],
    createdAt: ISO,
  };
}

function brokenSpec(): unknown {
  // Missing required `sprints` and `successCriteria` arrays.
  return {
    runId: 'run-test',
    goal: 'broken',
    activeModules: [],
    createdAt: ISO,
  };
}

function report(iteration: number, passed: boolean): EvalReport {
  return {
    runId: 'run-test',
    iteration,
    totalScore: passed ? 85 : 40,
    maxScore: 100,
    passed,
    scores: [
      {
        criterionId: 'fsd.layer-placement',
        score: passed ? 10 : 5,
        rationale: passed ? 'ok' : 'misplaced',
        violatingFiles: passed ? [] : ['src/wrong.ts'],
      },
    ],
    suggestions: passed ? [] : ['move file'],
    shouldRetry: !passed,
    createdAt: ISO,
  };
}

// ---------- Test setup ----------

describe('Harness.run() pipeline', () => {
  let workDir: string;
  let forgeDir: string;
  let runDir: string;
  let fixtureDir: string;
  let config: ForgeConfig;
  let request: RunRequest;

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'forge-runp-'));
    forgeDir = join(workDir, '.forge');
    runDir = join(forgeDir, 'runs', 'run-test');
    fixtureDir = join(workDir, 'fixtures');
    await mkdir(fixtureDir, { recursive: true });

    config = {
      enforcement: 'hybrid',
      activeModules: [],
      evaluator: { minScore: 70, maxIterations: 3 },
      paths: { repoRoot: workDir, forgeDir },
    };
    request = {
      runId: 'run-test',
      goal: 'add login form',
      enforcement: 'hybrid',
      activeModules: ['module-fsd'],
      repoRoot: workDir,
      createdAt: ISO,
    };
  });

  afterEach(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  // Helper: write a JSON fixture file and return its path.
  async function writeJsonFixture(
    name: string,
    body: unknown
  ): Promise<string> {
    const p = join(fixtureDir, name);
    await writeFile(p, JSON.stringify(body), 'utf8');
    return p;
  }

  async function writeTextFixture(name: string, body: string): Promise<string> {
    const p = join(fixtureDir, name);
    await writeFile(p, body, 'utf8');
    return p;
  }

  // Build the set of mock fixtures needed for a planner spawn.
  async function plannerFixture(specBody: unknown): Promise<MockFixture> {
    const src = await writeJsonFixture('spec.json', specBody);
    const destSpec = join(runDir, 'planner', 'spec.json');
    return {
      role: 'planner',
      outputs: { [destSpec]: src },
      label: 'planner',
    };
  }

  // Build the fixtures for a generator call that walks `sprintCount`
  // sprints and writes passing self-checks. Returns one MockFixture per
  // sprint.
  async function generatorSprintFixtures(
    sprintCount: number,
    tag: string,
    freshFirst = false
  ): Promise<readonly MockFixture[]> {
    const fixtures: MockFixture[] = [];
    for (let i = 0; i < sprintCount; i++) {
      const sprintDir = join(
        runDir,
        'generator',
        `sprint-${String(i + 1).padStart(2, '0')}`
      );
      const plan = await writeTextFixture(
        `${tag}-sprint${i + 1}-plan.md`,
        '# plan'
      );
      const diff = await writeTextFixture(
        `${tag}-sprint${i + 1}-diff.patch`,
        'diff --git a/x b/x'
      );
      const selfCheck = await writeJsonFixture(
        `${tag}-sprint${i + 1}-selfcheck.json`,
        { ok: true, log: 'clean' }
      );
      const handoff = await writeJsonFixture(
        `${tag}-sprint${i + 1}-handoff.json`,
        {
          stage: 'generator-to-sprint',
          runId: 'run-test',
          fromPath: 'x',
          toInputs: {},
          summary: 's',
          createdAt: ISO,
        }
      );
      const outputs: Record<string, string> = {
        [join(sprintDir, 'plan.md')]: plan,
        [join(sprintDir, 'diff.patch')]: diff,
        [join(sprintDir, 'self-check.json')]: selfCheck,
        [join(sprintDir, 'handoff.json')]: handoff,
      };
      fixtures.push({
        role: 'generator',
        outputs,
        requireFreshContext: i === 0 ? freshFirst : false,
        label: `${tag}-sprint-${i + 1}`,
      });
    }
    return fixtures;
  }

  async function evaluatorFixture(
    iteration: number,
    passed: boolean
  ): Promise<MockFixture> {
    const iterDir = join(
      runDir,
      'evaluator',
      `iteration-${String(iteration).padStart(2, '0')}`
    );
    const jsonSrc = await writeJsonFixture(
      `eval-iter-${iteration}.json`,
      report(iteration, passed)
    );
    const mdSrc = await writeTextFixture(
      `eval-iter-${iteration}.md`,
      '# report'
    );
    return {
      role: 'evaluator',
      outputs: {
        [join(iterDir, 'report.json')]: jsonSrc,
        [join(iterDir, 'report.md')]: mdSrc,
      },
      requireFreshContext: true, // Forge's central invariant — always true.
      label: `evaluator-iter-${iteration}`,
    };
  }

  function defaultAgents(): {
    planner: DefaultPlanner;
    generator: DefaultGenerator;
    evaluator: DefaultEvaluator;
  } {
    return {
      planner: new DefaultPlanner({ systemPrompt: 'plan' }),
      generator: new DefaultGenerator({ systemPrompt: 'generate' }),
      evaluator: new DefaultEvaluator({ systemPrompt: 'evaluate' }),
    };
  }

  // ---------- Scenarios ----------

  it('(happy path) one sprint + eval passes on iteration 1', async () => {
    const spec = buildValidSpec(1);
    const fixtures: MockFixture[] = [
      await plannerFixture(spec),
      ...(await generatorSprintFixtures(1, 'initial', false)),
      await evaluatorFixture(1, true),
    ];
    const runtime = new MockRuntime({ fixtures });
    const agents = defaultAgents();
    const h = new Harness({ config, modules: [] }, agents);
    const result = await h.run(request, { runtime });
    expect(result.passed).toBe(true);
    expect(result.iteration).toBe(1);
    expect(runtime.consumedFixtureCount).toBe(3);
    // final.json written with passing report.
    const final = JSON.parse(
      await readFile(join(runDir, 'evaluator', 'final.json'), 'utf8')
    ) as EvalReport;
    expect(final.passed).toBe(true);
    // planner handoff written.
    const plannerHandoff = JSON.parse(
      await readFile(join(runDir, 'planner', 'handoff.json'), 'utf8')
    ) as { stage: string };
    expect(plannerHandoff.stage).toBe('planner-to-generator');
  });

  it('(fix loop) iter 1 fails, iter 2 passes, generator re-enters with fresh context', async () => {
    const spec = buildValidSpec(1);
    const fixtures: MockFixture[] = [
      await plannerFixture(spec),
      ...(await generatorSprintFixtures(1, 'initial', false)),
      await evaluatorFixture(1, false),
      // Fix-loop re-entry: generator first sprint must be fresh.
      ...(await generatorSprintFixtures(1, 'fix', true)),
      await evaluatorFixture(2, true),
    ];
    const runtime = new MockRuntime({ fixtures });
    const agents = defaultAgents();
    const h = new Harness({ config, modules: [] }, agents);
    const result = await h.run(request, { runtime });
    expect(result.passed).toBe(true);
    expect(result.iteration).toBe(2);
    expect(runtime.consumedFixtureCount).toBe(5);
    // iteration-01/handoff.json written as the fix-loop handoff.
    const fixHandoff = JSON.parse(
      await readFile(
        join(runDir, 'evaluator', 'iteration-01', 'handoff.json'),
        'utf8'
      )
    ) as { stage: string };
    expect(fixHandoff.stage).toBe('evaluator-to-generator');
  });

  it('(max iterations) all 3 eval iterations fail → RunLimitError and passed:false final.json', async () => {
    const spec = buildValidSpec(1);
    const fixtures: MockFixture[] = [
      await plannerFixture(spec),
      ...(await generatorSprintFixtures(1, 'initial', false)),
      await evaluatorFixture(1, false),
      ...(await generatorSprintFixtures(1, 'fix1', true)),
      await evaluatorFixture(2, false),
      ...(await generatorSprintFixtures(1, 'fix2', true)),
      await evaluatorFixture(3, false),
    ];
    const runtime = new MockRuntime({ fixtures });
    const agents = defaultAgents();
    const h = new Harness({ config, modules: [] }, agents);
    await expect(h.run(request, { runtime })).rejects.toBeInstanceOf(
      RunLimitError
    );
    // Despite the throw, the final report is persisted with passed:false.
    const final = JSON.parse(
      await readFile(join(runDir, 'evaluator', 'final.json'), 'utf8')
    ) as EvalReport;
    expect(final.passed).toBe(false);
    expect(final.iteration).toBe(3);
  });

  it('(broken spec) planner returns invalid Spec → throws before generator starts', async () => {
    const fixtures: MockFixture[] = [await plannerFixture(brokenSpec())];
    const runtime = new MockRuntime({ fixtures });
    const agents = defaultAgents();
    const h = new Harness({ config, modules: [] }, agents);
    await expect(h.run(request, { runtime })).rejects.toBeInstanceOf(
      PlannerValidationError
    );
    // Generator was never invoked.
    expect(runtime.consumedFixtureCount).toBe(1);
    // No final.json written.
    await expect(
      readFile(join(runDir, 'evaluator', 'final.json'), 'utf8')
    ).rejects.toThrow();
  });
});
