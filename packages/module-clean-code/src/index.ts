import { defineModule } from '@forge/core';
import { cleanCodeEslintConfig } from './eslint-config';
import { cleanCodeRubrics } from './rubrics';
import { cleanCodeSkills } from './skills';

/**
 * Clean Code sits above FSD in strictness, so it gets a lower number.
 * When a Clean Code rule (e.g. 50-line component) conflicts with an
 * FSD rule (e.g. "a page slice may legitimately be long"), Clean Code
 * wins at the mechanical level — but FSD can still refuse with a
 * rubric at the Evaluator stage.
 */
const CLEAN_CODE_PRECEDENCE = 10;

export const moduleCleanCode = defineModule({
  manifest: {
    name: 'module-clean-code',
    version: '0.1.0',
    description:
      'Clean Code (Robert C. Martin) principles as a forge module: component size, naming, SRP, error handling.',
    precedence: CLEAN_CODE_PRECEDENCE,
    dependencies: [],
    provides: {
      eslintConfig: true,
      skills: true,
      rubrics: true,
    },
  },
  eslintConfig: cleanCodeEslintConfig,
  skills: cleanCodeSkills,
  rubrics: cleanCodeRubrics,
});

export default moduleCleanCode;
