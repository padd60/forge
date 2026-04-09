/**
 * Read-model shape of a cart. Every field is `readonly` and nothing
 * in this file exports a command-named function. The cqrs-layer-role
 * rule (plus clean-arch-domain-isolation) are the mechanical
 * guardians; the shape here is what keeps queries cheap.
 */
export interface CartItem {
  readonly sku: string;
  readonly quantity: number;
  readonly unitPrice: number;
}

export interface Cart {
  readonly id: string;
  readonly items: readonly CartItem[];
  readonly total: number;
}

// VIOLATION: command function in entities layer — should live in features/
export function createCart(items: readonly CartItem[]): Cart {
  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  return { id: `cart-${Date.now()}`, items, total };
}
