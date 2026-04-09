import type { Cart } from './cart';

/**
 * Selectors are *read* helpers over the read model. Exporting them
 * from `entities/` is fine — the CQRS rule only forbids mutation
 * commands, not pure queries over the shape.
 */
export function selectCartTotal(cart: Cart): number {
  return cart.total;
}

export function selectItemCount(cart: Cart): number {
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}
