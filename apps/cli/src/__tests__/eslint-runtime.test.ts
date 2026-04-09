import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { writeEslintConfig } from '../io/write-eslint';
import { BUILTIN_REGISTRY } from '../registry';

/**
 * End-to-end guard that proves the flat config produced by
 * `writeEslintConfig` is loadable by ESLint and that forge's custom
 * rule ids resolve via the generated `plugins` binding.
 *
 * This is a runtime counterpart to the syntactic assertions in
 * `write-eslint.test.ts`: the latter proves the generator emits the
 * right text; this test proves ESLint accepts it.
 *
 * Implementation note: the tmpdir must live INSIDE `apps/cli/` so
 * that Node's ESM resolver, walking up from the generated
 * `eslint.config.js`, hits `apps/cli/node_modules/@forge/eslint-plugin-forge`
 * (pnpm symlink to the built workspace package). Placing the tmpdir
 * under `os.tmpdir()` would put it outside the workspace and make the
 * plugin import unresolvable.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('writeEslintConfig → real ESLint runtime', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(__dirname, 'runtime-tmp-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('reports @forge/forge/component-max-lines on an over-sized component', async () => {
    await writeEslintConfig({
      repoRoot: tmpDir,
      modules: [BUILTIN_REGISTRY['module-clean-code']],
    });

    const sourcePath = join(tmpDir, 'too-long.jsx');
    await writeFile(sourcePath, OVER_SIZED_COMPONENT, 'utf8');

    const eslint = new ESLint({
      cwd: tmpDir,
      overrideConfigFile: join(tmpDir, 'eslint.config.js'),
      overrideConfig: [PARSER_OVERRIDE],
    });
    const results = await eslint.lintFiles([sourcePath]);
    const firstResult = results[0];
    if (!firstResult) {
      throw new Error('expected at least one ESLint result');
    }
    const ruleIds = firstResult.messages.map((m) => m.ruleId);
    expect(ruleIds).toContain('@forge/forge/component-max-lines');
  });

  it('reports @forge/forge/fsd-slice-boundary on a cross-slice deep import', async () => {
    await writeEslintConfig({
      repoRoot: tmpDir,
      modules: [BUILTIN_REGISTRY['module-fsd']],
    });

    // Use a path that matches the FSD features layer so the rule
    // activates — the rule keys off `/features/` in the filename.
    const featureDir = join(tmpDir, 'src', 'features', 'cart-add-item', 'ui');
    await mkdir(featureDir, { recursive: true });
    const sourcePath = join(featureDir, 'cart-button.jsx');
    await writeFile(sourcePath, CROSS_SLICE_DEEP_IMPORT, 'utf8');

    const eslint = new ESLint({
      cwd: tmpDir,
      overrideConfigFile: join(tmpDir, 'eslint.config.js'),
      overrideConfig: [PARSER_OVERRIDE],
    });
    const results = await eslint.lintFiles([sourcePath]);
    const firstResult = results[0];
    if (!firstResult) {
      throw new Error('expected at least one ESLint result');
    }
    const ruleIds = firstResult.messages.map((m) => m.ruleId);
    expect(ruleIds).toContain('@forge/forge/fsd-slice-boundary');
  });
});

/**
 * Parser config passed alongside the generated flat config so ESLint
 * can parse the JSX test fixtures. In real forge-managed projects the
 * user's own `eslint.config.js` supplies `@typescript-eslint/parser`;
 * here we stick to espree + `ecmaFeatures.jsx` because the runtime
 * test is only about rule-id resolution, not TypeScript parsing.
 */
const PARSER_OVERRIDE = {
  languageOptions: {
    ecmaVersion: 'latest' as const,
    sourceType: 'module' as const,
    parserOptions: {
      ecmaVersion: 'latest' as const,
      sourceType: 'module' as const,
      ecmaFeatures: { jsx: true },
    },
  },
};

const OVER_SIZED_COMPONENT = `
export function Huge() {
${Array.from({ length: 60 }, (_, i) => `  const v${i} = ${i};`).join('\n')}
  return null;
}
`;

const CROSS_SLICE_DEEP_IMPORT = `
import { internal } from '@/features/other-slice/model/internal';

export function CartButton() {
  return internal();
}
`;
