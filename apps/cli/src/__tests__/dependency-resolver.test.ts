import { describe, expect, it } from 'vitest';

import {
  BUILTIN_MODULES,
  resolveModuleDependencies,
} from '../wizard/dependency-resolver';

describe('resolveModuleDependencies', () => {
  it('passes a single FSD selection through unchanged', () => {
    const r = resolveModuleDependencies(['module-fsd']);
    expect(r.activeModules).toEqual(['module-fsd']);
    expect(r.autoAdded).toEqual([]);
    expect(r.recommended).toEqual([]);
  });

  it('auto-adds module-fsd when module-cqrs is chosen alone', () => {
    const r = resolveModuleDependencies(['module-cqrs']);
    expect(r.activeModules).toContain('module-cqrs');
    expect(r.activeModules).toContain('module-fsd');
    expect(r.autoAdded).toEqual(['module-fsd']);
  });

  it('does not double-add module-fsd when both are selected', () => {
    const r = resolveModuleDependencies(['module-fsd', 'module-cqrs']);
    expect(r.activeModules.filter((m) => m === 'module-fsd')).toHaveLength(1);
    expect(r.autoAdded).toEqual([]);
  });

  it('preserves user selection order and appends auto-adds at the end', () => {
    const r = resolveModuleDependencies([
      'module-clean-code',
      'module-cqrs',
    ]);
    expect(r.activeModules).toEqual([
      'module-clean-code',
      'module-cqrs',
      'module-fsd',
    ]);
  });

  it('surfaces module-clean-code as a soft recommendation when DDD is chosen', () => {
    const r = resolveModuleDependencies(['module-ddd']);
    expect(r.recommended).toContain('module-clean-code');
    // Recommendations must NOT be auto-added.
    expect(r.activeModules).not.toContain('module-clean-code');
  });

  it('drops the soft recommendation when the user already selected it', () => {
    const r = resolveModuleDependencies([
      'module-ddd',
      'module-clean-code',
    ]);
    expect(r.recommended).toEqual([]);
  });

  it('deduplicates repeated user selections', () => {
    const r = resolveModuleDependencies([
      'module-fsd',
      'module-fsd',
      'module-fsd',
    ]);
    expect(r.activeModules).toEqual(['module-fsd']);
  });

  it('silently drops unknown module identifiers', () => {
    const r = resolveModuleDependencies([
      'module-fsd',
      'module-bogus',
    ]);
    expect(r.activeModules).toEqual(['module-fsd']);
  });

  it('exposes the BUILTIN_MODULES constant containing all six v0.1 modules', () => {
    expect(BUILTIN_MODULES).toHaveLength(6);
    expect([...BUILTIN_MODULES].sort()).toEqual([
      'module-clean-arch',
      'module-clean-code',
      'module-cqrs',
      'module-ddd',
      'module-fsd',
      'module-testing',
    ]);
  });
});
