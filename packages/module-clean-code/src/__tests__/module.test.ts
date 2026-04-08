import { describe, expect, it } from 'vitest';
import moduleCleanCode from '../index';

describe('@forge/module-clean-code', () => {
  it('exposes a manifest with precedence 10 (stricter than FSD)', () => {
    expect(moduleCleanCode.manifest.name).toBe('module-clean-code');
    expect(moduleCleanCode.manifest.precedence).toBe(10);
    expect(moduleCleanCode.manifest.dependencies).toEqual([]);
  });

  it('ships an eslint config that activates both custom rules', () => {
    const cfg = moduleCleanCode.eslintConfig?.();
    expect(cfg).toBeDefined();
    const rules = (cfg as { rules: Record<string, unknown> }).rules;
    expect(rules['@forge/forge/component-max-lines']).toEqual([
      'error',
      { max: 50 },
    ]);
    expect(rules['@forge/forge/no-boolean-flag-arg']).toBe('error');
    expect(rules['max-params']).toEqual(['error', 3]);
  });

  it('loads three skills from the skills directory', () => {
    const skills = moduleCleanCode.skills?.() ?? [];
    const names = skills.map((s) => s.name).sort();
    expect(names).toEqual([
      'clean-code-component-size',
      'clean-code-naming',
      'clean-code-srp',
    ]);
  });

  it('exposes three rubrics with per-rubric weight totals of 1', () => {
    const rubrics = moduleCleanCode.rubrics?.() ?? [];
    const ids = rubrics.map((r) => r.id).sort();
    expect(ids).toEqual([
      'r-clean-code-boundary',
      'r-clean-code-intent',
      'r-clean-code-srp',
    ]);
    for (const rubric of rubrics) {
      const total = rubric.criteria.reduce((acc, c) => acc + c.weight, 0);
      expect(total).toBeCloseTo(1, 5);
    }
  });
});
