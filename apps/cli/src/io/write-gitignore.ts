import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const FORGE_RUNS_LINE = '.forge/runs/';

export interface WriteGitignoreResult {
  filePath: string;
  addedLine: boolean;
}

/**
 * Append `.forge/runs/` to the repo's `.gitignore`. We never want run
 * artifacts committed — they contain spec prompts, diff patches, and
 * eval reports that would bloat history.
 *
 * Idempotent: if the line is already present (bare or with a comment
 * suffix), we leave the file untouched. If the file does not exist we
 * create it containing only the forge line. If the file exists but has
 * no trailing newline, we prefix our line with one so we don't glue
 * the last pre-existing entry to our addition.
 */
export async function writeGitignore(
  repoRoot: string
): Promise<WriteGitignoreResult> {
  const filePath = join(repoRoot, '.gitignore');
  let existing: string | null;
  try {
    existing = await readFile(filePath, 'utf8');
  } catch {
    existing = null;
  }
  if (existing === null) {
    await writeFile(filePath, `${FORGE_RUNS_LINE}\n`, 'utf8');
    return { filePath, addedLine: true };
  }
  if (lineAlreadyPresent(existing)) {
    return { filePath, addedLine: false };
  }
  const prefix = existing.endsWith('\n') ? '' : '\n';
  await writeFile(
    filePath,
    `${existing}${prefix}${FORGE_RUNS_LINE}\n`,
    'utf8'
  );
  return { filePath, addedLine: true };
}

function lineAlreadyPresent(body: string): boolean {
  return body.split('\n').some((line) => {
    const trimmed = line.trim();
    if (trimmed.length === 0) return false;
    if (trimmed.startsWith('#')) return false;
    return trimmed === FORGE_RUNS_LINE || trimmed === FORGE_RUNS_LINE.replace(/\/$/, '');
  });
}
