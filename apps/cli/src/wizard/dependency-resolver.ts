/**
 * Builtin module identifiers handled by the CLI. Must stay in sync with
 * `src/registry.ts` — that file's import statements decide which of
 * these are actually on disk.
 */
export const BUILTIN_MODULES = [
  'module-fsd',
  'module-clean-code',
  'module-testing',
  'module-ddd',
  'module-clean-arch',
  'module-cqrs',
] as const;
export type BuiltinModule = (typeof BUILTIN_MODULES)[number];

/**
 * Hard dependency edges. The key module cannot be activated without
 * every entry in its value array. Today only CQRS requires FSD (FSD's
 * layers are what CQRS maps Read/Write onto); this table is the spot
 * to add more edges later without touching the wizard UI.
 */
const HARD_DEPENDENCIES: Partial<Record<BuiltinModule, readonly BuiltinModule[]>> = {
  'module-cqrs': ['module-fsd'],
};

/**
 * Soft recommendations. The wizard surfaces a confirmation prompt when
 * these trigger but users can decline. Example: DDD benefits from
 * Clean Code because DDD's aggregate invariants get swamped by
 * 200-line component bodies, but nothing technically breaks.
 */
const SOFT_RECOMMENDATIONS: Partial<Record<BuiltinModule, readonly BuiltinModule[]>> = {
  'module-ddd': ['module-clean-code'],
};

export interface ResolveResult {
  /** Deduped, ordered list of modules that will actually be activated. */
  activeModules: readonly BuiltinModule[];
  /** Modules added automatically because a selected module required them. */
  autoAdded: readonly BuiltinModule[];
  /** Modules the user may want to consider; not added automatically. */
  recommended: readonly BuiltinModule[];
}

/**
 * Resolve the user's raw module selection into a complete activation
 * set plus metadata the wizard uses to explain what happened.
 *
 * Properties the caller relies on:
 *  - Pure function (no IO, no mutation of inputs).
 *  - Order-preserving: the user's selection is kept first, auto-added
 *    modules come after in the order they were discovered.
 *  - Duplicate-safe: selecting the same module twice is not an error.
 *  - Unknown modules are dropped silently (the wizard vet them first).
 */
export function resolveModuleDependencies(
  selected: readonly string[]
): ResolveResult {
  const allow = new Set<BuiltinModule>(BUILTIN_MODULES);
  const picked: BuiltinModule[] = [];
  const seen = new Set<BuiltinModule>();

  for (const raw of selected) {
    if (!allow.has(raw as BuiltinModule)) continue;
    const mod = raw as BuiltinModule;
    if (seen.has(mod)) continue;
    picked.push(mod);
    seen.add(mod);
  }

  const autoAdded: BuiltinModule[] = [];
  const queue = [...picked];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    const deps = HARD_DEPENDENCIES[current];
    if (!deps) continue;
    for (const dep of deps) {
      if (seen.has(dep)) continue;
      picked.push(dep);
      autoAdded.push(dep);
      seen.add(dep);
      queue.push(dep);
    }
  }

  const recommendedSet = new Set<BuiltinModule>();
  for (const mod of picked) {
    const recs = SOFT_RECOMMENDATIONS[mod];
    if (!recs) continue;
    for (const rec of recs) {
      if (!seen.has(rec)) recommendedSet.add(rec);
    }
  }

  return {
    activeModules: picked,
    autoAdded,
    recommended: [...recommendedSet],
  };
}
