/**
 * A capability-scoped tool subset that an agent is allowed to use.
 *
 * Runtimes translate these abstract tools into their host environment's
 * concrete tools (e.g. Claude Code's `Read`, `Edit`, `Write`, `Bash`).
 * Keeping them abstract here means modules can declare "needs file
 * reads" without coupling to a particular host.
 */
export type ForgeTool =
  | 'read'
  | 'search' // glob / grep
  | 'edit'
  | 'write'
  | 'shell' // shell exec; runtimes further restrict by command allowlist
  | 'browser'; // playwright-style UI checks, opt-in

export interface AgentToolkit {
  readonly allowed: ReadonlySet<ForgeTool>;
  /**
   * Optional allowlist of shell commands (comma-free prefix match). Only
   * consulted when `allowed` includes `'shell'`.
   */
  readonly shellAllowlist?: readonly string[];
}

/**
 * Pre-built toolkits that match forge's role definitions.
 * They intentionally deny more than they allow — most tool access is
 * role-specific to prevent, e.g., a Planner from mutating code.
 */
export const PLANNER_TOOLKIT: AgentToolkit = {
  allowed: new Set<ForgeTool>(['read', 'search']),
};

export const GENERATOR_TOOLKIT: AgentToolkit = {
  allowed: new Set<ForgeTool>(['read', 'search', 'edit', 'write', 'shell']),
  shellAllowlist: ['pnpm lint', 'pnpm test', 'pnpm typecheck', 'tsc', 'eslint'],
};

export const EVALUATOR_TOOLKIT: AgentToolkit = {
  allowed: new Set<ForgeTool>(['read', 'search', 'shell', 'browser']),
  shellAllowlist: [
    'pnpm lint',
    'pnpm test',
    'pnpm typecheck',
    'tsc',
    'eslint',
    'git diff',
    'git log',
  ],
};
