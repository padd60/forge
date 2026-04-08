import type { Rubric } from '@forge/schemas';

/**
 * Clean Code rubrics. The five criteria below are the advisory half
 * of the "Top 15 rules" described in the plan — they cannot be
 * enforced mechanically without turning into a sea of false positives,
 * so they are scored by the Evaluator and surfaced as advice.
 *
 * Kent Beck's "4 rules of simple design" (Clean Code ch. 12) shape
 * the weights: code that passes tests + removes duplication + reveals
 * intent + is minimal should land near a 10 total.
 */
export function cleanCodeRubrics(): readonly Rubric[] {
  return [
    {
      id: 'r-clean-code-intent',
      module: 'module-clean-code',
      title: 'Intent-revealing names',
      description:
        'Names tell the reader *why* the code exists, not *what* type it has.',
      criteria: [
        {
          id: 'intent-variable',
          title: 'Variables reveal intent',
          description:
            'Local variables and hook returns explain their role in one breath.',
          weight: 0.5,
          scoreGuide: {
            zero:
              'Variables are named `data`, `info`, `tmp`, `value` — no hint at their purpose.',
            five:
              'Most variables are descriptive, with a handful of `data`/`info` leftovers.',
            ten:
              'Every variable name answers "what does this hold and why".',
          },
        },
        {
          id: 'intent-function',
          title: 'Functions reveal action',
          description:
            'Exported functions are named after the action they perform, not by type.',
          weight: 0.5,
          scoreGuide: {
            zero:
              'Functions named after types or adjectives (`userHelper`, `dataValidator`).',
            five:
              'Most functions are verbs, but a few are noun phrases.',
            ten:
              'Every exported function name is a verb phrase.',
          },
        },
      ],
    },
    {
      id: 'r-clean-code-srp',
      module: 'module-clean-code',
      title: 'Single Responsibility at component scope',
      description:
        'Each component/hook has exactly one reason to change.',
      criteria: [
        {
          id: 'srp-change-reasons',
          title: 'One reason to change',
          description:
            'When you imagine the next bug report, does one module own it? Or would several have to change?',
          weight: 0.6,
          scoreGuide: {
            zero:
              'A single component owns UI, data fetching, state, and formatting — any of four change reasons modifies it.',
            five:
              'Most components are focused, with one offender that should be split.',
            ten:
              'Every component has one reason to change. Data lives in hooks, UI in components, formatting in pure helpers.',
          },
        },
        {
          id: 'srp-hook-extraction',
          title: 'Custom hook extraction',
          description:
            'Reusable state/effect logic is lifted into a `useX` hook before it appears in a second component.',
          weight: 0.4,
          scoreGuide: {
            zero:
              'The same `useState + useEffect` pattern is duplicated across several components.',
            five:
              'Most patterns are extracted, with one obvious duplicate left.',
            ten:
              'Every repeated state/effect pattern lives in a single custom hook.',
          },
        },
      ],
    },
    {
      id: 'r-clean-code-boundary',
      module: 'module-clean-code',
      title: 'Explicit failure boundaries',
      description:
        'Error handling uses explicit types, not null sentinels or swallowed exceptions.',
      criteria: [
        {
          id: 'no-null-returns',
          title: 'No null returns',
          description:
            'Public functions return either a value or throw, never `null`. `Result<T, E>` patterns are welcome.',
          weight: 0.5,
          scoreGuide: {
            zero:
              'Public functions return `T | null` and callers `if (result)` everywhere.',
            five:
              'A few legacy null returns remain, the rest use Result/throw.',
            ten:
              'No null returns in the diff. Success and failure are both first-class.',
          },
        },
        {
          id: 'no-silent-catch',
          title: 'No silent catches',
          description:
            'Caught errors are logged, rethrown, or converted to a typed Result — never discarded.',
          weight: 0.5,
          scoreGuide: {
            zero:
              'Multiple `catch {}` blocks silently swallow errors.',
            five:
              'One swallowed catch remains as a legitimate fallback but is documented.',
            ten:
              'Every catch either throws, logs with context, or returns a typed failure.',
          },
        },
      ],
    },
  ];
}
