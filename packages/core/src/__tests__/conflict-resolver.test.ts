import { describe, expect, it } from 'vitest';
import { resolveRuleConflicts } from '../conflict-resolver';
import { makeModule } from './test-helpers';

describe('resolveRuleConflicts', () => {
  it('returns empty for modules with no eslint config', () => {
    const mods = [makeModule('m1', 10), makeModule('m2', 20)];
    expect(resolveRuleConflicts(mods)).toHaveLength(0);
  });

  it('does not flag a rule that every module configures identically', () => {
    const mods = [
      makeModule('m1', 10, { 'max-params': ['error', 3] }),
      makeModule('m2', 20, { 'max-params': ['error', 3] }),
    ];
    expect(resolveRuleConflicts(mods)).toHaveLength(0);
  });

  it('flags conflicts and picks the lowest-precedence winner', () => {
    const mods = [
      makeModule('module-clean-code', 10, {
        'max-lines-per-function': ['error', 50],
      }),
      makeModule('module-ddd', 40, {
        'max-lines-per-function': ['error', 200],
      }),
    ];
    const [conflict] = resolveRuleConflicts(mods);
    expect(conflict).toBeDefined();
    expect(conflict?.ruleId).toBe('max-lines-per-function');
    expect(conflict?.winner).toBe('module-clean-code');
    expect(conflict?.losers).toEqual(['module-ddd']);
  });

  it('handles 3-way conflicts with a deterministic winner', () => {
    const mods = [
      makeModule('a', 20, { 'x/y': 'off' }),
      makeModule('b', 10, { 'x/y': 'error' }),
      makeModule('c', 30, { 'x/y': 'warn' }),
    ];
    const [conflict] = resolveRuleConflicts(mods);
    expect(conflict?.winner).toBe('b');
    expect(conflict?.losers).toEqual(['a', 'c']);
  });
});
