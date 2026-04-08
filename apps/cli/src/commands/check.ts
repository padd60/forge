import { execa } from 'execa';
import pc from 'picocolors';

export interface CheckOptions {
  repoRoot: string;
  /** If false, short-circuit the first failure. Default: true. */
  runAll?: boolean;
}

export interface CheckStepResult {
  name: string;
  ok: boolean;
  durationMs: number;
  message: string;
}

export interface CheckResult {
  ok: boolean;
  steps: readonly CheckStepResult[];
}

/**
 * Run forge's mechanical gate locally. Intentionally delegates to the
 * tools the project already depends on (eslint, tsc, knip) via
 * `execa` — we never reinvent a linting engine inside forge.
 *
 * This is not a full `forge check` implementation: it doesn't consult
 * `.forge/config.json`, and it assumes the tools are resolvable via
 * `npx` in the repo root. v0.2 will read per-module check commands
 * out of the module manifests.
 */
export async function runCheck(opts: CheckOptions): Promise<CheckResult> {
  const steps: CheckStepResult[] = [];
  const runAll = opts.runAll !== false;

  const plan = [
    { name: 'eslint', command: 'npx', args: ['eslint', '.', '--max-warnings', '0'] },
    { name: 'typecheck', command: 'npx', args: ['tsc', '--noEmit'] },
  ];

  for (const step of plan) {
    const t0 = Date.now();
    try {
      await execa(step.command, step.args, { cwd: opts.repoRoot });
      steps.push({
        name: step.name,
        ok: true,
        durationMs: Date.now() - t0,
        message: pc.green('ok'),
      });
    } catch (err) {
      const message =
        (err as { shortMessage?: string }).shortMessage ??
        (err as Error).message;
      steps.push({
        name: step.name,
        ok: false,
        durationMs: Date.now() - t0,
        message,
      });
      if (!runAll) break;
    }
  }

  return {
    ok: steps.every((s) => s.ok),
    steps,
  };
}
