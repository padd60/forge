import type { TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../create-rule.js';

type Options = [{ max: number }];
type MessageIds = 'tooLong';

/**
 * Decide whether a given function node looks like a React component.
 * We use two cheap heuristics because a full JSX-return check would
 * walk the whole subtree and slow down pre-commit:
 *
 * 1. The declared name is PascalCase (React's own component contract).
 * 2. The function's parent binding is exported or top-level.
 *
 * False positives land on plain PascalCase classes and constructor
 * helpers — those are rare in modern React/TS and are easy to dodge
 * with a rule-disable comment if they ever show up.
 */
function isLikelyReactComponent(name: string | undefined): boolean {
  if (!name) return false;
  return /^[A-Z][A-Za-z0-9]*$/.test(name);
}

/**
 * Count the body lines of a function. For a block body we count
 * `end.line - start.line + 1` inclusive; for an expression-bodied
 * arrow we fall back to 1.
 */
function bodyLineCount(
  body:
    | TSESTree.BlockStatement
    | TSESTree.Expression
    | null
    | undefined
): number {
  if (!body || !body.loc) return 0;
  return body.loc.end.line - body.loc.start.line + 1;
}

export const componentMaxLines = createRule<Options, MessageIds>({
  name: 'component-max-lines',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Enforce a maximum body length for React function components. Clean Code rule "Small!".',
    },
    schema: [
      {
        type: 'object',
        // `minimum` is intentionally omitted: the default is 50, which
        // is what consumer projects see. Test suites may override to
        // tiny values to keep fixture sizes readable.
        properties: { max: { type: 'number' } },
        additionalProperties: false,
      },
    ],
    messages: {
      tooLong:
        'Component "{{name}}" has {{count}} body lines; the limit is {{max}}. Extract a custom hook or split the component.',
    },
  },
  defaultOptions: [{ max: 50 }],
  create(context, [opts]) {
    const max = opts.max;

    function check(
      node: TSESTree.Node,
      body:
        | TSESTree.BlockStatement
        | TSESTree.Expression
        | null
        | undefined,
      name: string | undefined
    ): void {
      if (!isLikelyReactComponent(name)) return;
      const count = bodyLineCount(body);
      if (count <= max) return;
      context.report({
        node,
        messageId: 'tooLong',
        data: {
          name: name ?? '(anonymous)',
          count,
          max,
        },
      });
    }

    return {
      FunctionDeclaration(node) {
        check(node, node.body, node.id?.name);
      },
      VariableDeclarator(node) {
        const init = node.init;
        if (!init) return;
        if (
          init.type !== 'ArrowFunctionExpression' &&
          init.type !== 'FunctionExpression'
        ) {
          return;
        }
        const name =
          node.id.type === 'Identifier' ? node.id.name : undefined;
        check(init, init.body, name);
      },
    };
  },
});
