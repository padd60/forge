import { defineModule } from '@forge-kit-dev/core';
import { testingRubrics } from './rubrics.js';

/**
 * Testing-quality module. Evaluates whether AI-generated code includes
 * adequate tests with meaningful assertions and clear structure.
 *
 * Precedence 15 sits between Clean Code (10) and FSD (20).
 */
const TESTING_PRECEDENCE = 15;

export const moduleTesting = defineModule({
  manifest: {
    name: 'module-testing',
    version: '0.1.0',
    description:
      'Test quality evaluation as a forge module: test presence, assertion quality, naming, and structure.',
    precedence: TESTING_PRECEDENCE,
    dependencies: [],
    provides: {
      eslintConfig: false,
      skills: false,
      rubrics: true,
    },
  },
  rubrics: testingRubrics,
});

export default moduleTesting;
