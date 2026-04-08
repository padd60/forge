import { describe, expect, it } from 'vitest';
import {
  EnforcementLevelSchema,
  EvalReportSchema,
  HandoffSchema,
  ModuleManifestSchema,
  RunRequestSchema,
  SpecSchema,
} from '../index';

describe('@forge/schemas — smoke', () => {
  it('parses a minimal valid Spec', () => {
    const parsed = SpecSchema.parse({
      runId: 'run-1',
      goal: 'add login form',
      activeModules: ['module-fsd', 'module-clean-code'],
      sprints: [
        {
          id: 's1',
          title: 'scaffold feature',
          description: 'create features/auth-login slice',
          filesTouched: [],
          acceptanceCriteria: ['slice has index.ts public API'],
        },
      ],
      successCriteria: ['login form renders and validates'],
      createdAt: new Date().toISOString(),
    });
    expect(parsed.activeModules).toContain('module-fsd');
  });

  it('rejects a Spec with no sprints', () => {
    expect(() =>
      SpecSchema.parse({
        runId: 'r',
        goal: 'g',
        sprints: [],
        successCriteria: ['x'],
        createdAt: new Date().toISOString(),
      })
    ).toThrow();
  });

  it('requires violatingFiles when rubric score < 10', () => {
    expect(() =>
      EvalReportSchema.parse({
        runId: 'r',
        iteration: 1,
        totalScore: 5,
        maxScore: 10,
        passed: false,
        scores: [
          { criterionId: 'c1', score: 5, rationale: 'meh', violatingFiles: [] },
        ],
        suggestions: [],
        shouldRetry: true,
        createdAt: new Date().toISOString(),
      })
    ).toThrow(/violatingFiles/);
  });

  it('accepts a well-formed Handoff', () => {
    const h = HandoffSchema.parse({
      stage: 'planner-to-generator',
      runId: 'r',
      fromPath: '.forge/runs/r/planner/handoff.json',
      toInputs: { spec: '.forge/runs/r/planner/spec.md' },
      summary: 'Planner produced 3 sprints',
      createdAt: new Date().toISOString(),
    });
    expect(h.stage).toBe('planner-to-generator');
  });

  it('enforces EnforcementLevel enum', () => {
    expect(EnforcementLevelSchema.parse('hybrid')).toBe('hybrid');
    expect(() => EnforcementLevelSchema.parse('loose')).toThrow();
  });

  it('validates ModuleManifest name pattern', () => {
    expect(() =>
      ModuleManifestSchema.parse({
        name: 'Module_FSD',
        version: '0.1.0',
        description: '',
        precedence: 20,
        dependencies: [],
        provides: { eslintConfig: true, skills: true, rubrics: true },
      })
    ).toThrow();
  });

  it('parses RunRequest', () => {
    const r = RunRequestSchema.parse({
      runId: 'r',
      goal: 'g',
      enforcement: 'hybrid',
      activeModules: [],
      repoRoot: '/tmp/demo',
      createdAt: new Date().toISOString(),
    });
    expect(r.enforcement).toBe('hybrid');
  });
});
