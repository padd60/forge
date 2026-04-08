import { createRule } from '../create-rule';

type Options = [];
type MessageIds = 'missingId';

/**
 * DDD rule — an interface declared inside a module marked as a
 * bounded-context entity (via JSDoc `@entity` or a naming convention
 * set at module registration time) must include an `id` field.
 *
 * Stub in v0.1; real implementation in Step 4.
 */
export const dddEntityId = createRule<Options, MessageIds>({
  name: 'ddd-entity-id',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require an `id` field on types annotated as DDD entities.',
    },
    schema: [],
    messages: {
      missingId:
        'Entity type "{{name}}" is missing its `id` field. DDD entities must be identifiable.',
    },
  },
  defaultOptions: [],
  create: () => ({}),
});
