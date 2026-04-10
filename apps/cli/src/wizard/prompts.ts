import {
  cancel,
  confirm,
  intro,
  isCancel,
  multiselect,
  note,
  outro,
  select,
  text,
} from '@clack/prompts';
import pc from 'picocolors';

import {
  BUILTIN_MODULES,
  resolveModuleDependencies,
  type BuiltinModule,
} from './dependency-resolver.js';
import type { InitOptions } from '../commands/init.js';

/**
 * The full wizard flow, lifted out of `init.ts` so tests can invoke
 * `runInit` directly with preset answers and never touch the clack
 * runtime.
 *
 * Returns `null` when the user cancels at any prompt. Callers
 * (typically `program.ts`) translate `null` into a clean exit 1.
 */
export async function runWizard(cwd: string): Promise<InitOptions | null> {
  intro(pc.cyan('forge') + pc.dim(' — Frontend AI Harness'));

  const repoPath = await text({
    message: 'Repo root',
    initialValue: cwd,
    placeholder: cwd,
    validate: (value) => {
      if (!value || value.length === 0) return 'path required';
      return undefined;
    },
  });
  if (isCancel(repoPath)) return cancelOut();

  const picked = await multiselect({
    message: 'Which modules should forge enforce?',
    options: [
      {
        value: 'module-fsd' satisfies BuiltinModule,
        label: 'FSD (recommended)',
        hint: 'Feature-Sliced Design',
      },
      {
        value: 'module-clean-code' satisfies BuiltinModule,
        label: 'Clean Code',
        hint: 'Size / naming / SRP',
      },
      {
        value: 'module-testing' satisfies BuiltinModule,
        label: 'Testing',
        hint: 'Test presence / quality / naming',
      },
      {
        value: 'module-ddd' satisfies BuiltinModule,
        label: 'DDD',
        hint: 'Bounded contexts & aggregates',
      },
      {
        value: 'module-clean-arch' satisfies BuiltinModule,
        label: 'Clean Architecture',
        hint: 'Domain isolation',
      },
      {
        value: 'module-cqrs' satisfies BuiltinModule,
        label: 'CQRS',
        hint: 'Read/Write split (requires FSD)',
      },
    ],
    initialValues: ['module-fsd'],
    required: true,
  });
  if (isCancel(picked)) return cancelOut();

  const selection = picked as readonly string[];
  const resolution = resolveModuleDependencies(selection);

  if (resolution.autoAdded.length > 0) {
    note(
      `The following modules were added automatically:\n  ${resolution.autoAdded
        .map((m) => pc.cyan(m))
        .join('\n  ')}`,
      'Dependencies'
    );
  }
  for (const rec of resolution.recommended) {
    const want = await confirm({
      message: `Also enable ${pc.cyan(rec)}? (recommended for this combo)`,
      initialValue: false,
    });
    if (isCancel(want)) return cancelOut();
    if (want) {
      (resolution.activeModules as BuiltinModule[]).push(rec);
    }
  }

  const enforcement = await select({
    message: 'Enforcement level',
    options: [
      {
        value: 'hybrid',
        label: 'hybrid (recommended)',
        hint: 'mechanical = block, evaluator = advisory',
      },
      {
        value: 'block-all',
        label: 'block-all',
        hint: 'evaluator rubric also blocks',
      },
      {
        value: 'advisory-only',
        label: 'advisory-only',
        hint: 'nothing blocks; onboarding mode',
      },
    ],
    initialValue: 'hybrid',
  });
  if (isCancel(enforcement)) return cancelOut();

  const proceed = await confirm({
    message: `Create forge config under ${pc.cyan(repoPath as string)}?`,
    initialValue: true,
  });
  if (isCancel(proceed) || !proceed) return cancelOut();

  outro(pc.green('forge: running init'));
  return {
    repoRoot: repoPath as string,
    modules: dedupeKnown(resolution.activeModules),
    enforcement: enforcement as InitOptions['enforcement'],
  };
}

function dedupeKnown(raw: readonly string[]): readonly BuiltinModule[] {
  const allow = new Set<BuiltinModule>(BUILTIN_MODULES);
  const seen = new Set<BuiltinModule>();
  const out: BuiltinModule[] = [];
  for (const r of raw) {
    if (!allow.has(r as BuiltinModule)) continue;
    const mod = r as BuiltinModule;
    if (seen.has(mod)) continue;
    seen.add(mod);
    out.push(mod);
  }
  return out;
}

function cancelOut(): null {
  cancel('forge: init cancelled');
  return null;
}
