/**
 * Public programmatic API surface for @forge/cli.
 *
 * The CLI binary lives in `./cli.ts` (built to `dist/cli.js`); this
 * file carries re-exports that external callers — notably the
 * monorepo's `scripts/seed-examples.mts` and future third-party
 * integrations — need to drive `forge init` without spawning the
 * bin entry.
 *
 * Keep this file side-effect-free. Importing `@forge/cli` must never
 * execute the CLI.
 */
export { runInit } from './commands/init.js';
export type { InitOptions, InitResult } from './commands/init.js';
export { runCheck } from './commands/check.js';
export type { CheckOptions, CheckResult, CheckStepResult } from './commands/check.js';
export { BUILTIN_REGISTRY, selectModules } from './registry.js';
export {
  BUILTIN_MODULES,
  resolveModuleDependencies,
} from './wizard/dependency-resolver.js';
export type { BuiltinModule } from './wizard/dependency-resolver.js';
