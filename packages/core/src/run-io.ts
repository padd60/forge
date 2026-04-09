import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import {
  EvalReportSchema,
  HandoffSchema,
  RunRequestSchema,
  SpecSchema,
  type EvalReport,
  type Handoff,
  type RunRequest,
  type Spec,
} from '@forge-kit-dev/schemas';

import type { RunPaths } from './paths.js';

/**
 * Thrown when a file under `.forge/runs/<runId>/` fails its schema check.
 * Surfaces as a distinct class so Harness.run()'s callers can treat
 * schema drift differently from IO or LLM errors. The original error is
 * attached to the standard `Error.cause`.
 */
export class RunSchemaError extends Error {
  readonly filePath: string;
  constructor(filePath: string, cause: unknown) {
    super(
      `forge: schema validation failed for ${filePath}: ${(cause as Error)?.message ?? String(cause)}`,
      { cause }
    );
    this.name = 'RunSchemaError';
    this.filePath = filePath;
  }
}

/**
 * The writer half of the file-based handoff contract. Every transition
 * inside `Harness.run()` (and mirrored by the `/forge-*` slash commands)
 * goes through one of these methods so paths and JSON formatting stay
 * consistent across the codebase.
 */
export interface RunFileWriter {
  writeRequest(paths: RunPaths, req: RunRequest): Promise<void>;
  writeSpec(paths: RunPaths, spec: Spec, md: string): Promise<void>;
  writePlannerHandoff(paths: RunPaths, handoff: Handoff): Promise<void>;
  writeSprintHandoff(sprintDir: string, handoff: Handoff): Promise<void>;
  writeSprintSelfCheck(
    sprintDir: string,
    selfCheck: SprintSelfCheck
  ): Promise<void>;
  writeEvalReport(
    iterDir: string,
    report: EvalReport,
    md: string
  ): Promise<void>;
  writeEvalToGeneratorHandoff(
    iterDir: string,
    handoff: Handoff
  ): Promise<void>;
  writeFinalReport(paths: RunPaths, report: EvalReport): Promise<void>;
}

/** The reader half. Always validates the parsed JSON against its schema. */
export interface RunFileReader {
  readSpec(paths: RunPaths): Promise<Spec>;
  readEvalReport(iterDir: string): Promise<EvalReport>;
  readSprintSelfCheck(sprintDir: string): Promise<SprintSelfCheck>;
}

/**
 * Mechanical lint/tsc result persisted by the Generator at the end of
 * each sprint. Produced inside the Generator sub-agent (where `pnpm lint`
 * lives) and read by `Harness.run()` to decide whether to proceed to the
 * next sprint or abort the generator with a `SprintFailedError`.
 */
export interface SprintSelfCheck {
  ok: boolean;
  log: string;
}

export const SPRINT_PLAN_FILENAME = 'plan.md';
export const SPRINT_DIFF_FILENAME = 'diff.patch';
export const SPRINT_SELF_CHECK_FILENAME = 'self-check.json';
export const SPRINT_HANDOFF_FILENAME = 'handoff.json';
export const EVAL_REPORT_JSON_FILENAME = 'report.json';
export const EVAL_REPORT_MD_FILENAME = 'report.md';
export const EVAL_TO_GEN_HANDOFF_FILENAME = 'handoff.json';

/**
 * Factory for the combined reader/writer. No parameters today — the
 * interface is prepared for a future in-memory fs adapter, but v0.1
 * always uses the real filesystem.
 */
export function createRunIo(): RunFileWriter & RunFileReader {
  return new FsRunIo();
}

class FsRunIo implements RunFileWriter, RunFileReader {
  async writeRequest(paths: RunPaths, req: RunRequest): Promise<void> {
    // Schema-validate before writing so a malformed request can't get
    // persisted and then silently read back later.
    RunRequestSchema.parse(req);
    await writeJson(paths.request, req);
  }

  async writeSpec(paths: RunPaths, spec: Spec, md: string): Promise<void> {
    SpecSchema.parse(spec);
    await writeJson(paths.plannerSpecJson, spec);
    await writeText(paths.plannerSpecMd, md);
  }

  async writePlannerHandoff(
    paths: RunPaths,
    handoff: Handoff
  ): Promise<void> {
    HandoffSchema.parse(handoff);
    await writeJson(paths.plannerHandoff, handoff);
  }

  async writeSprintHandoff(
    sprintDir: string,
    handoff: Handoff
  ): Promise<void> {
    HandoffSchema.parse(handoff);
    await writeJson(join(sprintDir, SPRINT_HANDOFF_FILENAME), handoff);
  }

  async writeSprintSelfCheck(
    sprintDir: string,
    selfCheck: SprintSelfCheck
  ): Promise<void> {
    await writeJson(join(sprintDir, SPRINT_SELF_CHECK_FILENAME), selfCheck);
  }

  async writeEvalReport(
    iterDir: string,
    report: EvalReport,
    md: string
  ): Promise<void> {
    EvalReportSchema.parse(report);
    await writeJson(join(iterDir, EVAL_REPORT_JSON_FILENAME), report);
    await writeText(join(iterDir, EVAL_REPORT_MD_FILENAME), md);
  }

