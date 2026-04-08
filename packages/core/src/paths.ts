import { join } from 'node:path';
import { nanoid } from 'nanoid';

/**
 * Build a stable runId. Sortable by timestamp first, random suffix
 * second — the sort property matters because `ls .forge/runs` is how a
 * developer navigates runs during debugging.
 */
export function createRunId(now: Date = new Date()): string {
  const stamp = now.toISOString().replace(/[:.]/g, '-');
  return `${stamp}-${nanoid(6)}`;
}

/**
 * Canonical layout under `<forgeDir>/runs/<runId>/`. The Harness writes
 * these paths; the agents read them. Keeping every path string in one
 * file prevents "file moved in runtime but stale in agent prompt"
 * class of bugs.
 */
export interface RunPaths {
  root: string;
  request: string;
  plannerDir: string;
  plannerSpecJson: string;
  plannerSpecMd: string;
  plannerHandoff: string;
  generatorDir: string;
  evaluatorDir: string;
  finalReport: string;
}

export function computeRunPaths(forgeDir: string, runId: string): RunPaths {
  const root = join(forgeDir, 'runs', runId);
  const plannerDir = join(root, 'planner');
  const generatorDir = join(root, 'generator');
  const evaluatorDir = join(root, 'evaluator');
  return {
    root,
    request: join(root, 'request.json'),
    plannerDir,
    plannerSpecJson: join(plannerDir, 'spec.json'),
    plannerSpecMd: join(plannerDir, 'spec.md'),
    plannerHandoff: join(plannerDir, 'handoff.json'),
    generatorDir,
    evaluatorDir,
    finalReport: join(evaluatorDir, 'final.json'),
  };
}

export function sprintDir(paths: RunPaths, index: number): string {
  const padded = String(index).padStart(2, '0');
  return join(paths.generatorDir, `sprint-${padded}`);
}

export function evalIterationDir(paths: RunPaths, iteration: number): string {
  const padded = String(iteration).padStart(2, '0');
  return join(paths.evaluatorDir, `iteration-${padded}`);
}
