import pc from 'picocolors';

/**
 * v0.1 stub for `forge eval`.
 *
 * Rationale: programmatically running the evaluator from the terminal
 * requires a standalone LLM adapter that forge does not ship yet.
 * Instead we point the user at the slash command (`/forge-eval`) that
 * runs inside Claude Code, where the Task tool can spawn a fresh
 * sub-agent per `Harness.run()`'s contract. v0.2 will add an
 * Anthropic-SDK-backed runtime so this stub can execute end-to-end
 * without Claude Code.
 */
export interface EvalResult {
  printed: string;
  exitCode: number;
}

export function runEvalStub(): EvalResult {
  const lines = [
    pc.yellow('forge: the v0.1 evaluator runs inside Claude Code.'),
    '',
    'From a Claude Code session at this repo:',
    `  ${pc.cyan('/forge-eval')}`,
    '',
    'The slash command will:',
    '  1. load .forge/config.json',
    '  2. re-use the most recent run under .forge/runs/',
    '  3. spawn a fresh evaluator sub-agent via the Task tool',
    '  4. write evaluator/iteration-<N>/report.json',
    '',
    pc.dim('A standalone runtime for `forge eval` is planned for v0.2.'),
  ];
  const printed = lines.join('\n');
  return { printed, exitCode: 0 };
}
