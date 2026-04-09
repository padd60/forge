import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const commandsDir = resolve(
  __dirname,
  '..',
  '..',
  'commands'
);

async function readCmd(name: string): Promise<string> {
  return readFile(join(commandsDir, `${name}.md`), 'utf8');
}

/**
 * These tests are a drift guard — they do not verify semantics, they
 * verify that the slash command markdowns still contain the load-
 * bearing phrases the file-based handoff contract depends on. If a
 * future edit removes the words "Task tool" or ".forge/runs/" from a
 * command, the failure here prevents the plugin from shipping in a
 * state where the orchestrator cannot actually orchestrate.
 */
describe('commands/*.md drift guards', () => {
  describe('forge-init', () => {
    it('writes .forge/config.json directly without npx', async () => {
      const body = await readCmd('forge-init');
      expect(body).toMatch(/\.forge\/config\.json/);
      expect(body).toMatch(/eslint\.config\.js/);
      expect(body).toMatch(/Do NOT.*npx|not.*shell out/i);
    });

    it('defines rules per module for eslint config generation', async () => {
      const body = await readCmd('forge-init');
      expect(body).toMatch(/module-fsd/);
      expect(body).toMatch(/module-clean-code/);
      expect(body).toMatch(/fsd-slice-boundary/);
    });
  });

  describe('forge-plan', () => {
    it('references .forge/runs/ and the planner sub-agent', async () => {
      const body = await readCmd('forge-plan');
      expect(body).toMatch(/\.forge\/runs\//);
      expect(body).toMatch(/Task tool/i);
      expect(body).toMatch(/spec\.json/);
      expect(body).toMatch(/SpecSchema/);
      expect(body).toMatch(/planner-to-generator/);
    });
  });

  describe('forge-generate', () => {
    it('walks sprints and checks self-check.json', async () => {
      const body = await readCmd('forge-generate');
      expect(body).toMatch(/sprint-0/);
      expect(body).toMatch(/self-check\.json/);
      expect(body).toMatch(/Task tool/i);
      expect(body).toMatch(/handoff\.json/);
    });

    it('spawns one sub-agent per sprint (no collapsing)', async () => {
      const body = await readCmd('forge-generate');
      expect(body).toMatch(/one spawn per sprint/i);
    });
  });

  describe('forge-eval', () => {
    it('enforces freshContext:true for the evaluator spawn', async () => {
      const body = await readCmd('forge-eval');
      // Either literal form the orchestrator might use.
      expect(body).toMatch(/freshContext\s*:\s*true|fresh context/i);
      expect(body).toMatch(/EvalReportSchema/);
      expect(body).toMatch(/iteration-0/);
    });

    it('forbids editing code from within the eval command', async () => {
      const body = await readCmd('forge-eval');
      expect(body).toMatch(/never edit code|not edit source|delegate code changes/i);
    });

    it('writes evaluator/final.json on pass', async () => {
      const body = await readCmd('forge-eval');
      expect(body).toMatch(/final\.json/);
    });
  });

  describe('forge-run', () => {
    it('chains all four phases (plan, generate, eval, fix)', async () => {
      const body = await readCmd('forge-run');
      expect(body).toMatch(/Phase 1.*Plan/i);
      expect(body).toMatch(/Phase 2.*Generate/i);
      expect(body).toMatch(/Phase 3.*Evaluate/i);
      expect(body).toMatch(/Phase 4.*Fix/i);
    });

    it('enforces freshContext:true for the evaluator', async () => {
      const body = await readCmd('forge-run');
      expect(body).toMatch(/freshContext\s*:\s*true|fresh context/i);
    });

    it('prints a final summary with pass/fail status', async () => {
      const body = await readCmd('forge-run');
      expect(body).toMatch(/forge run complete|forge run failed/i);
      expect(body).toMatch(/final\.json/);
    });

    it('writes all handoff artifacts to .forge/runs/', async () => {
      const body = await readCmd('forge-run');
      expect(body).toMatch(/\.forge\/runs\//);
      expect(body).toMatch(/request\.json/);
      expect(body).toMatch(/spec\.json/);
    });
  });

  describe('forge-fix', () => {
    it('requires freshContext:true on the first fix-loop sprint', async () => {
      const body = await readCmd('forge-fix');
      expect(body).toMatch(/freshContext\s*:\s*true|fresh context/i);
      expect(body).toMatch(/first sprint/i);
    });

    it('refuses to run beyond maxIterations', async () => {
      const body = await readCmd('forge-fix');
      expect(body).toMatch(/maxIterations/);
    });

    it('references evaluator-to-generator handoff stage', async () => {
      const body = await readCmd('forge-fix');
      expect(body).toMatch(/evaluator-to-generator/);
    });
  });
});
