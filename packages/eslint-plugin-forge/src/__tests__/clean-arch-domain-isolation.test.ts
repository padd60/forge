import * as tsParser from '@typescript-eslint/parser';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { cleanArchDomainIsolation } from '../rules/clean-arch-domain-isolation';

RuleTester.afterAll = afterAll;
RuleTester.it = it;
RuleTester.describe = describe;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
});

const DOMAIN_FILE = '/tmp/forge-smoke/src/entities/user/model.ts';
const FEATURE_FILE = '/tmp/forge-smoke/src/features/auth-login/ui.tsx';

describe('clean-arch-domain-isolation', () => {
  ruleTester.run('clean-arch-domain-isolation', cleanArchDomainIsolation, {
    valid: [
      // Domain file importing another domain file — ok.
      {
        filename: DOMAIN_FILE,
        code: `import type { Email } from './email';`,
      },
      // Domain file importing a non-framework package — ok.
      {
        filename: DOMAIN_FILE,
        code: `import { z } from 'zod';`,
      },
      // Non-domain file importing react — rule no-ops.
      {
        filename: FEATURE_FILE,
        code: `import { useState } from 'react';`,
      },
      // Non-domain file importing next — rule no-ops.
      {
        filename: FEATURE_FILE,
        code: `import Link from 'next/link';`,
      },
    ],
    invalid: [
      // Domain file importing react — error.
      {
        filename: DOMAIN_FILE,
        code: `import { useState } from 'react';`,
        errors: [{ messageId: 'frameworkImportInDomain' }],
      },
      // Domain file importing next/navigation — error.
      {
        filename: DOMAIN_FILE,
        code: `import { useRouter } from 'next/navigation';`,
        errors: [{ messageId: 'frameworkImportInDomain' }],
      },
      // Domain file importing react-dom — error.
      {
        filename: DOMAIN_FILE,
        code: `import { createPortal } from 'react-dom';`,
        errors: [{ messageId: 'frameworkImportInDomain' }],
      },
    ],
  });
});
