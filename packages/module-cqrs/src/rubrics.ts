import type { Rubric } from '@forge/schemas';

export function cqrsRubrics(): readonly Rubric[] {
  return [
    {
      id: 'r-cqrs-split',
      module: 'module-cqrs',
      title: 'Read/write separation',
      description:
        'Read models and write models are distinct types with distinct owners.',
      criteria: [
        {
          id: 'distinct-types',
          title: 'Read and write types are distinct',
          description:
            'The type a component reads (e.g. `UserView`) is not the same as the payload a mutation accepts (e.g. `UpdateUserInput`).',
          weight: 0.5,
          scoreGuide: {
            zero:
              'The same type is used for both reads and writes, so mutations touch the read model shape and vice versa.',
            five:
              'Most interactions have distinct read/write types, with one or two places still sharing a single type.',
            ten:
              'Every read path and every write path uses a purpose-built type.',
          },
        },
        {
          id: 'sync-strategy',
          title: 'Sync strategy is explicit',
          description:
            'When a command succeeds, the code explicitly decides how the read model updates (invalidate, refetch, optimistic update).',
          weight: 0.5,
          scoreGuide: {
            zero:
              'There is no declared strategy — after a command, it is unclear whether the read side knows about the change.',
            five:
              'Most commands end with a clear update strategy, with one or two implicit flows.',
            ten:
              'Every command documents (or implements via a hook like `useMutation`) how the read model reacts to its success.',
          },
        },
      ],
    },
  ];
}
