import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillsDir = resolve(
  __dirname,
  '..',
  '..',
  '.claude-plugin',
  'skills'
);

const PROTECTED_FORGE_SKILLS = [
  'forge-planner.md',
  'forge-generator.md',
  'forge-evaluator.md',
];

describe('.claude-plugin/skills', () => {
  it('contains all three hand-maintained forge-* skills', async () => {
    for (const name of PROTECTED_FORGE_SKILLS) {
      const body = await readFile(join(skillsDir, name), 'utf8');
      expect(body.startsWith('---')).toBe(true); // frontmatter present
      expect(body).toMatch(/^name: forge-/m);
      expect(body).toMatch(/^stage: (plan|generate|evaluate)/m);
    }
  });

  it('has been populated by sync-skills.mjs (at least one module skill copied)', async () => {
    const entries = await readdir(skillsDir);
    // The three forge-* skills are always present; anything else is a
    // module skill copied by sync-skills.
    const moduleSkills = entries.filter(
      (f) => !PROTECTED_FORGE_SKILLS.includes(f) && f.endsWith('.md')
    );
    // At the very least, module-fsd ships three skills, so after
    // sync-skills this count should be >= 3. We assert >= 5 because
    // Clean Code and the other modules all contribute at least one.
    expect(moduleSkills.length).toBeGreaterThanOrEqual(5);
  });

  it('includes the module-fsd layer placement skill', async () => {
    const entries = await readdir(skillsDir);
    expect(entries).toContain('fsd-layer-placement.md');
  });

  it('forge-evaluator skill reminds the model not to be kind', async () => {
    const body = await readFile(
      join(skillsDir, 'forge-evaluator.md'),
      'utf8'
    );
    // This is a semantic drift guard — the self-praise failure mode
    // is the whole reason the evaluator is separated, and the skill
    // must keep saying so loudly.
    expect(body).toMatch(/not be kind|do not be kind|praise/i);
  });
});
