import type { Rubric } from '@forge-kit-dev/schemas';

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
    {
      id: 'r-cqrs-command-discipline',
      module: 'module-cqrs',
      title: 'Command discipline',
      description:
        'Commands follow naming conventions, return typed results, and validate at appropriate layers.',
      criteria: [
        {
          id: 'command-return-type',
          title: 'Commands return typed results',
          description:
            'Every command function returns a `Result<T, E>` or discriminated success/failure type, not void or a bare promise.',
          weight: 0.4,
          scoreGuide: {
            zero:
              'Commands return `void` or `Promise<void>`. Callers have no typed signal for success or failure.',
            five:
              'One or two commands return void; the rest return typed results.',
            ten:
              'Every command returns a typed result that distinguishes success from failure.',
          },
        },
        {
          id: 'command-naming',
          title: 'Commands are named as verb-noun actions',
          description:
            'Command functions and types follow the verb + noun pattern (e.g. `placeOrder`, `registerUser`).',
          weight: 0.3,
          scoreGuide: {
            zero:
              'Commands are named generically (`handleSubmit`, `processData`) or after infrastructure (`postToApi`).',
            five:
              'One or two commands have generic names; the rest are verb + noun.',
            ten:
              'Every command is named as a verb + domain noun that a business stakeholder would understand.',
          },
        },
        {
          id: 'command-validation-layers',
          title: 'Validation is layered: UI, handler, domain',
          description:
            'Syntactic validation (format, required fields) lives in the UI, semantic validation (authorization, uniqueness) in the handler, invariant validation (business rules) in the domain.',
          weight: 0.3,
          scoreGuide: {
            zero:
              'All validation is in one place (either all in UI or all in domain). No layered separation.',
            five:
              'Two of three validation layers are separated; one layer bleeds into another.',
            ten:
              'Syntactic validation in UI, semantic validation in handler, invariant validation in domain — cleanly separated.',
          },
        },
      ],
    },
    {
      id: 'r-cqrs-read-model-discipline',
      module: 'module-cqrs',
      title: 'Read model discipline',
      description:
        'Read models are purpose-built for their consumers and never mutated directly.',
      criteria: [
        {
          id: 'query-selectivity',
          title: 'Queries select only needed data',
          description:
            'Each UI view uses a purpose-built query or selector that returns only the fields it needs.',
          weight: 0.5,
          scoreGuide: {
            zero:
              'UI components fetch entire entities and pick fields inline. Every component gets the full object graph.',
            five:
              'One or two components fetch full entities; the rest use selective queries.',
            ten:
              'Every UI view uses a purpose-built selector or query that returns exactly the shape it needs.',
          },
        },
        {
          id: 'read-model-immutability',
          title: 'Read models have no mutation methods',
          description:
            'Read model types are fully readonly with no setter functions or mutable properties.',
          weight: 0.5,
          scoreGuide: {
            zero:
              'Read model types have mutable properties or setter methods. The same object is used for reads and writes.',
            five:
              'One or two read model types have mutable properties; the rest are fully readonly.',
            ten:
              'Every read model type is fully readonly. Changes flow only through commands.',
          },
        },
      ],
    },
    {
      id: 'r-cqrs-sync-patterns',
      module: 'module-cqrs',
      title: 'Command-to-query synchronization',
      description:
        'After a command succeeds, the read model update strategy is explicit and tested.',
      criteria: [
        {
          id: 'optimistic-update-rollback',
          title: 'Optimistic updates have rollback paths',
          description:
            'When optimistic UI updates are used, a failure rollback path restores the previous state.',
          weight: 0.5,
          scoreGuide: {
            zero:
              'Optimistic updates are applied but failures leave the UI in an inconsistent state. No rollback logic exists.',
            five:
              'One or two optimistic flows lack rollback; the rest handle failure correctly.',
            ten:
              'Every optimistic update has an explicit rollback path that restores previous state on failure.',
          },
        },
        {
          id: 'invalidation-strategy',
          title: 'Query invalidation is explicit after commands',
          description:
            'After a command succeeds, related queries are explicitly invalidated, refetched, or optimistically updated.',
          weight: 0.5,
          scoreGuide: {
            zero:
              'After commands, the read side is not updated. The user sees stale data until a manual refresh.',
            five:
              'One or two command flows lack explicit query invalidation; the rest invalidate correctly.',
            ten:
              'Every command explicitly declares how its success affects related queries (invalidation, refetch, or optimistic update).',
          },
        },
      ],
    },
  ];
}
