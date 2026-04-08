---
name: forge-fix
description: Re-enter the generator with the latest failing evaluator report as guidance.
arguments: "[runId]"
---

# /forge-fix

Arguments: optional `<runId>`. Defaults to the newest run dir with an
evaluator iteration whose `passed` is false.

## Preconditions

- `/forge-eval` must have been run on this runId.
- The latest iteration's `report.json` must have `passed: false`.
- The current iteration count must be strictly less than
  `evaluator.maxIterations` (read from `.forge/config.json`). If
  you're already at the budget, refuse and tell the user to run
  `/forge-plan` with a narrower goal instead.

## Steps

1. **Locate `iteration-0<M>/report.md`** — the newest failing eval.

2. **Write `iteration-0<M>/handoff.json`** if it is not already
   there:
   ```json
   {
     "stage": "evaluator-to-generator",
     "runId": "<runId>",
     "fromPath": "evaluator/iteration-0<M>/report.md",
     "toInputs": {
       "spec": "planner/spec.md",
       "report": "evaluator/iteration-0<M>/report.md"
     },
     "summary": "iteration <M> failed (<score>/<max>); generator re-entering with fresh context",
     "createdAt": "<ISO>"
   }
   ```

3. **Spawn the generator sub-agent** for the first sprint with:
   ```
   freshContext: true        <-- mandatory on fix-loop re-entry
   systemPrompt: agents/generator.json.systemPrompt
                 + composed stage='generate' skills
                 + an extra bullet reminding the agent it's fixing
                   violations, not re-planning
   inputFiles:
     - .forge/runs/<runId>/planner/spec.md
     - .forge/runs/<runId>/evaluator/iteration-0<M>/report.md
   ```

   Subsequent sprints of the same fix-loop call use
   `freshContext: false` (same generator continues across sprints)
   — only the first sprint must reset context.

4. **Walk the remaining sprints** exactly as `/forge-generate` does,
   writing to the same `generator/sprint-0N/` directories (overwrite
   is intentional in v0.1 — the evaluator iteration history keeps
   the scoring record).

5. **Tell the user** to run `/forge-eval` again when the fix-loop
   regeneration is done. Do NOT automatically eval — the user
   should see the fix pass through the same public contract.

## Why fresh context on the first sprint

The generator's previous context contains the reasoning that
produced the failing diff. Reusing it tends to anchor the model to
the same assumptions it just violated. A fresh context forces the
generator to read `report.md` as ground truth instead of defending
what it did before.
