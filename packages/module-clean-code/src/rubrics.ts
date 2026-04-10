import type { Rubric } from '@forge-kit-dev/schemas';

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
              'Most variables are descriptive, with one or two `data`/`info` leftovers.',
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
              'All exported functions are verbs except one or two noun phrases.',
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
              'All components have a single responsibility except one that should be split.',
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
              'One or two legacy null returns remain; the rest use Result/throw.',
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
    {
      id: 'r-clean-code-type-safety',
      module: 'module-clean-code',
      title: 'TypeScript type safety',
      description:
        'The diff avoids type escapes that undermine the type system.',
      criteria: [
        {
          id: 'no-any-escape',
          title: 'No any or type assertion escapes',
          description:
            'The diff contains no `any` annotations, `as` casts, `@ts-ignore`, or `@ts-expect-error`.',
          weight: 0.5,
          scoreGuide: {
            zero:
              'Multiple `any` types, `as` casts, or `@ts-ignore` comments appear in the diff. The type system is routinely bypassed.',
            five:
              'One or two type escapes remain as documented workarounds with explanatory comments.',
            ten:
              'No type escapes in the diff. Every value is properly typed or narrowed.',
          },
        },
        {
          id: 'discriminated-unions',
          title: 'Discriminated unions over class hierarchies',
          description:
            'Conditional logic uses discriminated unions with exhaustive switch/match, not class inheritance chains.',
          weight: 0.5,
          scoreGuide: {
            zero:
              'Multiple if/else chains check `instanceof` or string comparisons without a discriminant field. Adding a variant requires touching every consumer.',
            five:
              'One or two conditional branches use manual type checks instead of a discriminant field.',
            ten:
              'Every variant type uses a discriminant field and every switch is exhaustive (unreachable default or `never` check).',
          },
        },
      ],
    },
    {
      id: 'r-clean-code-effect-management',
      module: 'module-clean-code',
      title: 'Explicit effect management',
      description:
        'Fallible operations return typed results instead of throwing or returning null.',
      criteria: [
        {
          id: 'result-types',
          title: 'Result types for fallible operations',
          description:
            'Functions that can fail return a `Result<T, E>`, `Either`, or a discriminated success/failure union.',
          weight: 0.5,
          scoreGuide: {
            zero:
              'Fallible operations throw exceptions as their primary error signaling mechanism. Callers must guess what to catch.',
            five:
              'One or two fallible operations still throw; the rest return typed results.',
            ten:
              'Every fallible operation in the diff returns a typed result. Callers handle both paths explicitly.',
          },
        },
        {
          id: 'no-domain-throws',
          title: 'No throws in the domain layer',
          description:
            'Domain logic communicates failure through return values, not exceptions.',
          weight: 0.5,
          scoreGuide: {
            zero:
              'Domain functions throw exceptions for business rule violations (e.g. `throw new InsufficientFundsError()`).',
            five:
              'One domain function still throws for a business rule violation; the rest return typed failures.',
            ten:
              'No domain function throws. All business rule violations are returned as typed failure values.',
          },
        },
      ],
    },
  ];
}
