import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { writeGitignore } from '../io/write-gitignore';

describe('writeGitignore', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'forge-gi-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('creates .gitignore with the forge line if the file is missing', async () => {
    const result = await writeGitignore(dir);
    expect(result.addedLine).toBe(true);
    const body = await readFile(result.filePath, 'utf8');
    expect(body).toBe('.forge/runs/\n');
  });

  it('appends to an existing .gitignore without a trailing newline', async () => {
    await writeFile(join(dir, '.gitignore'), 'node_modules', 'utf8');
    const result = await writeGitignore(dir);
    expect(result.addedLine).toBe(true);
    const body = await readFile(result.filePath, 'utf8');
    expect(body).toBe('node_modules\n.forge/runs/\n');
  });

  it('is idempotent when the line is already present', async () => {
    await writeFile(
      join(dir, '.gitignore'),
      'node_modules\n.forge/runs/\n',
      'utf8'
    );
    const result = await writeGitignore(dir);
    expect(result.addedLine).toBe(false);
    const body = await readFile(result.filePath, 'utf8');
    expect(body).toBe('node_modules\n.forge/runs/\n');
  });

  it('ignores commented lines when checking for duplicates', async () => {
    await writeFile(
      join(dir, '.gitignore'),
      '# .forge/runs/\nnode_modules\n',
      'utf8'
    );
    const result = await writeGitignore(dir);
    expect(result.addedLine).toBe(true);
    const body = await readFile(result.filePath, 'utf8');
    expect(body).toBe('# .forge/runs/\nnode_modules\n.forge/runs/\n');
  });
});
