import { defineModule } from '@forge/core';
import { dddEslintConfig } from './eslint-config.js';
import { dddRubrics } from './rubrics.js';
import { dddSkills } from './skills.js';

/**
 * DDD sits further from the hot path than FSD and Clean Code, so its
 * precedence is higher (weaker). A Clean Code 50-line limit will
 * override a DDD guideline that asks for an aggregate to grow past
 * that; aggregate-root discipline is still expressed via rubrics.
 */
const DDD_PRECEDENCE = 40;

export const moduleDdd = defineModule({
  manifest: {
    name: 'module-ddd',
    version: '0.1.0',
    description:
      'Domain-Driven Design principles for forge: entity identity, bounded context isolation, ubiquitous language.',
    precedence: DDD_PRECEDENCE,
    dependencies: [],
    provides: {
      eslintConfig: true,
      skills: true,
      rubrics: true,
    },
  },
  eslintConfig: dddEslintConfig,
  skills: dddSkills,
  rubrics: dddRubrics,
});

export default moduleDdd;
