import type { Cart } from '@/entities/cart';

/**
 * Checkout command — the write-side handler. Emits an event-like
 * payload; the exact sink (API call, saga, etc.) is out of scope
 * for this example.
 */
export interface CheckoutReceipt {
  readonly orderId: string;
  readonly cartTotal: number;
}

export async function submitCheckout(cart: Cart): Promise<CheckoutReceipt> {
  if (cart.items.length === 0) {
    throw new Error('cannot checkout an empty cart');
  }
  await Promise.resolve();
  return { orderId: `o-${Date.now()}`, cartTotal: cart.total };
}
