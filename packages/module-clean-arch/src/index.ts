import { defineModule } from '@forge/core';
import { cleanArchEslintConfig } from './eslint-config.js';
import { cleanArchRubrics } from './rubrics.js';
import { cleanArchSkills } from './skills.js';

const CLEAN_ARCH_PRECEDENCE = 50;

export const moduleCleanArch = defineModule({
  manifest: {
    name: 'module-clean-arch',
    version: '0.1.0',
    description:
      'Clean Architecture principles for forge: domain isolation, dependency inversion, use-case centralization.',
    precedence: CLEAN_ARCH_PRECEDENCE,
    dependencies: [],
    provides: {
      eslintConfig: true,
      skills: true,
      rubrics: true,
    },
  },
  eslintConfig: cleanArchEslintConfig,
  skills: cleanArchSkills,
  rubrics: cleanArchRubrics,
});

export default moduleCleanArch;
