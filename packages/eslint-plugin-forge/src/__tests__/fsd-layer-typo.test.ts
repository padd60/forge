import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { fsdLayerTypo } from '../rules/fsd-layer-typo';

RuleTester.afterAll = afterAll;
RuleTester.it = it;
RuleTester.describe = describe;

const ruleTester = new RuleTester();

const PROJECT_ROOT = '/tmp/forge-smoke';

describe('fsd-layer-typo', () => {
  ruleTester.run('fsd-layer-typo', fsdLayerTypo, {
    valid: [
      // Correct plural form — features.
      {
        filename: `${PROJECT_ROOT}/src/features/auth-login/ui.tsx`,
        code: `export const a = 1;`,
      },
      // Correct plural form — entities.
      {
        filename: `${PROJECT_ROOT}/src/entities/user/model.ts`,
        code: `export const a = 1;`,
      },
      // Correct plural form — pages.
      {
        filename: `${PROJECT_ROOT}/src/pages/home/ui.tsx`,
        code: `export const a = 1;`,
      },
      // Correct plural form — widgets.
      {
        filename: `${PROJECT_ROOT}/src/widgets/header/ui.tsx`,
        code: `export const a = 1;`,
      },
      // Layers that have no typo mapping — shared, app.
      {
        filename: `${PROJECT_ROOT}/src/shared/ui/button.tsx`,
        code: `export const a = 1;`,
      },
      {
        filename: `${PROJECT_ROOT}/src/app/providers/theme.ts`,
        code: `export const a = 1;`,
      },
      // File outside FSD tree entirely.
      {
        filename: `${PROJECT_ROOT}/lib/utils.ts`,
        code: `export const a = 1;`,
      },
    ],

    invalid: [
      // Singular "feature" instead of "features".
      {
        filename: `${PROJECT_ROOT}/src/feature/auth-login/ui.tsx`,
        code: `export const a = 1;`,
        errors: [
          {
            messageId: 'layerTypo',
            data: { actual: 'feature', expected: 'features' },
          },
        ],
      },
      // Singular "entity" instead of "entities".
      {
        filename: `${PROJECT_ROOT}/src/entity/user/model.ts`,
        code: `export const a = 1;`,
        errors: [
          {
            messageId: 'layerTypo',
            data: { actual: 'entity', expected: 'entities' },
          },
        ],
      },
      // Singular "page" instead of "pages".
      {
        filename: `${PROJECT_ROOT}/src/page/home/ui.tsx`,
        code: `export const a = 1;`,
        errors: [
          {
            messageId: 'layerTypo',
            data: { actual: 'page', expected: 'pages' },
          },
        ],
      },
      // Singular "widget" instead of "widgets".
      {
        filename: `${PROJECT_ROOT}/src/widget/header/ui.tsx`,
        code: `export const a = 1;`,
        errors: [
          {
            messageId: 'layerTypo',
            data: { actual: 'widget', expected: 'widgets' },
          },
        ],
      },
    ],
  });
});
