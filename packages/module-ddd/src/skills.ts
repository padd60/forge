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
  'ddd-bounded-context': {
    stage: 'plan',
    description:
      'Decide which bounded context a new model belongs to, and how much ubiquitous language it must respect.',
    triggers: ['bounded context', 'domain', 'model', 'entity'],
  },
  'ddd-aggregate-root': {
    stage: 'generate',
    description:
      'Identify the aggregate root for a new write operation and keep the invariants inside the aggregate.',
    triggers: ['aggregate', 'invariant', 'transaction', 'write'],
  },
  'ddd-value-object': {
    stage: 'generate',
    description:
      'Choose between an entity and a value object, and model value objects as immutable structures.',
    triggers: ['value object', 'readonly', 'immutable', 'type'],
  },
};

export function dddSkills(): readonly SkillDef[] {
  const files = readdirSync(skillsDir).filter((f) => f.endsWith('.md'));
  return files.map((file) => {
    const name = file.replace(/\.md$/, '');
    const meta = SKILL_META[name];
    if (!meta) {
      throw new Error(
        `module-ddd: skill file '${file}' has no SKILL_META entry in skills.ts`
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
