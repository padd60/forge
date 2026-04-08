/**
 * The canonical FSD layer helpers live in `@forge/eslint-plugin-forge`
 * so the ESLint rule can use them without reaching into a module
 * package. module-fsd re-exports them here so its own users (tests,
 * skills, rubrics) can import from a single place without needing to
 * know about the internal plug-in layout.
 */
export {
  FSD_LAYERS,
  detectSliceLocation,
  isCrossSlice,
  isFsdLayer,
  isUpwardImport,
  layerOrder,
} from '@forge/eslint-plugin-forge/layer';
export type {
  FsdLayer,
  SliceLocation,
  DetectOptions,
} from '@forge/eslint-plugin-forge/layer';
