import { describe, expect, it } from 'vitest';
import moduleCqrs from '../index';

describe('@forge-kit-dev/module-cqrs', () => {
  it('exposes a manifest with precedence 30 and depends on module-fsd', () => {
    expect(moduleCqrs.manifest.name).toBe('module-cqrs');
    expect(moduleCqrs.manifest.precedence).toBe(30);
    expect(moduleCqrs.manifest.dependencies).toEqual(['module-fsd']);
  });

  it('ships an eslint config that activates cqrs-layer-role', () => {
    const cfg = moduleCqrs.eslintConfig?.();
    expect(cfg).toBeDefined();
    const rules = (cfg as { rules: Record<string, unknown> }).rules;
    expect(rules['@forge-kit-dev/forge/cqrs-layer-role']).toBe('error');
  });

  it('loads two skills', () => {
    const skills = moduleCqrs.skills?.() ?? [];
    const names = skills.map((s) => s.name).sort();
    expect(names).toEqual(['cqrs-command', 'cqrs-read-model']);
  });

  it('exposes four rubrics with weights totaling 1', () => {
    const rubrics = moduleCqrs.rubrics?.() ?? [];
    expect(rubrics).toHaveLength(4);
    for (const r of rubrics) {
      const total = r.criteria.reduce((acc, c) => acc + c.weight, 0);
      expect(total).toBeCloseTo(1, 5);
    }
  });
});
