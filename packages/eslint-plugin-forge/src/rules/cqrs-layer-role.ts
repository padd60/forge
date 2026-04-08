import { createRule } from '../create-rule';

type Options = [];
type MessageIds = 'entitiesMustBeReadonly' | 'featuresOwnCommands';

/**
 * CQRS rule — in forge's mapping (user-approved):
 *  - `entities/*` may only export `readonly` types / query models.
 *  - `features/*` is the only layer allowed to export mutation /
 *    command functions (names starting with verbs that imply state
 *    change: `create*`, `update*`, `delete*`, `submit*`, `save*`, …).
 *
 * Stub in v0.1; real implementation in Step 6.
 */
export const cqrsLayerRole = createRule<Options, MessageIds>({
  name: 'cqrs-layer-role',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce forge CQRS mapping: entities = read model, features = commands.',
    },
    schema: [],
    messages: {
      entitiesMustBeReadonly:
        'Export "{{name}}" in entities/ is not a readonly type. Move mutable state to features/.',
      featuresOwnCommands:
        'Command export "{{name}}" lives in "{{layer}}". Commands must be defined inside features/.',
    },
  },
  defaultOptions: [],
  create: () => ({}),
});
