import { describe, expect, it } from 'vitest';
import { Harness } from '../harness';
import { makeConfig, makeModule, stubAgents } from './test-helpers';

describe('Harness — construction', () => {
  it('accepts an empty module list (smoke)', () => {
    const h = new Harness(
      { config: makeConfig(), modules: [] },
      stubAgents
    );
    expect(h.modules).toHaveLength(0);
    expect(h.conflicts).toHaveLength(0);
    expect(h.agents.planner.id).toBe('planner');
  });

  it('rejects a config that lists modules that were not loaded', () => {
    expect(
      () =>
        new Harness(
          {
            config: makeConfig({ activeModules: ['module-fsd'] }),
            modules: [],
          },
          stubAgents
        )
    ).toThrow(/module-fsd/);
  });

  it('exposes rule conflicts detected at construction time', () => {
    const strict = makeModule('module-clean-code', 10, {
      'max-lines-per-function': ['error', 50],
    });
    const loose = makeModule('module-loose', 40, {
      'max-lines-per-function': ['warn', 200],
    });
    const h = new Harness(
      { config: makeConfig(), modules: [strict, loose] },
      stubAgents
    );
    expect(h.conflicts).toHaveLength(1);
    expect(h.conflicts[0]?.winner).toBe('module-clean-code');
  });

  it('run() requires deps.runtime', async () => {
    const h = new Harness(
      { config: makeConfig(), modules: [] },
      stubAgents
    );
    await expect(
      // @ts-expect-error — intentionally violating the signature
      h.run(
        {
          runId: 'r',
          goal: 'g',
          enforcement: 'hybrid',
          activeModules: [],
          repoRoot: '/tmp/demo',
          createdAt: new Date().toISOString(),
        },
        {}
      )
    ).rejects.toThrow(/deps\.runtime/);
  });
});
