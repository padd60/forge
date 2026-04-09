import { readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { SkillDef } from '@forge-kit-dev/core';

const here = dirname(fileURLToPath(import.meta.url));
const skillsDir = resolve(here, '..', 'skills');

interface SkillFileMeta {
  stage: SkillDef['stage'];
  description: string;
  triggers?: readonly string[];
}

const SKILL_META: Record<string, SkillFileMeta> = {
  'cqrs-read-model': {
    stage: 'generate',
    description:
      'Model the read side of a concept inside entities/: readonly types, normalized shapes, no mutation methods.',
    triggers: ['read model', 'query', 'entities', 'readonly'],
  },
  'cqrs-command': {
    stage: 'generate',
    description:
      'Own commands in features/: named after actions, return a result, never mutate entities in place.',
    triggers: ['command', 'mutation', 'write', 'feature', 'action'],
  },
};

export function cqrsSkills(): readonly SkillDef[] {
  const files = readdirSync(skillsDir).filter((f) => f.endsWith('.md'));
  return files.map((file) => {
    const name = file.replace(/\.md$/, '');
    const meta = SKILL_META[name];
    if (!meta) {
      throw new Error(
        `module-cqrs: skill file '${file}' has no SKILL_META entry in skills.ts`
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
