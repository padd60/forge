import * as tsParser from '@typescript-eslint/parser';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { noTypeEscape } from '../rules/no-type-escape';

RuleTester.afterAll = afterAll;
RuleTester.it = it;
RuleTester.describe = describe;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
});

describe('no-type-escape', () => {
  ruleTester.run('no-type-escape', noTypeEscape, {
    valid: [
      // Properly typed exported function — no escape.
      {
        code: `
export function greet(name: string): string { return name; }
        `,
      },
      // Internal (non-exported) function using any — not flagged.
      {
        code: `
function internal(data: any): void { console.log(data); }
        `,
      },
      // Internal function with non-null assertion — not flagged.
      {
        code: `
function internal(obj: { a?: string }) { return obj.a!; }
        `,
      },
      // Internal function with as any — not flagged.
      {
        code: `
function internal(data: unknown) { return data as any; }
        `,
      },
      // Exported function using unknown (correct approach).
      {
        code: `
export function parse(input: unknown): string { return String(input); }
        `,
      },
      // @ts-expect-error is NOT flagged by this rule (warning-only, separate concern).
      {
        code: `
// @ts-expect-error — intentional for test
export const x = 1;
        `,
      },
    ],
    invalid: [
      // Exported function with `any` param.
      {
        code: `
export function process(data: any): void { console.log(data); }
        `,
        errors: [{ messageId: 'anyType' }],
      },
      // Exported arrow function with `any` param.
      {
        code: `
export const process = (data: any): void => { console.log(data); };
        `,
        errors: [{ messageId: 'anyType' }],
      },
      // Exported function with `any` return type.
      {
        code: `
export function fetch(): any { return null; }
        `,
        errors: [{ messageId: 'anyType' }],
      },
      // `as any` assertion in exported function.
      {
        code: `
export function cast(val: unknown) { return val as any; }
        `,
        errors: [{ messageId: 'anyType' }],
      },
      // @ts-ignore in a comment — always flagged.
      {
        code: `
// @ts-ignore
const x = 1;
        `,
        errors: [{ messageId: 'tsIgnore' }],
      },
      // @ts-ignore in a block comment.
      {
        code: `
/* @ts-ignore */
const x = 1;
        `,
        errors: [{ messageId: 'tsIgnore' }],
      },
      // Non-null assertion in exported function.
      {
        code: `
export function getName(obj: { name?: string }) { return obj.name!; }
        `,
        errors: [{ messageId: 'nonNullAssertion' }],
      },
      // Non-null assertion in exported arrow function.
      {
        code: `
export const getName = (obj: { name?: string }) => obj.name!;
        `,
        errors: [{ messageId: 'nonNullAssertion' }],
      },
      // Double cast `as unknown as T` in exported function.
      {
        code: `
export function coerce(val: string) { return val as unknown as number; }
        `,
        errors: [{ messageId: 'doubleCast' }],
      },
      // Multiple violations in a single exported function.
      {
        code: `
export function messy(data: any) {
  const x = data as unknown as number;
  return x!;
}
        `,
        errors: [
          { messageId: 'anyType' },
          { messageId: 'doubleCast' },
          { messageId: 'nonNullAssertion' },
        ],
      },
    ],
  });
});
