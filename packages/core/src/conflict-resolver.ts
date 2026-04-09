import type { Module } from './module.js';

export interface RuleConflict {
  ruleId: string;
  winner: string; // module name
  losers: readonly string[]; // module names whose setting was shadowed
  winningValue: unknown;
  shadowedValues: readonly { module: string; value: unknown }[];
}

/**
 * Walk every module's ESLint config, detect rules that multiple modules
 * configure with different values, and decide a winner using
 * `manifest.precedence` (lower = stricter = wins).
 *
 * The return value is purely informational — callers (CLI, test suite)
 * decide whether to log, fail, or merge based on `enforcement`. Core
 * doesn't mutate module outputs.
 */
export function resolveRuleConflicts(
  modules: readonly Module[]
): readonly RuleConflict[] {
  const byRule = new Map<
    string,
    Array<{ module: string; precedence: number; value: unknown }>
  >();

  for (const mod of modules) {
    const config = mod.eslintConfig?.();
    if (!config) continue;
    const rules = readRulesField(config);
    if (!rules) continue;
    for (const [ruleId, value] of Object.entries(rules)) {
      const entry = byRule.get(ruleId) ?? [];
      entry.push({
        module: mod.manifest.name,
        precedence: mod.manifest.precedence,
        value,
      });
      byRule.set(ruleId, entry);
    }
  }

  const conflicts: RuleConflict[] = [];
  for (const [ruleId, entries] of byRule) {
    if (entries.length < 2) continue;
    const distinct = new Set(entries.map((e) => JSON.stringify(e.value)));
    if (distinct.size === 1) continue; // same value, no conflict
    const sorted = [...entries].sort((a, b) => a.precedence - b.precedence);
    const [winner, ...losers] = sorted;
    if (!winner) continue;
    conflicts.push({
      ruleId,
      winner: winner.module,
      winningValue: winner.value,
      losers: losers.map((l) => l.module),
      shadowedValues: losers.map((l) => ({ module: l.module, value: l.value })),
    });
  }
  return conflicts;
}

function readRulesField(
  config: Record<string, unknown>
): Record<string, unknown> | undefined {
  const rules = config['rules'];
  if (rules && typeof rules === 'object' && !Array.isArray(rules)) {
    return rules as Record<string, unknown>;
  }
  return undefined;
}
