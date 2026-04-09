---
name: forge-run
description: Run the full forge P-G-E pipeline automatically — plan, generate, evaluate, and fix loop in one command.
arguments: "<goal>"
---

# /forge-run

Arguments: the natural-language goal, quoted if it contains spaces.
Example: `/forge-run "add a login form with email+password validation"`.

## Overview

This is the **auto mode** — it chains `/forge-plan` → `/forge-generate`
→ `/forge-eval` → `/forge-fix` (if needed) into a single unattended
run. The user gets a final report at the end instead of manually
advancing through each stage.

Use `/forge-plan` + `/forge-generate` + `/forge-eval` separately when
you want to review intermediate artifacts before proceeding.

## Steps

### Phase 1 — Plan (identical to /forge-plan)

1. **Read `.forge/config.json`.** If missing, stop and tell the user to
   run `npx @forge/cli init` first. Grab `activeModules`, `enforcement`,
   `evaluator.minScore`, and `evaluator.maxIterations`.

2. **Mint a `runId`** (ISO timestamp + nanoid suffix). Create:
   ```
   .forge/runs/<runId>/
   ├── request.json
   ├── planner/
   └── generator/
   ```

3. **Write `request.json`** matching `RunRequestSchema`.

4. **Spawn the planner sub-agent via Task.** Use `agents/planner.json`
   + active module stage-`plan` skills.
   - Input: `request.json`
   - Expected output: `planner/spec.json`

5. **Validate** with `SpecSchema.parse()`. On failure → stop, report.

6. **Render `spec.md`** and write `planner/handoff.json`.

7. **Brief the user:** "Plan complete — <N> sprint(s). Proceeding to
   generation…"

### Phase 2 — Generate (identical to /forge-generate)

8. **For each sprint `i` (1..N):** spawn generator sub-agent via Task.
   - Use `agents/generator.json` + stage-`generate` skills.
   - Expected outputs: `plan.md`, `diff.patch`, `self-check.json`,
     `handoff.json`.
   - If `self-check.json` has `ok: false` → stop the entire run.
     Report the failure.

9. **Brief the user:** "Generation done — <N> sprint(s). Evaluating…"

### Phase 3 — Evaluate (identical to /forge-eval)

10. **Spawn the evaluator sub-agent via Task** with
    `freshContext: true`. This is non-negotiable.
    - Input: `spec.md`, latest `diff.patch`, rubrics.
    - Expected output: `report.json`, `report.md`.

11. **Parse `report.json`** with `EvalReportSchema`.

12. **If `report.passed === true`:** write `evaluator/final.json`.
    Go to Phase 5 (Report).

13. **If `report.passed === false` and iterations remain:** proceed to
    Phase 4 (Fix Loop).

14. **If iterations exhausted:** write `evaluator/final.json` with
    `passed: false`. Go to Phase 5 (Report) with failure status.

### Phase 4 — Fix Loop (identical to /forge-fix + re-eval)

15. **Write `evaluator-to-generator` handoff.**

16. **Spawn generator sub-agent** with `freshContext: true` for the
    first sprint, `false` for subsequent sprints. Hand it `report.md` +
    `spec.md`.

17. **Re-evaluate** (go back to step 10 with the next iteration number).

18. **Repeat** until `passed === true` or `maxIterations` reached.

### Phase 5 — Final Report

19. **Print a summary to the user:**

    If passed:
    ```
    ✓ forge run complete (runId: <runId>)
      Plan:      <N> sprint(s)
      Eval:      passed on iteration <M> (score: <S>/<max>)
      Artifacts: .forge/runs/<runId>/
    ```

    If failed:
    ```
    ✗ forge run failed (runId: <runId>)
      Plan:      <N> sprint(s)
      Eval:      failed after <M> iteration(s) (best score: <S>/<max>)
      Top violations:
        - <violation 1>
        - <violation 2>
      Artifacts: .forge/runs/<runId>/
      Next: review the spec or run /forge-plan with a narrower goal
    ```

## Key invariants

- **Evaluator always gets fresh context.** This applies on every
  iteration, not just the first. Do not optimize by reusing the
  evaluator's prior context.
- **Generator gets fresh context on fix-loop re-entry.** The first
  sprint of a fix pass must start clean so the model reads the
  evaluation report as ground truth rather than defending its prior
  output.
- **Never skip the self-check.** If any sprint's mechanical gate fails,
  the entire run stops. Don't try to paper over lint/tsc errors by
  editing files yourself — that defeats the purpose of the harness.
- **All artifacts are persisted.** The user can inspect any intermediate
  file under `.forge/runs/<runId>/` to understand what happened.

## When to use /forge-run vs step-by-step

| Scenario | Recommended |
|---|---|
| Standard feature work | `/forge-run "goal"` |
| Reviewing the spec before code generation | `/forge-plan` → review → `/forge-generate` |
| Debugging a specific sprint failure | `/forge-generate` + manual inspection |
| Re-scoring after manual edits | `/forge-eval` standalone |
| Understanding why evaluation failed | `/forge-eval` → read `report.md` → `/forge-fix` |
