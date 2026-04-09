import { describe, expect, it } from 'vitest';
import moduleCleanArch from '../index';

describe('@forge-kit-dev/module-clean-arch', () => {
  it('exposes a manifest with precedence 50 (weakest of the v0.1 modules)', () => {
    expect(moduleCleanArch.manifest.name).toBe('module-clean-arch');
    expect(moduleCleanArch.manifest.precedence).toBe(50);
  });

  it('ships an eslint config that activates clean-arch-domain-isolation', () => {
    const cfg = moduleCleanArch.eslintConfig?.();
    expect(cfg).toBeDefined();
    const rules = (cfg as { rules: Record<string, unknown> }).rules;
    expect(rules['@forge-kit-dev/forge/clean-arch-domain-isolation']).toBe('error');
  });

  it('loads two skills', () => {
    const skills = moduleCleanArch.skills?.() ?? [];
    const names = skills.map((s) => s.name).sort();
    expect(names).toEqual(['clean-arch-dip', 'clean-arch-use-case']);
  });

  it('exposes two rubrics with weights totaling 1', () => {
    const rubrics = moduleCleanArch.rubrics?.() ?? [];
    expect(rubrics).toHaveLength(2);
    for (const r of rubrics) {
      const total = r.criteria.reduce((acc, c) => acc + c.weight, 0);
      expect(total).toBeCloseTo(1, 5);
    }
  });
});
