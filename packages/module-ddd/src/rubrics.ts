import type { Rubric } from '@forge/schemas';

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
              'Most new terms are documented, but a couple slipped in without glossary updates.',
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
  ];
}
