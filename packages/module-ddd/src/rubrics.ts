import type { Rubric } from '@forge-kit-dev/schemas';

/**
 * Advisory rubrics for the DDD module. The mechanical side only
 * enforces `ddd-entity-id`; the more subjective concerns live here as
 * Evaluator rubrics because they depend on reading intent, not syntax.
 */
export function dddRubrics(): readonly Rubric[] {
  return [
    {
      id: 'r-ddd-ubiquitous-language',
      module: 'module-ddd',
      title: 'Ubiquitous language consistency',
      description:
        'Code reuses the words the business uses, without silent translation.',
      criteria: [
        {
          id: 'domain-vocabulary',
          title: 'Domain vocabulary survives into code',
          description:
            'Entity and feature names match the business language. "Basket" stays "basket", not "cart".',
          weight: 0.6,
          scoreGuide: {
            zero:
              'Code introduces technical synonyms for business terms. Reviewers have to mentally translate every symbol.',
            five:
              'Most symbols match the business vocabulary, with one or two "programmer" synonyms sneaking in.',
            ten:
              'Every entity, feature, and public function name is a word the business would say out loud.',
          },
        },
        {
          id: 'glossary-kept-fresh',
          title: 'Glossary reflects reality',
          description:
            'If the project has a domain glossary (`docs/glossary.md` or similar), changes land there before they land in code.',
          weight: 0.4,
          scoreGuide: {
            zero:
              'New business terms appear in code but the glossary is untouched or missing.',
            five:
              'All new terms are documented except one or two that slipped in without glossary updates.',
            ten:
              'Every new or renamed domain concept is reflected in the glossary in the same PR.',
          },
        },
      ],
    },
    {
      id: 'r-ddd-aggregate-integrity',
      module: 'module-ddd',
      title: 'Aggregate integrity',
      description:
        'Aggregates own their invariants. Write operations go through the aggregate root and cannot leave it in a broken state.',
      criteria: [
        {
          id: 'aggregate-root-writes',
          title: 'Writes pass through the aggregate root',
          description:
            'Mutations happen via aggregate methods (`order.addLine(...)`), not by patching child entities directly.',
          weight: 0.6,
          scoreGuide: {
            zero:
              'Multiple call sites mutate child entities directly, bypassing the aggregate root. Invariants are not enforced anywhere.',
            five:
              'Most writes go through the root, with one or two legacy call sites reaching inside the aggregate.',
            ten:
              'Every write in the diff goes through an aggregate root method. Invariants are enforced in one place.',
          },
        },
        {
          id: 'invariant-centralization',
          title: 'Invariants live inside the aggregate',
          description:
            'Business invariants (e.g. "cart total matches sum of lines") are validated inside the aggregate, not by the UI or an external validator.',
          weight: 0.4,
          scoreGuide: {
            zero:
              'Invariant checks are sprinkled across the UI layer. The aggregate is a dumb container.',
            five:
              'Most invariants are inside the aggregate, with one or two defensive checks leaking into the UI.',
            ten:
              'All invariants live inside the aggregate. UI code never validates domain rules.',
          },
        },
      ],
    },
    {
      id: 'r-ddd-value-objects',
      module: 'module-ddd',
      title: 'Value Object discipline',
      description:
        'Primitive obsession is avoided through branded types or value objects with validation.',
      criteria: [
        {
          id: 'branded-types',
          title: 'Branded or opaque types replace raw primitives',
          description:
            'Domain identifiers and constrained values use branded types (e.g. `type UserId = string & { readonly __brand: unique symbol }`) instead of bare `string` or `number`.',
          weight: 0.5,
          scoreGuide: {
            zero:
              'Domain identifiers are bare `string` or `number` everywhere. A user ID can be accidentally passed where an order ID is expected.',
            five:
              'One or two domain identifiers still use bare primitives; the rest are branded or opaque.',
            ten:
              'Every domain identifier and constrained value uses a branded type or a value object class.',
          },
        },
        {
          id: 'smart-constructors',
          title: 'Value objects use smart constructors',
          description:
            'Value objects are created through factory functions that validate invariants, not raw object literals.',
          weight: 0.5,
          scoreGuide: {
            zero:
              'Value objects are created with plain object spread or direct property assignment. No validation at construction time.',
            five:
              'One or two value objects are constructed without validation; the rest use factory functions.',
            ten:
              'Every value object is created through a smart constructor that validates invariants and returns a Result.',
          },
        },
      ],
    },
    {
      id: 'r-ddd-anti-corruption-layer',
      module: 'module-ddd',
      title: 'Anti-Corruption Layer at API boundaries',
      description:
        'External data shapes do not leak into the domain. A mapper translates at the boundary.',
      criteria: [
        {
          id: 'api-boundary-mapping',
          title: 'API responses are mapped to domain types',
          description:
            'Every external API response passes through a mapper function before entering the domain.',
          weight: 0.6,
          scoreGuide: {
            zero:
              'API response types are used directly as domain types. Renaming a backend field breaks the domain.',
            five:
              'One or two API responses are used directly; the rest pass through mappers.',
            ten:
              'Every API response is mapped to a domain type through a dedicated mapper function.',
          },
        },
        {
          id: 'dto-isolation',
          title: 'DTOs do not cross the domain boundary',
          description:
            'External DTOs stay in the infrastructure layer and are never imported by domain or application code.',
          weight: 0.4,
          scoreGuide: {
            zero:
              'Domain code imports API response types directly from the infrastructure or generated client.',
            five:
              'One or two domain files import an external DTO type; the rest use domain types.',
            ten:
              'No domain or application file imports any DTO type. External shapes are confined to the infrastructure layer.',
          },
        },
      ],
    },
    {
      id: 'r-ddd-domain-events',
      module: 'module-ddd',
      title: 'Domain Event discipline',
      description:
        'Significant domain state changes are captured as domain events with rich context.',
      criteria: [
        {
          id: 'event-naming',
          title: 'Events are named in past tense',
          description:
            'Domain events use past-tense verb names (e.g. `OrderPlaced`, `UserRegistered`), not imperative commands.',
          weight: 0.4,
          scoreGuide: {
            zero:
              'Events are named as commands (`CreateOrder`, `RegisterUser`) or generic labels (`ORDER_EVENT`).',
            five:
              'One or two events use imperative naming; the rest are past tense.',
            ten:
              'Every domain event is named in past tense, clearly describing what happened.',
          },
        },
        {
          id: 'event-payload',
          title: 'Events carry sufficient context',
          description:
            'Event payloads include enough data for consumers to react without querying the source aggregate.',
          weight: 0.6,
          scoreGuide: {
            zero:
              'Events carry only an entity ID. Consumers must fetch the full entity to react, creating coupling.',
            five:
              'One or two events carry only IDs; the rest include relevant context data.',
            ten:
              'Every event payload includes all data a consumer needs to react without querying back.',
          },
        },
      ],
    },
    {
      id: 'r-ddd-bounded-context',
      module: 'module-ddd',
      title: 'Bounded Context isolation',
      description:
        'Each bounded context defines its own view of shared concepts. Types do not leak across context boundaries.',
      criteria: [
        {
          id: 'context-boundary-respect',
          title: 'No direct cross-context type imports',
          description:
            'Code in one bounded context does not import types from another context directly.',
          weight: 0.6,
          scoreGuide: {
            zero:
              'Multiple contexts import each other\'s domain types directly, creating tight coupling.',
            five:
              'One or two cross-context type imports exist as temporary shortcuts.',
            ten:
              'No context imports another context\'s domain types. Shared concepts use a shared kernel or anti-corruption layer.',
          },
        },
        {
          id: 'type-narrowing',
          title: 'Each context defines its own view of shared concepts',
          description:
            'When two contexts need the same concept (e.g. User), each defines its own minimal view rather than sharing the full type.',
          weight: 0.4,
          scoreGuide: {
            zero:
              'A single canonical type (e.g. `User` with 20 fields) is imported by every context, even when only 2-3 fields are needed.',
            five:
              'One or two contexts use the full canonical type; the rest define narrowed views.',
            ten:
              'Every context defines its own minimal view of shared concepts, importing nothing from other contexts.',
          },
        },
      ],
    },
  ];
}
