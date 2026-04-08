import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { fsdSliceBoundary } from '../rules/fsd-slice-boundary';

RuleTester.afterAll = afterAll;
RuleTester.it = it;
RuleTester.describe = describe;

const ruleTester = new RuleTester();

const PROJECT_ROOT = '/tmp/forge-smoke';

describe('fsd-slice-boundary', () => {
  ruleTester.run('fsd-slice-boundary', fsdSliceBoundary, {
    valid: [
      // Within the same slice — allowed.
      {
        filename: `${PROJECT_ROOT}/src/features/auth-login/ui/form.tsx`,
        code: `import { useLoginSubmit } from './model/use-login-submit';`,
      },
      // Cross-slice via public API — allowed.
      {
        filename: `${PROJECT_ROOT}/src/widgets/header/ui.tsx`,
        code: `import { LoginForm } from '@/features/auth-login';`,
      },
      // Downward import from features → entities — allowed.
      {
        filename: `${PROJECT_ROOT}/src/features/auth-login/ui/form.tsx`,
        code: `import type { User } from '@/entities/user';`,
      },
      // shared → shared sibling path (no slices) — allowed.
      {
        filename: `${PROJECT_ROOT}/src/shared/ui/button.tsx`,
        code: `import { cn } from '@/shared/lib/cn';`,
      },
      // Bare specifier (npm package) — rule ignores it.
      {
        filename: `${PROJECT_ROOT}/src/features/auth-login/ui.tsx`,
        code: `import { z } from 'zod';`,
      },
      // Files outside src/ — rule no-ops entirely. Intentionally a
      // plain import rather than an `export ... as default` form so
      // we don't depend on TypeScript-parser-only syntax in tests.
      {
        filename: `${PROJECT_ROOT}/app/example/page.tsx`,
        code: `import { ExamplePage } from '@/pages/example';`,
      },
    ],

    invalid: [
      // Upward import: shared → features is forbidden.
      {
        filename: `${PROJECT_ROOT}/src/shared/lib/auth.ts`,
        code: `import { loginFlow } from '@/features/auth-login';`,
        errors: [{ messageId: 'upwardImport' }],
      },
      // Upward import: entities → features is forbidden.
      {
        filename: `${PROJECT_ROOT}/src/entities/user/model.ts`,
        code: `import { profileFeature } from '@/features/auth-profile';`,
        errors: [{ messageId: 'upwardImport' }],
      },
      // Same-layer cross-slice reference.
      {
        filename: `${PROJECT_ROOT}/src/features/auth-login/ui.tsx`,
        code: `import { something } from '@/features/auth-profile';`,
        errors: [{ messageId: 'siblingSlice' }],
      },
      // Cross-slice import reaching into internals bypasses public API.
      {
        filename: `${PROJECT_ROOT}/src/widgets/header/ui.tsx`,
        code: `import { internalHelper } from '@/features/auth-login/model/helpers';`,
        errors: [{ messageId: 'nonPublicApi' }],
      },
    ],
  });
});
