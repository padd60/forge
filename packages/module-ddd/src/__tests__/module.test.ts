import { describe, expect, it } from 'vitest';
import moduleDdd from '../index';

describe('@forge-kit-dev/module-ddd', () => {
  it('exposes a manifest with precedence 40 (weaker than FSD)', () => {
    expect(moduleDdd.manifest.name).toBe('module-ddd');
    expect(moduleDdd.manifest.precedence).toBe(40);
  });

  it('ships an eslint config that activates ddd-entity-id', () => {
    const cfg = moduleDdd.eslintConfig?.();
    expect(cfg).toBeDefined();
    const rules = (cfg as { rules: Record<string, unknown> }).rules;
    expect(rules['@forge-kit-dev/forge/ddd-entity-id']).toBe('error');
  });

  it('loads three skills', () => {
    const skills = moduleDdd.skills?.() ?? [];
    const names = skills.map((s) => s.name).sort();
    expect(names).toEqual([
      'ddd-aggregate-root',
      'ddd-bounded-context',
      'ddd-value-object',
    ]);
  });

  it('exposes six rubrics with weights totaling 1', () => {
    const rubrics = moduleDdd.rubrics?.() ?? [];
    expect(rubrics).toHaveLength(6);
    for (const r of rubrics) {
      const total = r.criteria.reduce((acc, c) => acc + c.weight, 0);
      expect(total).toBeCloseTo(1, 5);
    }
  });
});
