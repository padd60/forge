/**
 * User entity — the canonical read-model shape of a user in the app.
 *
 * This file intentionally stays framework-free (no react/next
 * imports) so `@forge/forge/clean-arch-domain-isolation` is happy, and
 * every property is `readonly` so `@forge/forge/cqrs-layer-role` sees
 * entities as a pure read model. The `id` field satisfies
 * `@forge/forge/ddd-entity-id`.
 */
export interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

export function isSameUser(a: User, b: User): boolean {
  return a.id === b.id;
}
