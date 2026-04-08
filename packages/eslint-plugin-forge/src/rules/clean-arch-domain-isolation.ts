import { createRule } from '../create-rule';

type Options = [{ frameworkPackages?: readonly string[] }];
type MessageIds = 'frameworkImportInDomain';

/**
 * Clean Architecture rule — code placed under a domain directory
 * (default: `src/domain/**`) is not allowed to import UI frameworks.
 * This is how forge keeps domain pure from React/Next, preserving the
 * "domain has no knowledge of delivery mechanism" invariant.
 *
 * Stub in v0.1; real implementation in Step 5.
 */
export const cleanArchDomainIsolation = createRule<Options, MessageIds>({
  name: 'clean-arch-domain-isolation',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Forbid framework imports (react, next, …) inside the domain layer.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          frameworkPackages: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      frameworkImportInDomain:
        'Domain file "{{file}}" imports framework package "{{pkg}}". Domain must stay framework-agnostic.',
    },
  },
  defaultOptions: [
    {
      frameworkPackages: ['react', 'react-dom', 'next', 'next/navigation'],
    },
  ],
  create: () => ({}),
});
