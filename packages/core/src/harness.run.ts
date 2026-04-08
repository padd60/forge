import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import type {
  AgentRuntime,
  EvaluatorInput,
  GeneratorInput,
  PlannerInput,
} from '@forge/agents';
import { RunLimitError } from '@forge/agents';
import type {
  EvalReport,
  Handoff,
  Rubric,
  RunRequest,
} from '@forge/schemas';

import type { HarnessOptions } from './config';
import type { HarnessAgents } from './harness';
import type { Module } from './module';
import { computeRunPaths, evalIterationDir, sprintDir } from './paths';
import {
  createRunIo,
  renderReportMd,
  renderSpecMd,
  type RunFileReader,
  type RunFileWriter,
} from './run-io';

/**
 * Execution-time dependencies for `Harness.run()`.
 *
 * `runtime` is the only hard requirement. Tests always inject a
 * `MockRuntime`; in a real Claude Code environment the slash commands
 * inject a runtime adapter that invokes the host's Task tool.
 * `io` and `now` have sensible defaults but are exposed for
 * deterministic tests and, eventually, an in-memory fs adapter.
 */
export interface HarnessRunDeps {
  runtime: AgentRuntime;
  io?: RunFileWriter & RunFileReader;
  now?: () => Date;
}

/**
 * The Planner → Generator → Evaluator → (fix loop) state machine.
 *
 * Every state transition writes a JSON or markdown file under
 * `.forge/runs/<runId>/`. This means the whole run is recoverable and
 * inspectable on disk, and — more importantly — that the Evaluator
 * never has implicit access to Generator context. Isolation is
 * physical, not prompt-level.
 *
 * Behavior:
 *  - On `EvalReport.passed === true`, the final report is persisted to
 *    `evaluator/final.json` and returned.
 *  - On `passed === false` with `iteration < maxIterations`, the loop
 *    writes an `evaluator-to-generator` handoff and re-enters the
 *    Generator with `previousReport`. The Default Generator uses that
 *    signal to spawn its first sprint with `freshContext: true`.
 *  - On `iteration === maxIterations` without a pass, the last report
 *    is persisted as `final.json` (with `passed: false`) and a
 *    `RunLimitError` is thrown. Persisting the failure lets `/forge-fix`
 *    pick up where the run left off.
 *
 * NOTE on sprint directories: v0.1 reuses `generator/sprint-0N/` across
 * fix-loop iterations — each re-entry overwrites the previous sprint
 * artifacts. Evaluator reports are iteration-scoped
 * (`evaluator/iteration-0M/`) so the scoring history is still preserved.
 */
export async function runPipeline(
  request: RunRequest,
  opts: HarnessOptions,
  agents: HarnessAgents,
  deps: HarnessRunDeps
): Promise<EvalReport> {
  const runtime = deps.runtime;
  const io = deps.io ?? createRunIo();
  const now = deps.now ?? ((): Date => new Date());

  const paths = computeRunPaths(
    opts.config.paths.forgeDir,
    request.runId
  );
  await io.writeRequest(paths, request);

  // ----- Planner -----
  const plannerInput: PlannerInput = {
    runId: request.runId,
    goal: request.goal,
    repoRoot: opts.config.paths.repoRoot,
    activeModules: request.activeModules,
    requestPath: paths.request,
    specJsonPath: paths.plannerSpecJson,
  };
  const spec = await agents.planner.plan(plannerInput, runtime);

  await io.writeSpec(paths, spec, renderSpecMd(spec));
  const plannerHandoff: Handoff = {
    stage: 'planner-to-generator',
    runId: request.runId,
    fromPath: paths.plannerSpecMd,
    toInputs: { spec: paths.plannerSpecMd },
    summary: `Spec with ${spec.sprints.length} sprint${spec.sprints.length === 1 ? '' : 's'} ready for generator`,
    createdAt: now().toISOString(),
  };
  await io.writePlannerHandoff(paths, plannerHandoff);

  // ----- Generator: first pass -----
  const sprintDirs = spec.sprints.map((_, i) => sprintDir(paths, i + 1));
  for (const dir of sprintDirs) {
    await mkdir(dir, { recursive: true });
  }

  const baseGeneratorInput: GeneratorInput = {
    runId: request.runId,
    spec,
    repoRoot: opts.config.paths.repoRoot,
    specMdPath: paths.plannerSpecMd,
    sprintDirs,
  };
  let genResult = await agents.generator.generate(
    baseGeneratorInput,
    runtime
  );

  // ----- Evaluator + fix loop -----
  const rubrics = collectRubrics(opts.modules);
  const maxIterations = opts.config.evaluator.maxIterations;

  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    const iterDir = evalIterationDir(paths, iteration);
    await mkdir(iterDir, { recursive: true });

    const evalInput: EvaluatorInput = {
      runId: request.runId,
      iteration,
      spec,
      rubrics,
      repoRoot: opts.config.paths.repoRoot,
      baseRef: 'HEAD~1',
      headRef: 'HEAD',
      specMdPath: paths.plannerSpecMd,
      diffPath: join(genResult.finalSprintPath, 'diff.patch'),
      iterationDir: iterDir,
    };
    const report = await agents.evaluator.evaluate(evalInput, runtime);
    await io.writeEvalReport(iterDir, report, renderReportMd(report));

    if (report.passed) {
      await io.writeFinalReport(paths, report);
      return report;
    }

    if (iteration === maxIterations) {
      await io.writeFinalReport(paths, report);
      throw new RunLimitError(request.runId, iteration, report);
    }

    // Fix loop re-entry: write the evaluator-to-generator handoff and
    // spawn the generator again with the previous report.
    const fixHandoff: Handoff = {
      stage: 'evaluator-to-generator',
      runId: request.runId,
      fromPath: join(iterDir, 'report.md'),
      toInputs: {
        spec: paths.plannerSpecMd,
        report: join(iterDir, 'report.md'),
      },
      summary: `iteration ${iteration} failed (${report.totalScore}/${report.maxScore}); generator re-entering with fresh context`,
      createdAt: now().toISOString(),
    };
    await io.writeEvalToGeneratorHandoff(iterDir, fixHandoff);

    genResult = await agents.generator.generate(
      {
        ...baseGeneratorInput,
        previousReport: report,
        previousReportMdPath: join(iterDir, 'report.md'),
      },
      runtime
    );
  }

  // The loop body always either returns or throws, so this is only
  // here to satisfy the type checker's `noImplicitReturns`.
  throw new Error('forge: runPipeline exited the evaluator loop unexpectedly');
}

function collectRubrics(modules: readonly Module[]): readonly Rubric[] {
  const out: Rubric[] = [];
  for (const mod of modules) {
    const rubrics = mod.rubrics?.();
    if (rubrics) out.push(...rubrics);
  }
  return out;
}
