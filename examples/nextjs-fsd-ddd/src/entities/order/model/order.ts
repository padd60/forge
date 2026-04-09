// VIOLATION: framework import in domain layer
import { useState } from 'react';

/**
 * Order aggregate — required by `@forge/forge/ddd-entity-id` to
 * carry an `id` field, and required by
 * `@forge/forge/clean-arch-domain-isolation` to contain no
 * framework imports. This file is the concrete invariant the
 * example is demonstrating.
 *
 * `OrderLine` is a value object living inside the Order aggregate.
 * Because the ddd-entity-id rule scans every exported type under
 * `/entities/` for an `id` field, value objects need an explicit
 * suppression. In production you'd usually prefer moving pure value
 * objects out of entities/ altogether; the example keeps them
 * together to show what the escape hatch looks like.
 */
// eslint-disable-next-line @forge/forge/ddd-entity-id
export interface OrderLine {
  readonly sku: string;
  readonly quantity: number;
  readonly unitPrice: number;
}

export interface Order {
  readonly id: string;
  readonly customerId: string;
  readonly lines: readonly OrderLine[];
  readonly total: number;
}

export function makeOrder(
  id: string,
  customerId: string,
  lines: readonly OrderLine[]
): Order {
  const total = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  return { id, customerId, lines, total };
}
