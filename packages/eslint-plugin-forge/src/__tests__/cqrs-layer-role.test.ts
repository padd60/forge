import * as tsParser from '@typescript-eslint/parser';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { cqrsLayerRole } from '../rules/cqrs-layer-role';

RuleTester.afterAll = afterAll;
RuleTester.it = it;
RuleTester.describe = describe;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
});

const ENTITIES_FILE = '/tmp/forge-smoke/src/entities/order/model.ts';
const FEATURES_FILE =
  '/tmp/forge-smoke/src/features/cart-checkout/model.ts';

describe('cqrs-layer-role', () => {
  ruleTester.run('cqrs-layer-role', cqrsLayerRole, {
    valid: [
      // All-readonly interface inside entities — ok.
      {
        filename: ENTITIES_FILE,
        code: `export interface OrderView { readonly id: string; readonly total: number; }`,
      },
      // Type alias with all readonly fields — ok.
      {
        filename: ENTITIES_FILE,
        code: `export type OrderView = { readonly id: string; readonly placedAt: string; };`,
      },
      // Selector function with non-command name — ok.
      {
        filename: ENTITIES_FILE,
        code: `export function totalLineCount(order: { lines: readonly unknown[] }) { return order.lines.length; }`,
      },
      // Command-named function in features file — rule no-ops.
      {
        filename: FEATURES_FILE,
        code: `export async function placeOrder(input: unknown) { return input; }`,
      },
      // Non-command name that starts with a command prefix but lacks uppercase follow-up — ok (e.g. `additional`).
      {
        filename: ENTITIES_FILE,
        code: `export function additionalLineCount(n: number) { return n + 1; }`,
      },
    ],
    invalid: [
      // Non-readonly property in entities interface.
      {
        filename: ENTITIES_FILE,
        code: `export interface OrderView { readonly id: string; total: number; }`,
        errors: [{ messageId: 'entitiesMustBeReadonly' }],
      },
      // Non-readonly property in entities type alias.
      {
        filename: ENTITIES_FILE,
        code: `export type OrderView = { readonly id: string; status: string; };`,
        errors: [{ messageId: 'entitiesMustBeReadonly' }],
      },
      // Command function declaration inside entities.
      {
        filename: ENTITIES_FILE,
        code: `export function createOrder(input: string) { return input; }`,
        errors: [{ messageId: 'featuresOwnCommands' }],
      },
      // Command arrow function inside entities.
      {
        filename: ENTITIES_FILE,
        code: `export const updateOrderStatus = (id: string) => id;`,
        errors: [{ messageId: 'featuresOwnCommands' }],
      },
    ],
  });
});
