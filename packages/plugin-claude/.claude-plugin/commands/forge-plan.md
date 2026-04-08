---
name: forge-plan
description: Start a forge run — produce a Spec from a natural-language goal.
arguments: "<goal>"
---

# /forge-plan

Arguments: the natural-language goal, quoted if it contains spaces.
Example: `/forge-plan "add a login form with email+password validation"`.

## What this command does

You (the main Claude Code agent) are the orchestrator for this
command. You will:

1. **Read `.forge/config.json`**. If it is missing, stop and tell the
   user to run `npx @forge/cli init` first. Otherwise grab
   `activeModules`, `enforcement`, and `evaluator.minScore` for later.

2. **Mint a `runId`**. Format: ISO-8601 timestamp with `:` replaced
   by `-`, plus a 6-character nanoid suffix (use the helpers exported
   from `@forge/core`'s `paths.ts` if you have it available, otherwise
   synthesize one). Create the directory structure under
   `.forge/runs/<runId>/`:

   ```
   .forge/runs/<runId>/
   ├── request.json
   ├── planner/
   └── generator/
   ```

3. **Write `request.json`**. Must match `RunRequestSchema` from
   `@forge/schemas`:

   ```json
   {
     "runId": "<runId>",
     "goal": "<goal from $ARGUMENTS>",
     "enforcement": "<from config>",
     "activeModules": ["..."],
     "repoRoot": "<absolute path>",
     "createdAt": "<ISO timestamp>"
   }
   ```

4. **Spawn the planner sub-agent via the Task tool.** The spawn MUST
   be a fresh sub-agent, not a continuation of your own conversation.
   Use the agent manifest at `agents/planner.json` for the system
   prompt + tool allowlist, and compose in every active module's
   stage-`plan` skill from `.claude/skills/`.

   Input files to hand the sub-agent:
   - `.forge/runs/<runId>/request.json`

   Expected output:
   - `.forge/runs/<runId>/planner/spec.json` matching `SpecSchema`

5. **Validate the spec** you got back. If `SpecSchema.parse()` fails,
   report the error to the user verbatim and stop — do NOT try to
   repair a broken spec by rewriting it yourself.

6. **Render `spec.md`** from the valid spec (human-readable listing
   of goal, target layer, sprints, success criteria) and write it to
   `.forge/runs/<runId>/planner/spec.md`.

7. **Write `planner/handoff.json`** with:
   ```json
   {
     "stage": "planner-to-generator",
     "runId": "<runId>",
     "fromPath": "planner/spec.md",
     "toInputs": { "spec": "planner/spec.md" },
     "summary": "Spec with <N> sprint(s) ready for generator",
     "createdAt": "<ISO>"
   }
   ```

8. **Tell the user** the runId and the next command:
   `Next: /forge-generate <runId>` (or just `/forge-generate` — the
   generator command defaults to the most recent run dir).

## Fresh context requirement

The planner sub-agent may share your context (it is not the
evaluator). But it is a **sub-agent**, not a continuation — you must
invoke it via Task, not by editing files yourself in this
conversation. That keeps the division of labor inspectable in
`.forge/runs/`.
