import { defineModule } from '@forge/core';
import { fsdEslintConfig } from './eslint-config.js';
import { fsdRubrics } from './rubrics.js';
import { fsdSkills } from './skills.js';

/**
 * Default precedence for module-fsd. Lower numbers win rule conflicts,
 * so 20 keeps FSD strict enough to discipline layout while yielding to
 * module-clean-code (10) when the two genuinely disagree about scope.
 */
const FSD_PRECEDENCE = 20;

export const moduleFsd = defineModule({
  manifest: {
    name: 'module-fsd',
    version: '0.1.0',
    description:
      'Feature-Sliced Design layer/slice/public-api enforcement for forge.',
    precedence: FSD_PRECEDENCE,
    dependencies: [],
    provides: {
      eslintConfig: true,
      skills: true,
      rubrics: true,
    },
  },
  eslintConfig: fsdEslintConfig,
  skills: fsdSkills,
  rubrics: fsdRubrics,
});

export {
  FSD_LAYERS,
  detectSliceLocation,
  isCrossSlice,
  isFsdLayer,
  isUpwardImport,
  layerOrder,
} from './layer.js';
export type { FsdLayer, SliceLocation, DetectOptions } from './layer.js';
export default moduleFsd;
