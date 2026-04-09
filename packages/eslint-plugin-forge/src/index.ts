import { rules } from './rules/index.js';

const plugin = {
  meta: {
    name: '@forge/eslint-plugin-forge',
    version: '0.1.0',
  },
  rules,
};

export default plugin;
export { rules };
export type { ForgeRuleName } from './rules/index.js';
