import { moduleCleanArch } from '@forge/module-clean-arch';
import { moduleCleanCode } from '@forge/module-clean-code';
import { moduleCqrs } from '@forge/module-cqrs';
import { moduleDdd } from '@forge/module-ddd';
import { moduleFsd } from '@forge/module-fsd';
import type { Module } from '@forge/core';

import type { BuiltinModule } from './wizard/dependency-resolver.js';

/**
 * Concrete registry of the v0.1 builtin modules. Everything in this
 * table is a direct import so `@forge/cli` bundles all five modules
 * deterministically — no dynamic `require`, no plugin discovery.
 *
 * The indirection exists so `forge init` can hand a plain `Module[]`
 * to `@forge/core`'s `loadModules`/`resolveRuleConflicts` helpers
 * without needing to know how modules are implemented.
 */
export const BUILTIN_REGISTRY: Readonly<Record<BuiltinModule, Module>> = {
  'module-fsd': moduleFsd,
  'module-clean-code': moduleCleanCode,
  'module-ddd': moduleDdd,
  'module-clean-arch': moduleCleanArch,
  'module-cqrs': moduleCqrs,
};

/**
 * Look up a subset of builtin modules in the order the caller asked
 * for them. Silently drops unknown names — callers (CLI wizard) have
 * already validated the input against `BUILTIN_MODULES`.
 */
export function selectModules(names: readonly BuiltinModule[]): readonly Module[] {
  const out: Module[] = [];
  for (const name of names) {
    const mod = BUILTIN_REGISTRY[name];
    if (mod) out.push(mod);
  }
  return out;
}
