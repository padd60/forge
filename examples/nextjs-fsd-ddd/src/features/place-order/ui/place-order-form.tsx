'use client';

import { useState } from 'react';

import { Button } from '@/shared/ui/button';

import { placeOrder } from '../model/place-order.use-case';

export function PlaceOrderForm() {
  const [placing, setPlacing] = useState(false);

  async function handleSubmit() {
    setPlacing(true);
    await placeOrder({
      customerId: 'c-demo',
      lines: [{ sku: 'demo-item', quantity: 1, unitPrice: 99 }],
    });
    setPlacing(false);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit();
      }}
    >
      <Button type="submit">{placing ? 'Placing…' : 'Place order'}</Button>
    </form>
  );
}
