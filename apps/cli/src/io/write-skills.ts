import { copyFile, link, mkdir, rm, symlink } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';

import type { Module, SkillDef } from '@forge-kit-dev/core';

export type SkillLinkStrategy = 'symlink' | 'hardlink' | 'copy';

export interface WriteSkillsResult {
  targetDir: string;
  strategy: SkillLinkStrategy;
  linked: readonly string[];
}

/**
 * Stage every active module's skill files under
 * `<repoRoot>/.claude/skills/`. Claude Code's auto-activation scans
 * that directory for SKILL.md frontmatter, so placing files there is
 * what actually makes a skill visible to the host agent.
 *
 * Strategy selection:
 *  1. Try `symlink`. Cheapest, edits in a module's `skills/` flow
 *     through to the staged copy immediately.
 *  2. Fall back to `hardlink` if symlinks require elevated privileges
 *     (Windows without developer mode).
 *  3. Fall back to `copy` if hardlinks fail (e.g. cross-device).
 *
 * We commit to one strategy per `forge init` call so the staged dir
 * stays consistent — mixing symlinks and copies would make `forge add`
 * reason about each file's origin on every run.
 */
export async function writeSkills(
  repoRoot: string,
  modules: readonly Module[]
): Promise<WriteSkillsResult> {
  const targetDir = join(repoRoot, '.claude', 'skills');
  await mkdir(targetDir, { recursive: true });
  const skills = collectSkills(modules);
  if (skills.length === 0) {
    return { targetDir, strategy: 'copy', linked: [] };
  }

  // Probe the filesystem with the first skill to decide the strategy.
  const probe = skills[0];
  if (!probe) {
    return { targetDir, strategy: 'copy', linked: [] };
  }
  const strategy = await pickStrategy(
    probe.sourcePath,
    join(targetDir, `__forge-probe-${Date.now()}.md`)
  );

  const linked: string[] = [];
  for (const skill of skills) {
    const destName = destFilename(skill);
    const destPath = join(targetDir, destName);
    await rm(destPath, { force: true });
    await writeOne(strategy, skill.sourcePath, destPath);
    linked.push(destPath);
  }
  return { targetDir, strategy, linked };
}

function collectSkills(modules: readonly Module[]): readonly SkillDef[] {
  const out: SkillDef[] = [];
  for (const mod of modules) {
    const skills = mod.skills?.() ?? [];
    out.push(...skills);
  }
  return out;
}

function destFilename(skill: SkillDef): string {
  // Keep the source filename — skill names on disk are kebab-case and
  // already include the module prefix.
  return basename(skill.sourcePath);
}

async function pickStrategy(
  src: string,
  probeDest: string
): Promise<SkillLinkStrategy> {
  await mkdir(dirname(probeDest), { recursive: true });
  try {
    await symlink(src, probeDest);
    await rm(probeDest, { force: true });
    return 'symlink';
  } catch {
    // fall through
  }
  try {
    await link(src, probeDest);
    await rm(probeDest, { force: true });
    return 'hardlink';
  } catch {
    return 'copy';
  }
}

async function writeOne(
  strategy: SkillLinkStrategy,
  src: string,
  dest: string
): Promise<void> {
  switch (strategy) {
    case 'symlink':
      await symlink(src, dest);
      return;
    case 'hardlink':
      await link(src, dest);
      return;
    case 'copy':
      await copyFile(src, dest);
      return;
  }
}
