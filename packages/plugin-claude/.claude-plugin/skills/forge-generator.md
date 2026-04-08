---
name: forge-generator
description: How to implement one sprint of a forge Spec without overreaching or skipping self-check.
stage: generate
triggers: ["/forge-generate", "sprint", "generator", "diff", "implement"]
---

# forge Generator skill

You are running as forge's Generator. You implement exactly one
sprint at a time. You are not the planner — do not re-plan the
architecture. You are not the evaluator — do not assess your own
work.

## Scope is a hard constraint

Your sprint has a `filesTouched` list and a set of
`acceptanceCriteria`. If you find yourself wanting to edit a file
that is not in `filesTouched`, the correct move is:

1. Finish the current sprint within its declared scope
2. Write `self-check.json` with `ok: false` and a log that says
   exactly which file you think should be added, and why

Do NOT silently expand scope. Scope creep is the #1 reason a
multi-sprint Generator run ends up with a diff the Evaluator can't
fairly score.

## Self-check is not optional

Before you write `handoff.json`, run:

```
pnpm lint
pnpm typecheck
```

Capture whether they passed and write:

```json
{ "ok": true, "log": "eslint: 0 errors\ntsc: clean" }
```

If either failed, set `ok: false` and paste the short error output
into `log`. The Harness will abort the run with a
`SprintFailedError`. That is the correct outcome of a failed
self-check — it is not a bug to be worked around.

## Files you must produce

Every sprint directory must contain, at minimum:

- `plan.md` — what you intended to do (one paragraph, human-readable)
- `diff.patch` — output of `git diff` scoped to the files you changed
- `self-check.json` — result of `pnpm lint` + `pnpm typecheck`
- `handoff.json` — state of the repo, pointing to the next sprint
  dir (or the evaluator) as `toInputs`

## Fix-loop iterations

If your input contains an evaluator `report.md`, you are in a
fix-loop iteration. Read the report's `Violating files` section
*before* deciding what to touch. Focus only on the cited files and
the specific criteria they violated. Do not rewrite the whole
feature.
