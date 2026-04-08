import { describe, expect, it } from 'vitest';
import { loadModules } from '../module-loader';
import { defineModule } from '../module';
import { makeModule } from './test-helpers';

describe('loadModules', () => {
  it('returns an empty set when nothing is requested', () => {
    const result = loadModules([], []);
    expect(result.active).toHaveLength(0);
    expect(result.skipped).toHaveLength(0);
  });

  it('sorts active modules by precedence ascending', () => {
    const a = makeModule('module-a', 40);
    const b = makeModule('module-b', 10);
    const c = makeModule('module-c', 20);
    const result = loadModules([a, b, c], ['module-a', 'module-b', 'module-c']);
    expect(result.active.map((m) => m.manifest.name)).toEqual([
      'module-b',
      'module-c',
      'module-a',
    ]);
  });

  it('pulls declared dependencies into the active set', () => {
    const dep = makeModule('module-fsd', 20);
    const parent = defineModule({
      manifest: {
        ...makeModule('module-cqrs', 30).manifest,
        dependencies: ['module-fsd'],
      },
    });
    const result = loadModules([dep, parent], ['module-cqrs']);
    expect(result.active.map((m) => m.manifest.name)).toEqual([
      'module-fsd',
      'module-cqrs',
    ]);
  });

  it('skips unresolvable modules with a reason', () => {
    const result = loadModules([], ['module-ghost']);
    expect(result.active).toHaveLength(0);
    expect(result.skipped[0]?.name).toBe('module-ghost');
    expect(result.skipped[0]?.reason).toMatch(/not found/);
  });

  it('detects circular dependencies and skips the offender', () => {
    const a = defineModule({
      manifest: {
        ...makeModule('module-a', 10).manifest,
        dependencies: ['module-b'],
      },
    });
    const b = defineModule({
      manifest: {
        ...makeModule('module-b', 20).manifest,
        dependencies: ['module-a'],
      },
    });
    const result = loadModules([a, b], ['module-a']);
    const circular = result.skipped.find((s) =>
      s.reason.includes('circular')
    );
    expect(circular).toBeDefined();
  });
});
