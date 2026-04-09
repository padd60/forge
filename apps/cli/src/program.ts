import { Command } from 'commander';
import pc from 'picocolors';

import { runAdd } from './commands/add.js';
import { runCheck } from './commands/check.js';
import { runEvalStub } from './commands/eval.js';
import { runInit, type InitOptions } from './commands/init.js';
import { runWizard } from './wizard/prompts.js';
import type { BuiltinModule } from './wizard/dependency-resolver.js';

/**
 * Factory for the commander program. Factored out so tests can spin
 * up an isolated program instance without `index.ts` calling
 * `.parseAsync(process.argv)` as a side effect at import time.
 */
export function createProgram(): Command {
  const program = new Command();
  program
    .name('forge')
    .description('Frontend AI code harness')
    .version('0.1.0');

  program
    .command('init')
    .description('Initialize forge in this project')
    .option('-y, --yes', 'skip the wizard and use defaults', false)
    .option(
      '--modules <list>',
      'comma-separated module names (bypasses the wizard)'
    )
    .option(
      '--enforcement <level>',
      'hybrid | block-all | advisory-only',
      'hybrid'
    )
    .action(async (cmdOpts: InitFlags) => {
      const opts = cmdOpts.modules
        ? await buildInitOptionsFromFlags(cmdOpts)
        : await runWizard(process.cwd());
      if (!opts) {
        process.exitCode = 1;
        return;
      }
      const result = await runInit(opts);
      process.stdout.write(
        [
          pc.green('forge: init complete'),
          `  config:  ${result.configPath}`,
          `  eslint:  ${result.eslintPath}`,
          `  husky:   ${result.huskyPath ?? '(skipped — advisory-only)'}`,
          `  .gitignore: ${result.gitignorePath}`,
          `  skills:  ${result.skillsDir}`,
          `  modules: ${result.resolvedModules.join(', ')}`,
          '',
        ].join('\n')
      );
    });

  program
    .command('add <module>')
    .description('Activate another module in an existing forge project')
    .action(async (mod: string) => {
      const result = await runAdd({
        repoRoot: process.cwd(),
        moduleName: mod as BuiltinModule,
      });
      process.stdout.write(
        `${pc.green('forge: add complete')}\n  new modules: ${result.addedModules.join(', ') || '(none)'}\n`
      );
    });

  program
    .command('check')
    .description('Run forge\'s mechanical gate (eslint + tsc)')
    .action(async () => {
      const result = await runCheck({ repoRoot: process.cwd() });
      for (const step of result.steps) {
        const label = step.ok ? pc.green('✓') : pc.red('✗');
        process.stdout.write(`${label} ${step.name} (${step.durationMs}ms)\n`);
        if (!step.ok) process.stdout.write(`    ${step.message}\n`);
      }
      process.exitCode = result.ok ? 0 : 1;
    });

  program
    .command('eval')
    .description('v0.1: prints instructions for running /forge-eval inside Claude Code')
    .action(() => {
      const result = runEvalStub();
      process.stdout.write(`${result.printed}\n`);
      process.exitCode = result.exitCode;
    });

  return program;
}

interface InitFlags {
  yes?: boolean;
  modules?: string;
  enforcement?: string;
}

async function buildInitOptionsFromFlags(
  flags: InitFlags
): Promise<InitOptions | null> {
  if (!flags.modules) return null;
  const mods = flags.modules
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0) as readonly BuiltinModule[];
  const enforcement =
    (flags.enforcement as InitOptions['enforcement']) ?? 'hybrid';
  return {
    repoRoot: process.cwd(),
    modules: mods,
    enforcement,
  };
}
