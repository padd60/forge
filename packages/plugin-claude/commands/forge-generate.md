---
description: Walk a forge Spec through its sprints, one sub-agent spawn per sprint.
argument-hint: Optional runId (defaults to most recent run)
---

# /forge-generate

Arguments: optional `<runId>`. If omitted, use the newest directory
under `.forge/runs/` (sort by name — the timestamp prefix sorts
correctly).

## What this command does

You are the orchestrator. The actual code writing happens inside
Task-spawned sub-agents; your job is to move files between them.

1. **Locate the run.** Confirm `.forge/runs/<runId>/planner/spec.json`
   exists. If it does not, stop and point the user at `/forge-plan`.

2. **Load the spec.** Parse it with `SpecSchema`. Note
   `spec.sprints.length` — that's how many sub-agent spawns this
   command will perform.

3. **For each sprint `i` (1..N):**

   a. Create `.forge/runs/<runId>/generator/sprint-0<i>/`.

   b. **Spawn a generator sub-agent via the Task tool.** Use
      `agents/generator.json` for the system prompt + shell allowlist,
      and compose in every active module's stage-`generate` skill.

      Fresh context for this spawn: **false** (sub-agent may share
      context across sprints within a single /forge-generate call).

      Input files:
      - `.forge/runs/<runId>/planner/spec.md`
      - For sprints after the first, the previous sprint's
        `handoff.json`

      Expected outputs:
      - `.forge/runs/<runId>/generator/sprint-0<i>/plan.md`
      - `.forge/runs/<runId>/generator/sprint-0<i>/diff.patch`
      - `.forge/runs/<runId>/generator/sprint-0<i>/self-check.json`
      - `.forge/runs/<runId>/generator/sprint-0<i>/handoff.json`

   c. **Read `self-check.json`.** If `ok` is false, stop immediately.
      Tell the user which sprint failed and include the `log` field.
      Do NOT proceed to the next sprint. Do NOT attempt to fix the
      failure yourself — that's what `/forge-fix` is for after
      `/forge-eval` has scored the result.

4. **After the last sprint**, tell the user:
   `Generator done — <N> sprint(s) passed self-check. Next: /forge-eval`

## Why one spawn per sprint

Each sprint is a bounded unit of work. Spawning per sprint keeps
context small, makes each sprint individually recoverable on crash,
and gives the Evaluator a clean sprint-by-sprint diff to score
against. Do not try to collapse multiple sprints into a single
spawn — that is the "giant change that's hard to review" pattern
forge exists to prevent.
