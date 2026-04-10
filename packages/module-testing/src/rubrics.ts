import type { Rubric } from '@forge-kit-dev/schemas';

export function testingRubrics(): readonly Rubric[] {
  return [
    {
      id: 'r-testing-presence',
      module: 'module-testing',
      title: 'Test presence and quality',
      description: 'Every non-trivial module in the diff has a corresponding test with meaningful assertions.',
      criteria: [
        {
          id: 'test-exists',
          title: 'Tests exist for new code',
          description: 'Every non-trivial module added or modified in the diff has at least one corresponding test file.',
          weight: 0.4,
          scoreGuide: {
            zero: 'No test files are added or modified in the diff. The new code is entirely untested.',
            five: 'One or two non-trivial modules lack corresponding tests; the rest are covered.',
            ten: 'Every non-trivial module in the diff has a corresponding test file with at least one test case.',
          },
        },
        {
          id: 'assertion-quality',
          title: 'Tests use meaningful assertions',
          description: 'Tests assert on behavior and output, not just that code runs without throwing.',
          weight: 0.3,
          scoreGuide: {
            zero: 'Tests use only snapshot assertions or `expect(result).toBeDefined()`. No behavioral checks.',
            five: 'One or two tests rely solely on snapshots or existence checks; the rest have behavioral assertions.',
            ten: 'Every test asserts on specific expected behavior, values, or state transitions.',
          },
        },
        {
          id: 'error-path-coverage',
          title: 'Error paths are tested',
          description: 'Tests cover not just the happy path but also error cases and edge conditions.',
          weight: 0.3,
          scoreGuide: {
            zero: 'Only happy-path scenarios are tested. No error, edge-case, or boundary-condition tests exist.',
            five: 'One or two error paths are tested; other important failure modes are missing.',
            ten: 'Every function with error handling has tests for both success and failure paths.',
          },
        },
      ],
    },
    {
      id: 'r-testing-naming',
      module: 'module-testing',
      title: 'Test naming and structure',
      description: 'Test names describe behavior and tests follow a clear Arrange-Act-Assert structure.',
      criteria: [
        {
          id: 'behavior-describes',
          title: 'Test names describe behavior, not implementation',
          description: 'Test names read as behavior specifications that survive refactoring.',
          weight: 0.6,
          scoreGuide: {
            zero: 'Tests are named after implementation details (`it("calls fetchUser")`, `it("renders component")`). Renaming an internal function would break the test name.',
            five: 'One or two tests are named after implementation; the rest describe behavior.',
            ten: 'Every test name describes what the user or system experiences (`it("shows error when email is invalid")`).',
          },
        },
        {
          id: 'arrangement-clarity',
          title: 'Tests follow Arrange-Act-Assert structure',
          description: 'Each test has clearly separated setup, action, and assertion phases.',
          weight: 0.4,
          scoreGuide: {
            zero: 'Tests intermix setup, actions, and assertions throughout. It is unclear what is being tested.',
            five: 'One or two tests have unclear structure; the rest follow Arrange-Act-Assert.',
            ten: 'Every test has a clear Arrange-Act-Assert (or Given-When-Then) structure, optionally separated by blank lines or comments.',
          },
        },
      ],
    },
  ];
}