  async writeEvalToGeneratorHandoff(
    iterDir: string,
    handoff: Handoff
  ): Promise<void> {
    HandoffSchema.parse(handoff);
    await writeJson(join(iterDir, EVAL_TO_GEN_HANDOFF_FILENAME), handoff);
  }

  async writeFinalReport(
    paths: RunPaths,
    report: EvalReport
  ): Promise<void> {
    EvalReportSchema.parse(report);
    await writeJson(paths.finalReport, report);
  }

  async readSpec(paths: RunPaths): Promise<Spec> {
    return readAndParse(paths.plannerSpecJson, SpecSchema);
  }

  async readEvalReport(iterDir: string): Promise<EvalReport> {
    return readAndParse(
      join(iterDir, EVAL_REPORT_JSON_FILENAME),
      EvalReportSchema
    );
  }

  async readSprintSelfCheck(sprintDir: string): Promise<SprintSelfCheck> {
    const filePath = join(sprintDir, SPRINT_SELF_CHECK_FILENAME);
    const raw = await readFile(filePath, 'utf8');
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (
        !parsed ||
        typeof parsed !== 'object' ||
        typeof (parsed as { ok?: unknown }).ok !== 'boolean' ||
        typeof (parsed as { log?: unknown }).log !== 'string'
      ) {
        throw new Error('self-check.json must have { ok: boolean, log: string }');
      }
      return parsed as SprintSelfCheck;
    } catch (err) {
      throw new RunSchemaError(filePath, err);
    }
  }
}

/**
 * Render a Spec as a human-readable Markdown briefing. Generator
 * sub-agents receive this file (not spec.json) in their prompt so a
 * developer scrolling the run dir can read the plan without parsing JSON.
 */
export function renderSpecMd(spec: Spec): string {
  const lines: string[] = [];
  lines.push(`# forge Spec — ${spec.runId}`);
  lines.push('');
  lines.push(`**Goal:** ${spec.goal}`);
  lines.push('');
  if (spec.targetLayer || spec.targetSlice) {
    const target = [spec.targetLayer, spec.targetSlice]
      .filter(Boolean)
      .join('/');
    lines.push(`**Target:** \`${target}\``);
    lines.push('');
  }
  if (spec.activeModules.length > 0) {
    lines.push(`**Active modules:** ${spec.activeModules.join(', ')}`);
    lines.push('');
  }
  lines.push('## Sprints');
  lines.push('');
  spec.sprints.forEach((sprint, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    lines.push(`### Sprint ${num} — ${sprint.title}`);
    lines.push('');
    if (sprint.description) {
      lines.push(sprint.description);
      lines.push('');
    }
    if (sprint.filesTouched.length > 0) {
      lines.push('**Files touched:**');
      for (const file of sprint.filesTouched) {
        lines.push(`- \`${file}\``);
      }
      lines.push('');
    }
    lines.push('**Acceptance criteria:**');
    for (const ac of sprint.acceptanceCriteria) {
      lines.push(`- ${ac}`);
    }
    lines.push('');
  });
  lines.push('## Success criteria');
  lines.push('');
  for (const c of spec.successCriteria) {
    lines.push(`- ${c}`);
  }
  lines.push('');
  return lines.join('\n');
}

/**
 * Render an EvalReport as Markdown for the run dir. The Generator reads
 * this file (not the JSON) during fix-loop iterations.
 */
export function renderReportMd(report: EvalReport): string {
  const lines: string[] = [];
  lines.push(`# Eval Report — iteration ${report.iteration}`);
  lines.push('');
  lines.push(
    `**Score:** ${report.totalScore} / ${report.maxScore}  •  **Passed:** ${report.passed ? 'yes' : 'no'}  •  **Retry:** ${report.shouldRetry ? 'yes' : 'no'}`
  );
  lines.push('');
  lines.push('## Criteria');
  lines.push('');
  for (const score of report.scores) {
    lines.push(
      `### ${score.criterionId} — ${score.score}/10`
    );
    lines.push('');
    lines.push(score.rationale);
    lines.push('');
    if (score.violatingFiles.length > 0) {
      lines.push('**Violating files:**');
      for (const f of score.violatingFiles) {
        lines.push(`- \`${f}\``);
      }
      lines.push('');
    }
  }
  if (report.suggestions.length > 0) {
    lines.push('## Suggestions');
    lines.push('');
    for (const s of report.suggestions) {
      lines.push(`- ${s}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

async function writeJson(filePath: string, body: unknown): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(body, null, 2)}\n`, 'utf8');
}

async function writeText(filePath: string, body: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, body.endsWith('\n') ? body : `${body}\n`, 'utf8');
}

async function readAndParse<T>(
  filePath: string,
  schema: { parse: (input: unknown) => T }
): Promise<T> {
  let raw: string;
  try {
    raw = await readFile(filePath, 'utf8');
  } catch (err) {
    throw new RunSchemaError(filePath, err);
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return schema.parse(parsed);
  } catch (err) {
    throw new RunSchemaError(filePath, err);
  }
}
