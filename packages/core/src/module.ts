import type { ModuleManifest, Rubric } from '@forge/schemas';

/**
 * Skill shipped by a module. Corresponds to a single `SKILL.md` file
 * under the module's own `skills` directory. The `stage` controls which
 * agent receives this skill in its system prompt.
 */
export interface SkillDef {
  name: string;
  description: string;
  stage: 'plan' | 'generate' | 'evaluate' | 'all';
  /** Absolute path to the SKILL.md on disk (resolved by the loader). */
  sourcePath: string;
  /** Optional stringified frontmatter keys, for display in `forge list`. */
  triggers?: readonly string[];
}

/**
 * An ESLint-compatible config fragment. Modules return this rather than
 * writing to disk so the CLI can merge them deterministically and the
 * `conflict-resolver` can inspect rule overlaps.
 *
 * We type it as `unknown` to avoid pulling ESLint types here, but the
 * CLI narrows it via `eslint/use-at-your-own-risk` typings when writing
 * `.eslintrc.*`.
 */
export type EslintConfigFragment = Record<string, unknown>;

/**
 * The runtime shape of a forge module. Every module exports a
 * `defineModule()` result from its own `src/index.ts`.
 *
 * All three provide-methods are optional: a module can ship only
 * mechanical rules, only skills, or only rubrics. Modules that ship
 * nothing are legal but will be reported by `forge list` as `empty`.
 */
export interface Module {
  readonly manifest: ModuleManifest;
  eslintConfig?(): EslintConfigFragment;
  skills?(): readonly SkillDef[];
  rubrics?(): readonly Rubric[];
}

export function defineModule(mod: Module): Module {
  return mod;
}
