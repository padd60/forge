import * as tsParser from '@typescript-eslint/parser';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { dddEntityId } from '../rules/ddd-entity-id';

RuleTester.afterAll = afterAll;
RuleTester.it = it;
RuleTester.describe = describe;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
});

const ENTITY_FILE = '/tmp/forge-smoke/src/entities/user/model.ts';
const NON_ENTITY_FILE = '/tmp/forge-smoke/src/features/auth-login/model.ts';

describe('ddd-entity-id', () => {
  ruleTester.run('ddd-entity-id', dddEntityId, {
    valid: [
      // Entity file, interface has id — ok.
      {
        filename: ENTITY_FILE,
        code: `interface User { id: string; name: string; }`,
      },
      // Entity file, type alias has id — ok.
      {
        filename: ENTITY_FILE,
        code: `type User = { id: string; name: string; };`,
      },
      // Non-entity file, no id — rule ignores.
      {
        filename: NON_ENTITY_FILE,
        code: `interface LoginInput { email: string; password: string; }`,
      },
      // Intersection / non-literal type alias — rule skips by design.
      {
        filename: ENTITY_FILE,
        code: `type UserWithMeta = User & { lastSeenAt: string };`,
      },
      // JSDoc @entity with id — ok.
      {
        filename: NON_ENTITY_FILE,
        code: `
/** @entity */
interface Product { id: string; title: string; }
        `,
      },
    ],
    invalid: [
      // Entity file, interface missing id — error.
      {
        filename: ENTITY_FILE,
        code: `interface User { name: string; email: string; }`,
        errors: [{ messageId: 'missingId' }],
      },
      // Entity file, type alias missing id — error.
      {
        filename: ENTITY_FILE,
        code: `type User = { name: string; email: string; };`,
        errors: [{ messageId: 'missingId' }],
      },
      // JSDoc @entity, missing id — error even outside entities/ path.
      {
        filename: NON_ENTITY_FILE,
        code: `
/** @entity */
interface Product { title: string; price: number; }
        `,
        errors: [{ messageId: 'missingId' }],
      },
    ],
  });
});
