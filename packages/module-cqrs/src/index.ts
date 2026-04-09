import { defineModule } from '@forge/core';
import { cqrsEslintConfig } from './eslint-config.js';
import { cqrsRubrics } from './rubrics.js';
import { cqrsSkills } from './skills.js';

/**
 * CQRS precedence sits between FSD (20) and DDD (40). When active it
 * layers on top of FSD's layer discipline — `cqrs-layer-role` assumes
 * the FSD `entities/` and `features/` paths exist and are enforced.
 */
const CQRS_PRECEDENCE = 30;

export const moduleCqrs = defineModule({
  manifest: {
    name: 'module-cqrs',
    version: '0.1.0',
    description:
      'CQRS mapping for forge: entities layer is read-only, features layer owns commands.',
    precedence: CQRS_PRECEDENCE,
    dependencies: ['module-fsd'],
    provides: {
      eslintConfig: true,
      skills: true,
      rubrics: true,
    },
  },
  eslintConfig: cqrsEslintConfig,
  skills: cqrsSkills,
  rubrics: cqrsRubrics,
});

export default moduleCqrs;
