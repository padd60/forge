import { describe, expect, it } from 'vitest';
import moduleFsd from '../index';

describe('@forge-kit-dev/module-fsd', () => {
  it('exposes a manifest with sensible defaults', () => {
    expect(moduleFsd.manifest.name).toBe('module-fsd');
    expect(moduleFsd.manifest.precedence).toBe(20);
    expect(moduleFsd.manifest.dependencies).toEqual([]);
    expect(moduleFsd.manifest.provides).toEqual({
      eslintConfig: true,
      skills: true,
      rubrics: true,
    });
  });

  it('ships an eslint config fragment with fsd-slice-boundary', () => {
    const cfg = moduleFsd.eslintConfig?.();
    expect(cfg).toBeDefined();
    const rules = (cfg as { rules: Record<string, unknown> }).rules;
    expect(rules['@forge-kit-dev/forge/fsd-slice-boundary']).toBe('error');
  });

  it('loads three skills from the skills directory', () => {
    const skills = moduleFsd.skills?.() ?? [];
    const names = skills.map((s) => s.name).sort();
    expect(names).toEqual([
      'fsd-composition',
      'fsd-layer-placement',
      'fsd-public-api',
    ]);
    // Each skill points to an actual file the loader was able to resolve.
    for (const s of skills) expect(s.sourcePath).toMatch(/\.md$/);
  });

  it('exposes three rubrics covering boundary, naming, and cohesion', () => {
    const rubrics = moduleFsd.rubrics?.() ?? [];
    const ids = rubrics.map((r) => r.id).sort();
    expect(ids).toEqual(['r-fsd-boundary', 'r-fsd-cohesion', 'r-fsd-naming']);
  });

  it('has rubric criterion weights that sum to 1 per rubric', () => {
    const rubrics = moduleFsd.rubrics?.() ?? [];
    for (const rubric of rubrics) {
      const total = rubric.criteria.reduce((acc, c) => acc + c.weight, 0);
      expect(total).toBeCloseTo(1, 5);
    }
  });
});
