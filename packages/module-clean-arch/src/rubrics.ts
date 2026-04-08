import type { Rubric } from '@forge/schemas';

export function cleanArchRubrics(): readonly Rubric[] {
  return [
    {
      id: 'r-clean-arch-dip',
      module: 'module-clean-arch',
      title: 'Dependency Inversion discipline',
      description:
        'High-level code depends on abstractions; adapters live at the edge, not in the middle.',
      criteria: [
        {
          id: 'ports-and-adapters',
          title: 'Ports and adapters',
          description:
            'Infrastructure (fetch, storage, analytics) is consumed through an interface the inner layer defines, not imported directly.',
          weight: 0.6,
          scoreGuide: {
            zero:
              'Inner-layer code imports concrete infrastructure (`import { fetch } from ...`) everywhere, making the inner layer impossible to test without mocking the world.',
            five:
              'Most infrastructure is abstracted, with one or two direct imports left as pragmatic shortcuts.',
            ten:
              'Every infrastructure dependency is declared as an interface in the inner layer. Adapters live at the outer edge.',
          },
        },
        {
          id: 'injection-at-boundary',
          title: 'Composition root at the edge',
          description:
            'Adapters are wired into the inner layer at a single composition point (e.g. `app/providers.tsx`), not sprinkled across features.',
          weight: 0.4,
          scoreGuide: {
            zero:
              'Every feature creates its own instance of the same infrastructure adapter. Swapping implementations means touching dozens of files.',
            five:
              'Most wiring is centralized, with one or two features instantiating adapters inline.',
            ten:
              'There is exactly one composition root, and swapping an adapter means editing one file.',
          },
        },
      ],
    },
    {
      id: 'r-clean-arch-use-case',
      module: 'module-clean-arch',
      title: 'Use case centralization',
      description:
        'Business actions are expressed as use-case functions, not as scattered event handlers.',
      criteria: [
        {
          id: 'use-case-presence',
          title: 'Use cases exist and are named after actions',
          description:
            'Each user-facing action has a single `verb + noun` use case function that owns the orchestration.',
          weight: 1,
          scoreGuide: {
            zero:
              'User actions are implemented entirely inside component event handlers. There is no standalone place to read the business flow.',
            five:
              'A few central actions are extracted into use cases, but most still live in components.',
            ten:
              'Every non-trivial user action is an explicit use case that can be read independently of the UI that triggers it.',
          },
        },
      ],
    },
  ];
}
