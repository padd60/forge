import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import type {
  AgentRuntime,
  EvaluatorInput,
  GeneratorInput,
  PlannerInput,
} from '@forge-kit-dev/agents';
import { RunLimitError } from '@forge-kit-dev/agents';
import type {
  EvalReport,
  Handoff,
  Rubric,
  RunRequest,
} from '@forge-kit-dev/schemas';

import type { HarnessOptions } from './config.js';
import type { HarnessAgents } from './harness.js';
import type { Module } from './module.js';
import { computeRunPaths, evalIterationDir, sprintDir } from './paths.js';
import {
  createRunIo,
  renderReportMd,
  renderSpecMd,
  type RunFileReader,
  type RunFileWriter,
} from './run-io.js';

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
    const rawReport = await agents.evaluator.evaluate(evalInput, runtime);
    const report = recomputeScore(
      rawReport,
      rubrics,
      opts.config.evaluator.minScore,
      opts.config.moduleWeights
    );
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

/**
 * Re-derive `totalScore` and `maxScore` from the raw per-criterion scores
 * using **module-level normalization**, then compare against the evaluator's
 * self-reported values. If the delta exceeds ±2 points the code-computed
 * values win and a warning is logged. `passed` is always recalculated
 * against `minScore`.
 *
 * Algorithm:
 *   1. Group criteria by module (via each rubric's `module` field).
 *   2. Per module: `moduleScore = Σ(weight × score) / Σ(weight × 10) × 100`
 *      → a 0-100 value regardless of how many criteria the module ships.
 *   3. Final `totalScore = weightedAvg(moduleScores)` where each module
 *      contributes equally by default, or proportionally when
 *      `moduleWeights` is provided in the config.
 *   4. `maxScore = 100` (normalized percentage scale).
 *
 * This ensures a module with 7 criteria (FSD) does not drown out a module
 * with 2 criteria (CQRS) — they each contribute the same share unless the
 * user explicitly overrides via `moduleWeights`.
 */
export function recomputeScore(
  report: EvalReport,
  rubrics: readonly Rubric[],
  minScore: number,
  moduleWeights?: Record<string, number>
): EvalReport {
  // Build lookups: criterionId → { weight, module }
  const criterionMeta = new Map<string, { weight: number; module: string }>();
  for (const rubric of rubrics) {
    for (const criterion of rubric.criteria) {
      criterionMeta.set(criterion.id, {
        weight: criterion.weight,
        module: rubric.module,
      });
    }
  }

  // If no rubrics are loaded (e.g. zero modules active), there is nothing
  // to cross-check — trust the evaluator's numbers and only recalculate
  // `passed` against the code-level minScore.
  if (criterionMeta.size === 0) {
    const passed = report.totalScore >= minScore;
    return { ...report, passed };
  }

  // Accumulate per-module weighted sums.
  const moduleAcc = new Map<string, { weightedSum: number; weightedMax: number }>();

  for (const s of report.scores) {
    const meta = criterionMeta.get(s.criterionId);
    if (meta === undefined) {
      // Criterion not found in any rubric — skip silently.
      // This can happen when modules change between runs.
      continue;
    }
    let acc = moduleAcc.get(meta.module);
    if (!acc) {
      acc = { weightedSum: 0, weightedMax: 0 };
      moduleAcc.set(meta.module, acc);
    }
    acc.weightedSum += meta.weight * s.score;
    acc.weightedMax += meta.weight * 10;
  }

  // Compute each module's normalized 0-100 score and weighted-average them.
  const moduleNames = [...moduleAcc.keys()];
  const moduleScores: number[] = [];
  const moduleWeightValues: number[] = [];

  for (const name of moduleNames) {
    const acc = moduleAcc.get(name)!;
    const score = acc.weightedMax > 0
      ? (acc.weightedSum / acc.weightedMax) * 100
      : 0;
    moduleScores.push(score);

    // If the user specified module weights, use them; otherwise equal weight.
    const w = moduleWeights?.[name] ?? 1;
    moduleWeightValues.push(w);
  }

  const totalWeight = moduleWeightValues.reduce((a, b) => a + b, 0);
  const computedTotal = totalWeight > 0
    ? moduleScores.reduce((sum, score, i) => sum + score * moduleWeightValues[i]!, 0) / totalWeight
    : 0;
  const computedMax = 100;

  // ±2 tolerance comparison: convert the evaluator's report to the same
  // 0-100 scale before comparing. If maxScore was on the old raw scale,
  // normalize it.
  const reportNormalized = report.maxScore > 0
    ? (report.totalScore / report.maxScore) * 100
    : report.totalScore;

  const TOLERANCE = 2;
  const totalDiff = Math.abs(computedTotal - reportNormalized);

  if (totalDiff > TOLERANCE) {
    // eslint-disable-next-line no-console
    console.warn(
      `[forge] recomputeScore: evaluator reported ` +
        `totalScore=${report.totalScore}/${report.maxScore} ` +
        `(normalized ${reportNormalized.toFixed(1)}) ` +
        `but code computed ${computedTotal.toFixed(1)}/100. ` +
        `Using code-computed values.`
    );
  }

  const correctedTotal = totalDiff > TOLERANCE
    ? Math.round(computedTotal * 10) / 10
    : Math.round(reportNormalized * 10) / 10;
  const passed = correctedTotal >= minScore;

  return {
    ...report,
    totalScore: correctedTotal,
    maxScore: computedMax,
    passed,
  };
}
