import type { Module } from './module.js';

export interface LoadResult {
  active: readonly Module[];
  /** Modules the user asked for but we refused to activate, with reason. */
  skipped: ReadonlyArray<{ name: string; reason: string }>;
}

/**
 * Resolve declared active module names to `Module` instances, honoring
 * `dependencies` by topologically sorting them.
 *
 * The loader is pure: it receives all candidate modules through
 * `registry` and never touches disk or `require`. Concrete registration
 * happens in `@forge/cli`, which imports the module packages the user
 * asked for and hands them to `loadModules`.
 */
export function loadModules(
  registry: readonly Module[],
  requestedNames: readonly string[]
): LoadResult {
  const byName = new Map(registry.map((m) => [m.manifest.name, m]));
  const active: Module[] = [];
  const visited = new Set<string>();
  const skipped: Array<{ name: string; reason: string }> = [];

  const visit = (name: string, chain: readonly string[]): void => {
    if (visited.has(name)) return;
    if (chain.includes(name)) {
      skipped.push({
        name,
        reason: `circular dependency: ${[...chain, name].join(' → ')}`,
      });
      return;
    }
    const mod = byName.get(name);
    if (!mod) {
      skipped.push({ name, reason: 'module not found in registry' });
      return;
    }
    for (const dep of mod.manifest.dependencies) {
      visit(dep, [...chain, name]);
    }
    visited.add(name);
    active.push(mod);
  };

  for (const name of requestedNames) visit(name, []);

  // Sort by precedence so rules with lower precedence (stricter) appear
  // first in merged configs. Stable sort preserves topological order
  // inside equal-precedence groups.
  const sorted = [...active].sort(
    (a, b) => a.manifest.precedence - b.manifest.precedence
  );

  return { active: sorted, skipped };
}
