import type { Cart, CartItem } from '@/entities/cart';

/**
 * Command — lives in features/ per the CQRS split. Reads the
 * current cart (a Cart value object), computes a new cart with
 * the added item, and returns it. No mutation of the input; the
 * entity stays immutable.
 */
export function addItemToCart(cart: Cart, item: CartItem): Cart {
  const existing = cart.items.find((i) => i.sku === item.sku);
  const newItems: readonly CartItem[] = existing
    ? cart.items.map((i) =>
        i.sku === item.sku ? { ...i, quantity: i.quantity + item.quantity } : i
      )
    : [...cart.items, item];
  const newTotal = newItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  return { ...cart, items: newItems, total: newTotal };
}
