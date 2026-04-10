import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { fsdNoWildcardReexport } from '../rules/fsd-no-wildcard-reexport';

RuleTester.afterAll = afterAll;
RuleTester.it = it;
RuleTester.describe = describe;

const ruleTester = new RuleTester();

const PROJECT_ROOT = '/tmp/forge-smoke';

describe('fsd-no-wildcard-reexport', () => {
  ruleTester.run('fsd-no-wildcard-reexport', fsdNoWildcardReexport, {
    valid: [
      // Explicit named re-export inside FSD layer — allowed.
      {
        filename: `${PROJECT_ROOT}/src/features/auth-login/index.ts`,
        code: `export { LoginForm } from './ui/LoginForm';`,
      },
      // Explicit named re-export in entities — allowed.
      {
        filename: `${PROJECT_ROOT}/src/entities/user/index.ts`,
        code: `export { User } from './model/User';`,
      },
      // Wildcard re-export outside FSD layers — allowed.
      {
        filename: `${PROJECT_ROOT}/src/utils/index.ts`,
        code: `export * from './helpers';`,
      },
      // Wildcard re-export at project root — allowed.
      {
        filename: `${PROJECT_ROOT}/index.ts`,
        code: `export * from './lib';`,
      },
      // Normal import inside FSD layer — allowed.
      {
        filename: `${PROJECT_ROOT}/src/features/auth-login/ui/form.tsx`,
        code: `import { something } from './model';`,
      },
      // Explicit re-export in shared — allowed.
      {
        filename: `${PROJECT_ROOT}/src/shared/ui/index.ts`,
        code: `export { Button } from './Button';`,
      },
    ],

    invalid: [
      // Wildcard re-export in features layer.
      {
        filename: `${PROJECT_ROOT}/src/features/auth-login/index.ts`,
        code: `export * from './ui';`,
        errors: [{ messageId: 'wildcardReexport' }],
      },
      // Wildcard re-export in entities layer.
      {
        filename: `${PROJECT_ROOT}/src/entities/user/index.ts`,
        code: `export * from './model';`,
        errors: [{ messageId: 'wildcardReexport' }],
      },
      // Wildcard re-export in shared layer.
      {
        filename: `${PROJECT_ROOT}/src/shared/ui/index.ts`,
        code: `export * from './Button';`,
        errors: [{ messageId: 'wildcardReexport' }],
      },
      // Wildcard re-export in widgets layer.
      {
        filename: `${PROJECT_ROOT}/src/widgets/header/index.ts`,
        code: `export * from './ui';`,
        errors: [{ messageId: 'wildcardReexport' }],
      },
      // Wildcard re-export in pages layer.
      {
        filename: `${PROJECT_ROOT}/src/pages/home/index.ts`,
        code: `export * from './ui';`,
        errors: [{ messageId: 'wildcardReexport' }],
      },
      // Wildcard re-export in app layer.
      {
        filename: `${PROJECT_ROOT}/src/app/providers/index.ts`,
        code: `export * from './theme';`,
        errors: [{ messageId: 'wildcardReexport' }],
      },
      // Multiple wildcard re-exports in one file — two errors.
      {
        filename: `${PROJECT_ROOT}/src/features/auth-login/index.ts`,
        code: `export * from './ui';\nexport * from './model';`,
        errors: [
          { messageId: 'wildcardReexport' },
          { messageId: 'wildcardReexport' },
        ],
      },
    ],
  });
});
