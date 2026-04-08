import * as tsParser from '@typescript-eslint/parser';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { noBooleanFlagArg } from '../rules/no-boolean-flag-arg';

RuleTester.afterAll = afterAll;
RuleTester.it = it;
RuleTester.describe = describe;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
});

describe('no-boolean-flag-arg', () => {
  ruleTester.run('no-boolean-flag-arg', noBooleanFlagArg, {
    valid: [
      // Internal helper with a boolean param — not exported, rule ignores.
      {
        code: `
function internal(flag: boolean) { return flag; }
        `,
      },
      // Exported function with no boolean params.
      {
        code: `
export function run(input: string) { return input.length; }
        `,
      },
      // Exported function with a non-boolean param.
      {
        code: `
export function run(input: string, count: number) { return input; }
        `,
      },
      // Exported arrow function with no boolean params.
      {
        code: `
export const run = (input: string) => input.length;
        `,
      },
    ],
    invalid: [
      // Exported function with a boolean param.
      {
        code: `
export function render(isVisible: boolean) { return isVisible; }
        `,
        errors: [{ messageId: 'flagArgument' }],
      },
      // Exported arrow function with a boolean param.
      {
        code: `
export const render = (isVisible: boolean) => isVisible;
        `,
        errors: [{ messageId: 'flagArgument' }],
      },
      // Two boolean params → two reports.
      {
        code: `
export function render(isVisible: boolean, isBold: boolean) {
  return isVisible && isBold;
}
        `,
        errors: [
          { messageId: 'flagArgument' },
          { messageId: 'flagArgument' },
        ],
      },
    ],
  });
});
