import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { componentMaxLines } from '../rules/component-max-lines';

RuleTester.afterAll = afterAll;
RuleTester.it = it;
RuleTester.describe = describe;

const ruleTester = new RuleTester();

describe('component-max-lines', () => {
  ruleTester.run('component-max-lines', componentMaxLines, {
    valid: [
      // Short component — well under the default limit.
      {
        code: `
function Card() {
  return null;
}
        `,
      },
      // Non-PascalCase function — rule ignores it entirely.
      {
        code: `
function runReallyLongInternalHelper() {
  let a = 1;
  let b = 2;
  let c = 3;
  let d = 4;
  let e = 5;
  let f = 6;
  let g = 7;
  let h = 8;
  let i = 9;
  let j = 10;
  let k = 11;
  return a + b + c + d + e + f + g + h + i + j + k;
}
        `,
        options: [{ max: 5 }],
      },
      // Arrow component that is under the limit.
      {
        code: `
const Card = () => {
  return null;
};
        `,
      },
    ],
    invalid: [
      // Function declaration exceeding the limit.
      {
        code: `
function Card() {
  const a = 1;
  const b = 2;
  const c = 3;
  const d = 4;
  return null;
}
        `,
        options: [{ max: 3 }],
        errors: [{ messageId: 'tooLong' }],
      },
      // Arrow component exceeding the limit.
      {
        code: `
const Card = () => {
  const a = 1;
  const b = 2;
  const c = 3;
  const d = 4;
  const e = 5;
  return null;
};
        `,
        options: [{ max: 3 }],
        errors: [{ messageId: 'tooLong' }],
      },
    ],
  });
});
