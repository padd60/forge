import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type {
  EvalReport,
  Handoff,
  RunRequest,
  Spec,
} from '@forge-kit-dev/schemas';

import { computeRunPaths, evalIterationDir, sprintDir } from '../paths';
import type { RunPaths } from '../paths';
import {
  createRunIo,
  renderReportMd,
  renderSpecMd,
  RunSchemaError,
} from '../run-io';

const ISO = new Date('2026-04-09T00:00:00.000Z').toISOString();

function makeRequest(repoRoot: string): RunRequest {
  return {
    runId: 'run-test',
    goal: 'add login form',
    enforcement: 'hybrid',
    activeModules: ['module-fsd'],
    repoRoot,
    createdAt: ISO,
  };
}

function makeSpec(): Spec {
  return {
    runId: 'run-test',
    goal: 'add login form',
    activeModules: ['module-fsd'],
    targetLayer: 'features',
    targetSlice: 'auth-login',
    sprints: [
      {
        id: 'sprint-01',
        title: 'scaffold feature slice',
        description: 'create login form feature slice with public API',
        filesTouched: ['src/features/auth-login/ui/LoginForm.tsx'],
        acceptanceCriteria: ['LoginForm exists', 'public API exports it'],
      },
    ],
    successCriteria: ['form submits', 'validation errors surface'],
    createdAt: ISO,
  };
}

function makeHandoff(overrides: Partial<Handoff> = {}): Handoff {
  return {
    stage: 'planner-to-generator',
    runId: 'run-test',
    fromPath: 'planner/spec.md',
    toInputs: { spec: 'planner/spec.md' },
    summary: 'spec ready',
    createdAt: ISO,
    ...overrides,
  };
}

function makeEvalReport(iteration: number, passed: boolean): EvalReport {
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
        rationale: passed
          ? 'slice placed in features/auth-login as required'
          : 'feature slice contains entity imports',
        violatingFiles: passed ? [] : ['src/features/auth-login/model/bad.ts'],
      },
    ],
    suggestions: passed ? [] : ['move entity import out of feature slice'],
    shouldRetry: !passed,
    createdAt: ISO,
  };
}

describe('run-io', () => {
  let workDir: string;
  let paths: RunPaths;

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'forge-runio-'));
    paths = computeRunPaths(join(workDir, '.forge'), 'run-test');
  });

  afterEach(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  it('writes and re-reads a request.json round-trip', async () => {
    const io = createRunIo();
    const req = makeRequest(workDir);
    await io.writeRequest(paths, req);
    const raw = await readFile(paths.request, 'utf8');
    expect(raw.endsWith('\n')).toBe(true);
    const parsed = JSON.parse(raw) as RunRequest;
    expect(parsed).toEqual(req);
  });

  it('writes spec.json and spec.md and re-reads spec.json', async () => {
    const io = createRunIo();
    const spec = makeSpec();
    await io.writeSpec(paths, spec, renderSpecMd(spec));
    const fromDisk = await io.readSpec(paths);
    expect(fromDisk).toEqual(spec);
    const md = await readFile(paths.plannerSpecMd, 'utf8');
    expect(md).toContain('# forge Spec');
    expect(md).toContain('Sprint 01');
    expect(md).toContain('auth-login');
  });

  it('writes planner handoff with schema validation', async () => {
    const io = createRunIo();
    await io.writePlannerHandoff(paths, makeHandoff());
    const raw = await readFile(paths.plannerHandoff, 'utf8');
    expect(JSON.parse(raw)).toMatchObject({ stage: 'planner-to-generator' });
  });

  it('writes sprint handoff and self-check into sprint-XX dir', async () => {
    const io = createRunIo();
    const sDir = sprintDir(paths, 1);
    await io.writeSprintSelfCheck(sDir, { ok: true, log: 'all clean' });
    await io.writeSprintHandoff(
      sDir,
      makeHandoff({ stage: 'generator-to-sprint' })
    );
    const selfCheck = await io.readSprintSelfCheck(sDir);
    expect(selfCheck).toEqual({ ok: true, log: 'all clean' });
  });

  it('rejects malformed self-check.json with a RunSchemaError', async () => {
    const io = createRunIo();
    const sDir = sprintDir(paths, 1);
    // Write a file that is valid JSON but the wrong shape.
    const { mkdir } = await import('node:fs/promises');
    await mkdir(sDir, { recursive: true });
    await writeFile(
      join(sDir, 'self-check.json'),
      JSON.stringify({ ok: 'maybe' }),
      'utf8'
    );
    await expect(io.readSprintSelfCheck(sDir)).rejects.toBeInstanceOf(
      RunSchemaError
    );
  });

  it('writes eval report + markdown and re-reads the JSON', async () => {
    const io = createRunIo();
    const iterDir = evalIterationDir(paths, 1);
    const report = makeEvalReport(1, false);
    await io.writeEvalReport(iterDir, report, renderReportMd(report));
    const back = await io.readEvalReport(iterDir);
    expect(back).toEqual(report);
    const md = await readFile(join(iterDir, 'report.md'), 'utf8');
    expect(md).toContain('Eval Report — iteration 1');
    expect(md).toContain('move entity import out');
  });

  it('writes evaluator-to-generator handoff in the iteration dir', async () => {
    const io = createRunIo();
    const iterDir = evalIterationDir(paths, 2);
    await io.writeEvalToGeneratorHandoff(
      iterDir,
      makeHandoff({ stage: 'evaluator-to-generator' })
    );
    const raw = await readFile(join(iterDir, 'handoff.json'), 'utf8');
    expect(JSON.parse(raw)).toMatchObject({
      stage: 'evaluator-to-generator',
    });
  });

  it('writes final.json with the last report verbatim', async () => {
    const io = createRunIo();
    const report = makeEvalReport(2, true);
    await io.writeFinalReport(paths, report);
    const raw = await readFile(paths.finalReport, 'utf8');
    expect(JSON.parse(raw)).toEqual(report);
  });

  it('mkdir is idempotent across repeated writes', async () => {
    const io = createRunIo();
    const req = makeRequest(workDir);
    await io.writeRequest(paths, req);
    // Writing again must not throw even though the dir already exists.
    await io.writeRequest(paths, req);
    const raw = await readFile(paths.request, 'utf8');
    expect(JSON.parse(raw)).toEqual(req);
  });

  it('readSpec throws RunSchemaError when the file is missing', async () => {
    const io = createRunIo();
    await expect(io.readSpec(paths)).rejects.toBeInstanceOf(RunSchemaError);
  });

  it('rejects a Spec missing required fields before writing', async () => {
    const io = createRunIo();
    const bad = { ...makeSpec(), sprints: [] } as unknown as Spec;
    await expect(io.writeSpec(paths, bad, '')).rejects.toThrow();
  });
});
