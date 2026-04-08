import { readFileSync } from 'node:fs';
import type { Module, SkillDef } from './module';

type Stage = SkillDef['stage'];

/**
 * Merge every skill that targets a given agent stage into a single
 * system-prompt block. Skills are delimited by markdown HR lines so the
 * Evaluator's downstream diff-view is readable during debugging.
 *
 * The merge is deterministic: modules in precedence order, skills
 * inside a module in the order they were declared. That determinism is
 * what makes the meta-eval harness in Step 10 reproducible across runs.
 */
export function composePrompt(
  modules: readonly Module[],
  stage: Stage
): string {
  const parts: string[] = [];
  for (const mod of modules) {
    const skills = mod.skills?.() ?? [];
    const matching = skills.filter(
      (s) => s.stage === stage || s.stage === 'all'
    );
    if (matching.length === 0) continue;
    parts.push(`<!-- module: ${mod.manifest.name} -->`);
    for (const skill of matching) {
      parts.push(`### ${skill.name}`);
      parts.push(skill.description);
      parts.push(readSkillBody(skill));
      parts.push('---');
    }
  }
  return parts.join('\n\n').trimEnd();
}

function readSkillBody(skill: SkillDef): string {
  try {
    return readFileSync(skill.sourcePath, 'utf8');
  } catch (err) {
    // Skill files are shipped with their module package, so a read
    // failure means the package was built incorrectly — surface it
    // loudly rather than silently emitting an empty prompt.
    throw new Error(
      `forge: failed to read skill '${skill.name}' at '${skill.sourcePath}': ${(err as Error).message}`
    );
  }
}
