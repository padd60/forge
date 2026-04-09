#!/usr/bin/env node
/**
 * Copy every builtin module's skill markdown files into
 * `packages/plugin-claude/skills/` so the plugin bundle ships them
 * as a single staged directory Claude Code can index at load time.
 *
 * This is a build-time script, not a runtime one — the output lives
 * under `skills/` (at the plugin root) and is checked into git on every
 * release. A CI job (Step 11) should run this script + `git diff
 * --exit-code` to catch drift where a module adds a skill but the
 * plugin bundle was not regenerated.
 */
import { copyFile, mkdir, readdir, rm, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..', '..');
const pluginSkillsDir = resolve(
  __dirname,
  '..',
  'skills'
);

const BUILTIN_MODULES = [
  'module-fsd',
  'module-clean-code',
  'module-ddd',
  'module-clean-arch',
  'module-cqrs',
];

/** Hand-maintained forge-* skill files that must not be touched by sync. */
const PROTECTED_SKILLS = new Set([
  'forge-planner.md',
  'forge-generator.md',
  'forge-evaluator.md',
]);

async function main() {
  await mkdir(pluginSkillsDir, { recursive: true });
  // Clear only previously-synced module skills. Never delete the
  // forge-* files under PROTECTED_SKILLS.
  const existing = await readdir(pluginSkillsDir);
  for (const entry of existing) {
    if (PROTECTED_SKILLS.has(entry)) continue;
    await rm(join(pluginSkillsDir, entry), { recursive: true, force: true });
  }

  let copied = 0;
  for (const modName of BUILTIN_MODULES) {
    const skillsDir = join(
      repoRoot,
      'packages',
      modName,
      'skills'
    );
    let files;
    try {
      files = await readdir(skillsDir);
    } catch {
      continue; // module has no skills dir
    }
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const src = join(skillsDir, file);
      const info = await stat(src);
      if (!info.isFile()) continue;
      const dest = join(pluginSkillsDir, file);
      await copyFile(src, dest);
      copied += 1;
    }
  }

  process.stdout.write(`sync-skills: copied ${copied} module skills\n`);
}

main().catch((err) => {
  process.stderr.write(`sync-skills: ${err?.message ?? err}\n`);
  process.exit(1);
});
