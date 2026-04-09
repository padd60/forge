'use client';

import { Button } from '@/shared/ui/button';

import { addItemToCart } from '../model/add-item.command';

export function AddItemButton() {
  return (
    <Button
      onClick={() => {
        // Dispatch is stubbed — real apps would pipe through a state
        // container. The point of the example is the call shape.
        const next = addItemToCart(
          { id: 'c-1', items: [], total: 0 },
          { sku: 'demo', quantity: 1, unitPrice: 10 }
        );
        console.warn('cart after add:', next);
      }}
    >
      Add demo item
    </Button>
  );
}
