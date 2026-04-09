import { makeOrder, type Order, type OrderLine } from '@/entities/order';

/**
 * Use case — pure orchestration, lives in features/ per both FSD
 * (feature = write side) and Clean Architecture (application
 * layer). It depends on the domain entity via its public API,
 * never by deep path.
 */
export interface PlaceOrderInput {
  readonly customerId: string;
  readonly lines: readonly OrderLine[];
}

export async function placeOrder(input: PlaceOrderInput): Promise<Order> {
  if (input.lines.length === 0) {
    throw new Error('cannot place an empty order');
  }
  const id = `order-${Date.now()}`;
  const order = makeOrder(id, input.customerId, input.lines);
  return order;
}
