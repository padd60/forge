import { readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { SkillDef } from '@forge/core';

const here = dirname(fileURLToPath(import.meta.url));
const skillsDir = resolve(here, '..', 'skills');

interface SkillFileMeta {
  stage: SkillDef['stage'];
  description: string;
  triggers?: readonly string[];
}

const SKILL_META: Record<string, SkillFileMeta> = {
  'clean-code-component-size': {
    stage: 'generate',
    description:
      'Keep React components small by deciding when to extract a custom hook or a sub-component.',
    triggers: ['component', 'hook', 'useEffect', 'useState', 'lines'],
  },
  'clean-code-naming': {
    stage: 'plan',
    description:
      'Pick intention-revealing names that survive being quoted out of context.',
    triggers: ['name', 'rename', 'variable', 'function', 'helper'],
  },
  'clean-code-srp': {
    stage: 'evaluate',
    description:
      'Check whether a component or hook has more than one reason to change.',
    triggers: ['srp', 'single responsibility', 'component', 'refactor'],
  },
};

export function cleanCodeSkills(): readonly SkillDef[] {
  const files = readdirSync(skillsDir).filter((f) => f.endsWith('.md'));
  return files.map((file) => {
    const name = file.replace(/\.md$/, '');
    const meta = SKILL_META[name];
    if (!meta) {
      throw new Error(
        `module-clean-code: skill file '${file}' has no SKILL_META entry in skills.ts`
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
