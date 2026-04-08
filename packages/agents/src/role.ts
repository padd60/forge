/**
 * The three canonical roles in forge's pipeline. Any runtime that claims
 * to host forge must be able to spawn a handle for each role and must
 * guarantee that `evaluator` runs with no visibility into the
 * `generator`'s context. This physical separation is the central
 * architectural invariant forge enforces.
 */
export type AgentRole = 'planner' | 'generator' | 'evaluator';
