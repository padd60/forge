---
description: Initialize forge in this project — select modules, set enforcement level, generate config files.
argument-hint: Optional module names (e.g., "FSD and DDD") or leave blank for interactive selection
---

# /forge-init

You are the orchestrator. Do NOT run npx or any external CLI.
Instead, ask the user questions directly and write the config files
yourself.

## Step 1: Check for existing config

Read `.forge/config.json`. If it exists, warn the user:
"forge is already initialized. Re-running will overwrite your
current config. Continue?"

## Step 2: Select modules

If the user provided module names in their message (e.g.
`/forge-init FSD and DDD`), use those directly. Otherwise, ask:

"Which forge modules do you want to activate?"

You MUST present exactly 6 options using AskUserQuestion with
multiSelect: true. Do NOT omit any. Pre-select options 1-3 by default.

The 6 options (ALL required):
1. **FSD** (Feature-Sliced Design) ★ default — 레이어 방향성, public-API import, slice 경계, wildcard re-export 금지
2. **Clean Code** ★ default — 컴포넌트 최대 50줄, boolean flag 인자 금지, 최대 3 파라미터, any/ts-ignore 금지
3. **Testing** ★ default — 테스트 존재 여부, assertion 품질, 에러 경로 커버리지, 행위 기반 네이밍
4. **DDD** (Domain-Driven Design) — Entity id 필드, Value Object, ACL, 도메인 이벤트, Bounded Context
5. **Clean Architecture** — 도메인 레이어에서 프레임워크 import 금지, DIP, use-case 중앙화
6. **CQRS** — entities = readonly read model, features = commands (FSD 필수)

### Dependency resolution

- If CQRS is selected but FSD is not → auto-add FSD, tell the user:
  "CQRS requires FSD for layer separation. FSD has been added automatically."
- If DDD is selected → recommend Clean Code (soft suggestion, not forced)

## Step 3: Select enforcement level

Ask the user (use AskUserQuestion):

| Level | Behavior |
|---|---|
| **hybrid** (recommended) | ESLint blocks violations on commit; Evaluator scores are advisory |
| **block-all** | Both ESLint and Evaluator block on failure |
| **advisory-only** | Warnings only, no pre-commit hook |

## Step 4: Write config files

After collecting answers, create these files:

### `.forge/config.json`

```json
{
  "version": 1,
  "enforcement": "<selected level>",
  "activeModules": ["module-fsd", "module-clean-code", ...],
  "evaluator": {
    "minScore": 70,
    "maxIterations": 3
  }
}
```

Module name mapping (display name → config value):
- FSD → `module-fsd`
- Clean Code → `module-clean-code`
- Testing → `module-testing`
- DDD → `module-ddd`
- Clean Architecture → `module-clean-arch`
- CQRS → `module-cqrs`

### `eslint.config.js`

Generate a flat ESLint config. The exact content depends on which
modules are active. Each module contributes specific rules:

```js
import forgePlugin from '@forge-kit-dev/eslint-plugin-forge';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/build/**',
    ],
  },
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@forge-kit-dev/forge': forgePlugin,
    },
    rules: {
      // Include rules from selected modules ONLY:
    },
  },
];
```

**Rules per module:**

- **module-fsd**: `"@forge-kit-dev/forge/fsd-slice-boundary": "error"`, `"@forge-kit-dev/forge/fsd-no-wildcard-reexport": "error"`, `"@forge-kit-dev/forge/fsd-layer-typo": "error"`
- **module-clean-code**: `"@forge-kit-dev/forge/component-max-lines": ["error", { "max": 50 }]`, `"@forge-kit-dev/forge/no-boolean-flag-arg": "error"`, `"@forge-kit-dev/forge/no-type-escape": "error"`, `"max-params": ["error", 3]`, `"no-console": ["error", { "allow": ["warn", "error"] }]`, `"complexity": ["warn", 12]`
- **module-testing**: (no ESLint rules — rubric-only module)
- **module-ddd**: `"@forge-kit-dev/forge/ddd-entity-id": "error"`
- **module-clean-arch**: `"@forge-kit-dev/forge/clean-arch-domain-isolation": "error"`
- **module-cqrs**: `"@forge-kit-dev/forge/cqrs-layer-role": "error"`

### `.gitignore` (append)

Add `.forge/runs/` to `.gitignore` if not already present. Do NOT
overwrite the existing file — just append.

### `.husky/pre-commit` (conditional)

Only create if enforcement is NOT `advisory-only`:

```bash
#!/bin/sh
npx eslint . --max-warnings 0 && npx tsc --noEmit
```

Make it executable: `chmod +x .husky/pre-commit`

## Step 5: Confirm

Tell the user:

```
✓ forge initialized!

  Config:    .forge/config.json
  ESLint:    eslint.config.js (N rules from M modules)
  Husky:     .husky/pre-commit (or "skipped — advisory-only")

  Next: /forge-run "describe what you want to build"
```

## Important

- Do NOT shell out to npx, npm, or pnpm. Write files directly.
- Use the Write tool for new files, Edit tool for appending to
  .gitignore.
- The eslint.config.js must use `@forge-kit-dev/eslint-plugin-forge`
  as the plugin package name and `@forge-kit-dev/forge` as the
  ESLint plugin namespace in rules.
- `@typescript-eslint/parser` must be imported for TS/JSX parsing.
