---
name: forge-eval
description: Score the latest generator diff against the active rubrics, in a fresh context.
arguments: "[runId]"
---

# /forge-eval

Arguments: optional `<runId>`. If omitted, use the newest
`.forge/runs/<runId>/` directory that contains a `generator/`
subfolder.

## Hard invariant: fresh context

The evaluator spawn **must** be `freshContext: true`. This is the
single most important contract in forge. If you spawn an evaluator
that inherits your conversation history, you have just destroyed
the entire reason Anthropic's harness paper separates Planner,
Generator, and Evaluator. Re-read `agents/evaluator.json`. Do not
talk yourself into a shortcut.

## Steps

1. **Load the run.** Locate `.forge/runs/<runId>/` and read:
   - `.forge/config.json` (for `evaluator.minScore`, `maxIterations`)
   - `.forge/runs/<runId>/planner/spec.md`
   - The latest `generator/sprint-0N/diff.patch` (highest N)
   - All active modules' rubrics. Modules ship rubrics in code; for
     v0.1 you can load them by importing
     `@forge-kit-dev/module-*`'s `rubrics()` function, or by reading the
     rubric files the host placed under `.claude/skills/`. Copy
     them into a temporary `rubrics/` dir under the iteration so the
     sub-agent sees them as plain files.

2. **Mint the iteration number** `M`:
   - If `.forge/runs/<runId>/evaluator/iteration-0<K>/` already
     exists for some K, use `max(K) + 1`.
   - Otherwise use 1.
   Create `.forge/runs/<runId>/evaluator/iteration-0<M>/`.

3. **Spawn the evaluator sub-agent via the Task tool** with:
   ```
   freshContext: true
   systemPrompt: agents/evaluator.json.systemPrompt
                 + composed stage='evaluate' skills for active modules
   inputFiles:
     - .forge/runs/<runId>/planner/spec.md
     - .forge/runs/<runId>/generator/sprint-0<N>/diff.patch
     - .forge/runs/<runId>/evaluator/iteration-0<M>/rubrics/*.json
   expectedOutputs:
     - .forge/runs/<runId>/evaluator/iteration-0<M>/report.json
     - .forge/runs/<runId>/evaluator/iteration-0<M>/report.md
   ```

4. **Parse `report.json`** with `EvalReportSchema`. On validation
   error, surface the Zod message and stop — don't try to patch a
   broken report.

5. **Decide what to tell the user:**
   - If `report.passed === true`: print "Eval passed
     (<totalScore>/<maxScore>). Writing
     .forge/runs/<runId>/evaluator/final.json." Write `final.json` as
     a verbatim copy of the passing report and stop.
   - If `report.passed === false` and `M < maxIterations`:
     print the top three rubric failures (id + rationale) and tell
     the user the next move is `/forge-fix`. Do NOT run the fix loop
     automatically — the user decides.
   - If `report.passed === false` and `M >= maxIterations`: write
     `evaluator/final.json` with `passed: false` and tell the user
     the run has exhausted its fix-loop budget. They now choose
     between editing the spec manually or starting a new run.

## Why you, the main agent, never edit code in this command

The whole point of `/forge-eval` is the physical separation from
code generation. If you (the main agent) start patching files while
"also evaluating", you've collapsed the two roles back into one
context. Delegate judgment to the sub-agent; delegate code changes
to `/forge-fix`.
