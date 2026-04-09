import { readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { SkillDef } from '@forge-kit-dev/core';

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Package-relative directory that ships the authored SKILL.md files.
 * The CLI symlinks or copies this into the consumer project's
 * `.claude/skills/` at `forge init` time.
 */
const skillsDir = resolve(here, '..', 'skills');

interface SkillFileMeta {
  /** Stage targeted by the skill; matches `SkillDef['stage']`. */
  stage: SkillDef['stage'];
  description: string;
  triggers?: readonly string[];
}

/**
 * Authored metadata, kept in code rather than parsed from YAML
 * frontmatter. This is a conscious v0.1 shortcut: the frontmatter still
 * lives at the top of every SKILL.md (that's what Claude Code reads),
 * but forge's loader does not need to parse it.
 *
 * Keys must match the .md filenames under `../skills/`.
 */
const SKILL_META: Record<string, SkillFileMeta> = {
  'fsd-layer-placement': {
    stage: 'plan',
    description:
      'Decide which FSD layer a new piece of code belongs to, before any file is created.',
    triggers: ['new file', 'new component', 'layer', 'feature', 'widget'],
  },
  'fsd-public-api': {
    stage: 'generate',
    description:
      'Ensure slice-to-slice imports always go through a slice index.ts public API.',
    triggers: ['import', 'export', 'index.ts', 'public api'],
  },
  'fsd-composition': {
    stage: 'evaluate',
    description:
      'Detect widgets that merely re-export a single feature, or shared code leaking domain concepts.',
    triggers: ['composition', 'widget', 'shared'],
  },
};

export function fsdSkills(): readonly SkillDef[] {
  // Read the directory so adding a new SKILL.md that forgets its META
  // entry fails loudly at load time, instead of silently ignoring it.
  const files = readdirSync(skillsDir).filter((f) => f.endsWith('.md'));
  return files.map((file) => {
    const name = file.replace(/\.md$/, '');
    const meta = SKILL_META[name];
    if (!meta) {
      throw new Error(
        `module-fsd: skill file '${file}' has no SKILL_META entry in skills.ts`
      );
    }
    return {
      name,
      description: meta.description,
      stage: meta.stage,
      sourcePath: join(skillsDir, file),
      triggers: meta.triggers,
    } satisfies SkillDef;
  });
}
