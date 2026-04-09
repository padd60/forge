import type { Rubric } from '@forge-kit-dev/schemas';

/**
 * Evaluator rubrics contributed by module-fsd. Kept as TypeScript
 * objects in v0.1; they'll migrate to `rubrics/*.md` with a YAML
 * frontmatter loader in v0.2 so end users can customize scoring
 * without forking the module.
 *
 * Every criterion commits to a three-point score guide (0 / 5 / 10).
 * This is a deliberate constraint — see `RubricScoreSchema` in
 * `@forge-kit-dev/schemas` for the reasoning: we refuse a 7-point ladder
 * because it lets the Evaluator split the difference instead of
 * picking a side.
 */
export function fsdRubrics(): readonly Rubric[] {
  return [
    {
      id: 'r-fsd-boundary',
      module: 'module-fsd',
      title: 'FSD boundary integrity',
      description:
        'Imports respect layer direction, avoid cross-slice references, and only cross slice borders through a public API.',
      criteria: [
        {
          id: 'layer-direction',
          title: 'Unidirectional layer imports',
          description:
            'Higher layers may import from lower layers. Imports in the opposite direction are forbidden.',
          weight: 0.4,
          scoreGuide: {
            zero:
              'Upward imports exist (e.g. shared importing features). This means the dependency direction is inverted and the architecture is effectively collapsed.',
            five:
              'No hard upward imports, but widgets reach directly into entities without using a feature as the composition point.',
            ten:
              'Every import in the diff goes strictly downward in the FSD stack.',
          },
        },
        {
          id: 'cross-slice-isolation',
          title: 'Cross-slice isolation',
          description:
            'Slices inside the same layer must not import each other directly.',
          weight: 0.3,
          scoreGuide: {
            zero:
              'Multiple sibling slices reach into each other through internal files, creating hidden cycles.',
            five:
              'One sibling-slice import exists, used as a temporary shortcut.',
            ten:
              'No slice imports a sibling in the same layer.',
          },
        },
        {
          id: 'public-api',
          title: 'Public API boundary',
          description:
            'Slice consumers import only from the slice index.ts, never from internal files.',
          weight: 0.3,
          scoreGuide: {
            zero:
              'Multiple imports reach past index.ts into internal files of other slices.',
            five:
              'index.ts is used most of the time, with one or two deep imports as an explicit escape hatch.',
            ten:
              'Every cross-slice import resolves through index.ts.',
          },
        },
      ],
    },
    {
      id: 'r-fsd-naming',
      module: 'module-fsd',
      title: 'FSD naming discipline',
      description:
        'Slice and segment names communicate intent and follow FSD conventions.',
      criteria: [
        {
          id: 'feature-verb',
          title: 'Features describe an action',
          description:
            'Each slice inside `features/` is named after the user action it enables (e.g. `auth-login`, `cart-checkout`), not a noun.',
          weight: 0.6,
          scoreGuide: {
            zero:
              'Most feature slices are named by noun (e.g. `features/user`) and therefore describe a data concept, not a capability.',
            five:
              'A few feature slices are named by noun but most are verbs.',
            ten:
              'Every feature slice is verb-led and its name reveals its purpose at a glance.',
          },
        },
        {
          id: 'entity-noun',
          title: 'Entities describe a concept',
          description:
            'Slices inside `entities/` are named after the domain noun they model.',
          weight: 0.4,
          scoreGuide: {
            zero:
              'Entities are named by action or technical detail (e.g. `entities/login`, `entities/api-client`).',
            five:
              'Entities are mostly domain nouns, with a couple of leaks from other concerns.',
            ten:
              'Every entity slice is a clean domain noun.',
          },
        },
      ],
    },
    {
      id: 'r-fsd-cohesion',
      module: 'module-fsd',
      title: 'Layer cohesion',
      description:
        'Code lives in the most appropriate layer for its concerns.',
      criteria: [
        {
          id: 'shared-purity',
          title: 'Shared stays domain-agnostic',
          description:
            'Nothing under `shared/` mentions domain concepts, entities, or features.',
          weight: 0.5,
          scoreGuide: {
            zero:
              'Shared holds domain logic or entity types — it is a dumping ground.',
            five:
              'Shared is mostly generic, with one or two leaks of domain vocabulary.',
            ten:
              'Shared is fully domain-agnostic and reusable outside this repo.',
          },
        },
        {
          id: 'widgets-compose',
          title: 'Widgets compose features',
          description:
            'Widgets should compose one or more features and should not implement feature logic directly.',
          weight: 0.5,
          scoreGuide: {
            zero:
              'Widgets reimplement feature logic (state, mutations) inline.',
            five:
              'Widgets mostly compose features but contain some inline logic that belongs in a feature.',
            ten:
              'Widgets are pure composition — they orchestrate features without owning state.',
          },
        },
      ],
    },
  ];
}
