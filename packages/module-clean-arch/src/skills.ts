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
  'clean-arch-use-case': {
    stage: 'plan',
    description:
      'Decide whether a piece of logic belongs in a use case, a UI handler, or an entity method.',
    triggers: ['use case', 'service', 'action', 'workflow'],
  },
  'clean-arch-dip': {
    stage: 'generate',
    description:
      'Apply the Dependency Inversion Principle: the inner layer defines the interface, the outer layer implements it.',
    triggers: ['dip', 'interface', 'adapter', 'port'],
  },
};

export function cleanArchSkills(): readonly SkillDef[] {
  const files = readdirSync(skillsDir).filter((f) => f.endsWith('.md'));
  return files.map((file) => {
    const name = file.replace(/\.md$/, '');
    const meta = SKILL_META[name];
    if (!meta) {
      throw new Error(
        `module-clean-arch: skill file '${file}' has no SKILL_META entry in skills.ts`
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
