import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { EvalReport, Rubric, Spec } from '@forge-kit-dev/schemas';

import { DefaultEvaluator } from '../default-evaluator';
import { MockRuntime } from '../mock-runtime';
import type { EvaluatorInput } from '../evaluator';

const ISO = '2026-04-09T00:00:00.000Z';

function makePassingReport(iteration: number): EvalReport {
  return {
    runId: 'run-eval',
    iteration,
    totalScore: 85,
    maxScore: 100,
    passed: true,
    scores: [
      {
        criterionId: 'fsd.layer-placement',
        score: 10,
        rationale: 'placed in correct layer',
        violatingFiles: [],
      },
    ],
    suggestions: [],
    shouldRetry: false,
    createdAt: ISO,
  };
}

function makeSpec(): Spec {
  return {
    runId: 'run-eval',
    goal: 'add login form',
    activeModules: ['module-fsd'],
    sprints: [
      {
        id: 'sprint-01',
        title: 't',
        description: 'd',
        filesTouched: [],
        acceptanceCriteria: ['done'],
      },
    ],
    successCriteria: ['done'],
    createdAt: ISO,
  };
}

const emptyRubric: Rubric[] = [];

describe('DefaultEvaluator', () => {
  let workDir: string;
  let iterationDir: string;
  let baseInput: EvaluatorInput;

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'forge-deval-'));
    iterationDir = join(workDir, 'evaluator', 'iteration-01');
    const specMdPath = join(workDir, 'spec.md');
    const diffPath = join(workDir, 'diff.patch');
    await writeFile(specMdPath, '# Spec\n', 'utf8');
    await writeFile(diffPath, 'diff --git a/x b/x\n', 'utf8');
    baseInput = {
      runId: 'run-eval',
      iteration: 1,
      spec: makeSpec(),
      rubrics: emptyRubric,
      repoRoot: workDir,
      baseRef: 'HEAD~1',
      headRef: 'HEAD',
      specMdPath,
      diffPath,
      iterationDir,
    };
  });

  afterEach(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  async function writeReportFixtures(
    report: EvalReport
  ): Promise<{ jsonSrc: string; mdSrc: string }> {
    const fx = join(workDir, 'fixtures');
    await mkdir(fx, { recursive: true });
    const jsonSrc = join(fx, 'report.json');
    const mdSrc = join(fx, 'report.md');
    await writeFile(jsonSrc, JSON.stringify(report), 'utf8');
    await writeFile(mdSrc, `# Report\n`, 'utf8');
    return { jsonSrc, mdSrc };
  }

  it('always spawns the evaluator with freshContext:true', async () => {
    const report = makePassingReport(1);
    const { jsonSrc, mdSrc } = await writeReportFixtures(report);
    const runtime = new MockRuntime({
      fixtures: [
        {
          role: 'evaluator',
          outputs: {
            [join(iterationDir, 'report.json')]: jsonSrc,
            [join(iterationDir, 'report.md')]: mdSrc,
          },
          // This is the second line of defense: if DefaultEvaluator
          // ever passes freshContext=false the fixture's assertion
          // throws. A regression cannot silently slip through the
          // hardcoded value alone.
          requireFreshContext: true,
        },
      ],
    });
    const evalAgent = new DefaultEvaluator({ systemPrompt: 'eval' });
    const result = await evalAgent.evaluate(baseInput, runtime);
    expect(result.passed).toBe(true);
    expect(runtime.history[0]?.freshContext).toBe(true);
    expect(runtime.history[0]?.role).toBe('evaluator');
  });

  it('lists spec.md and diff.patch as the evaluator input files', async () => {
    const report = makePassingReport(1);
    const { jsonSrc, mdSrc } = await writeReportFixtures(report);
    const runtime = new MockRuntime({
      fixtures: [
        {
          role: 'evaluator',
          outputs: {
            [join(iterationDir, 'report.json')]: jsonSrc,
            [join(iterationDir, 'report.md')]: mdSrc,
          },
        },
      ],
    });
    const evalAgent = new DefaultEvaluator({ systemPrompt: 'eval' });
    await evalAgent.evaluate(baseInput, runtime);
    expect(runtime.history[0]?.inputFiles).toEqual([
      baseInput.specMdPath,
      baseInput.diffPath,
    ]);
    expect(runtime.history[0]?.expectedOutputs).toEqual([
      join(iterationDir, 'report.json'),
      join(iterationDir, 'report.md'),
    ]);
  });

  it('validates report.json against EvalReportSchema', async () => {
    // Write a JSON file that is structurally bogus.
    const fx = join(workDir, 'fixtures');
    await mkdir(fx, { recursive: true });
    const badJson = join(fx, 'bad-report.json');
    await writeFile(badJson, JSON.stringify({ bogus: true }), 'utf8');
    const mdSrc = join(fx, 'report.md');
    await writeFile(mdSrc, '', 'utf8');
    const runtime = new MockRuntime({
      fixtures: [
        {
          role: 'evaluator',
          outputs: {
            [join(iterationDir, 'report.json')]: badJson,
            [join(iterationDir, 'report.md')]: mdSrc,
          },
        },
      ],
    });
    const evalAgent = new DefaultEvaluator({ systemPrompt: 'eval' });
    await expect(evalAgent.evaluate(baseInput, runtime)).rejects.toThrow();
  });
});
