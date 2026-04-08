import type {
  Evaluator,
  Generator,
  Planner,
} from '@forge/agents';
import { defineModule, type Module } from '../module';
import type { ForgeConfig } from '../config';
import type { HarnessAgents } from '../harness';

/**
 * Minimal stub agents that throw if invoked. Good enough for Harness
 * constructor / config tests. Real pipeline tests live in Step 9.
 */
export const stubAgents: HarnessAgents = {
  planner: {
    id: 'planner',
    plan: () => {
      throw new Error('stub planner');
    },
  } satisfies Planner,
  generator: {
    id: 'generator',
    generate: () => {
      throw new Error('stub generator');
    },
  } satisfies Generator,
  evaluator: {
    id: 'evaluator',
    evaluate: () => {
      throw new Error('stub evaluator');
    },
  } satisfies Evaluator,
};

export function makeConfig(partial: Partial<ForgeConfig> = {}): ForgeConfig {
  return {
    enforcement: 'hybrid',
    activeModules: [],
    evaluator: { minScore: 70, maxIterations: 3 },
    paths: { repoRoot: '/tmp/demo', forgeDir: '/tmp/demo/.forge' },
    ...partial,
  };
}

export function makeModule(
  name: string,
  precedence: number,
  eslintRules?: Record<string, unknown>
): Module {
  return defineModule({
    manifest: {
      name,
      version: '0.0.0',
      description: `test module ${name}`,
      precedence,
      dependencies: [],
      provides: {
        eslintConfig: Boolean(eslintRules),
        skills: false,
        rubrics: false,
      },
    },
    eslintConfig: eslintRules ? () => ({ rules: eslintRules }) : undefined,
  });
}
