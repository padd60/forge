import { copyFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

import type { AgentRole } from './role.js';
import type { AgentHandle, AgentRuntime, SpawnRequest } from './runtime.js';

/**
 * One fixture describes what the `MockRuntime` should produce for a
 * single `spawn()` call. The mock walks fixtures in order, so tests
 * declare them in the same sequence they expect spawns to happen:
 * planner → sprint-01 → sprint-02 → evaluator iter 1 → …
 *
 * `outputs` keys MUST match the absolute paths the agent declared in
 * `SpawnRequest.expectedOutputs`. Values are absolute paths to the
 * fixture files on disk that will be copied into place.
 */
export interface MockFixture {
  /** Role this fixture satisfies. Must match the spawn request's role. */
  role: AgentRole;
  /** Map from `expectedOutputs[*]` → fixture source file. */
  outputs: Record<string, string>;
  /**
   * Enforces the `SpawnRequest.freshContext` flag. When set, the mock
   * throws if the spawn arrived with a different value. `undefined` skips
   * the check. Prefer setting this explicitly in evaluator fixtures so
   * any regression of the "Generator → Evaluator fresh-context" invariant
   * fails loudly.
   */
  requireFreshContext?: boolean;
  /** Optional tag for debugging (test output only). */
  label?: string;
}

export interface MockRuntimeOptions {
  fixtures: readonly MockFixture[];
  /** Spy hook invoked on every spawn, before any assertions or IO. */
  onSpawn?: (req: SpawnRequest, fixture: MockFixture) => void;
}

/**
 * Deterministic, file-copying `AgentRuntime` used by `Harness.run()`
 * tests. Does not speak to any LLM — the entire point is to drive the
 * state machine with pre-baked artifacts so test failures pinpoint the
 * harness, not the model.
 *
 * Key invariants it enforces:
 *  1. Role match — `fixtures[n].role` must equal the n-th spawn's role.
 *  2. Fresh-context contract — when a fixture sets `requireFreshContext`,
 *     the spawn's `freshContext` flag must match exactly.
 *  3. Every declared expected output is physically created before
 *     `waitForCompletion()` resolves.
 */
export class MockRuntime implements AgentRuntime {
  readonly id = 'mock';
  readonly history: SpawnRequest[] = [];
  readonly #fixtures: readonly MockFixture[];
  readonly #onSpawn: MockRuntimeOptions['onSpawn'];
  #cursor = 0;

  constructor(opts: MockRuntimeOptions) {
    this.#fixtures = opts.fixtures;
    this.#onSpawn = opts.onSpawn;
  }

  get consumedFixtureCount(): number {
    return this.#cursor;
  }

  async spawn(req: SpawnRequest): Promise<AgentHandle> {
    const fixture = this.#fixtures[this.#cursor];
    if (!fixture) {
      throw new Error(
        `MockRuntime: no fixture left for spawn #${this.#cursor + 1} (role=${req.role})`
      );
    }
    this.#cursor += 1;
    this.history.push(req);
    this.#onSpawn?.(req, fixture);

    if (fixture.role !== req.role) {
      throw new Error(
        `MockRuntime: fixture[${this.#cursor - 1}] expected role '${fixture.role}' but got '${req.role}'`
      );
    }
    if (
      fixture.requireFreshContext !== undefined &&
      fixture.requireFreshContext !== req.freshContext
    ) {
      throw new Error(
        `MockRuntime: role=${req.role} requires freshContext=${fixture.requireFreshContext} but spawn received freshContext=${req.freshContext}`
      );
    }
    // Make sure the agent actually declared every file we're about to
    // write. Otherwise the test might pass even though the agent under
    // test forgot to list a required output.
    for (const dest of Object.keys(fixture.outputs)) {
      if (!req.expectedOutputs.includes(dest)) {
        throw new Error(
          `MockRuntime: fixture output '${dest}' is not listed in SpawnRequest.expectedOutputs`
        );
      }
    }
    // Copy the fixture files into the paths the Harness expects.
    for (const [destPath, srcPath] of Object.entries(fixture.outputs)) {
      await mkdir(dirname(destPath), { recursive: true });
      await copyFile(srcPath, destPath);
    }

    const handleId = `${req.role}-${this.#cursor}`;
    const handle: AgentHandle = {
      role: req.role,
      handleId,
      waitForCompletion: () => Promise.resolve(),
      kill: () => Promise.resolve(),
    };
    return handle;
  }
}
