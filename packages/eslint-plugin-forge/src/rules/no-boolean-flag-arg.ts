import type { TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../create-rule.js';

type Options = [];
type MessageIds = 'flagArgument';

/**
 * Detect parameters whose TypeScript annotation is the literal
 * `boolean` type. Unions like `boolean | undefined`, object-style
 * options, or enum types are not flagged — those are usually genuine
 * data, not Martin-style flags.
 *
 * The rule only fires on the **exported** surface of a file. Internal
 * helpers may still take booleans because refactoring them is a
 * localized concern; the flag-argument anti-pattern that Clean Code
 * warns about is really about *public API shape*.
 */
function isBooleanAnnotation(param: TSESTree.Parameter): boolean {
  if (param.type !== 'Identifier') return false;
  const annotation = param.typeAnnotation?.typeAnnotation;
  if (!annotation) return false;
  return annotation.type === 'TSBooleanKeyword';
}

function paramName(param: TSESTree.Parameter): string {
  if (param.type === 'Identifier') return param.name;
  return '(param)';
}

/**
 * Extract the "function-ish" name that belongs in the error message.
 * Handles `export function foo`, `export const foo = (...)`, and
 * `export default function foo(...)`.
 */
function declarationName(
  node:
    | TSESTree.FunctionDeclaration
    | TSESTree.ArrowFunctionExpression
    | TSESTree.FunctionExpression
    | TSESTree.VariableDeclarator
): string {
  if (
    node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression'
  ) {
    return node.id?.name ?? '(default)';
  }
  if (node.type === 'VariableDeclarator') {
    return node.id.type === 'Identifier' ? node.id.name : '(anonymous)';
  }
  return '(anonymous)';
}

export const noBooleanFlagArg = createRule<Options, MessageIds>({
  name: 'no-boolean-flag-arg',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow boolean parameters in exported functions — split into two functions instead.',
    },
    schema: [],
    messages: {
      flagArgument:
        'Boolean parameter "{{param}}" in exported "{{fn}}" is a flag argument. Split the function into two single-purpose functions.',
    },
  },
  defaultOptions: [],
  create(context) {
    function checkParams(
      params: readonly TSESTree.Parameter[],
      fnName: string,
      reporter: TSESTree.Node
    ): void {
      for (const param of params) {
        if (isBooleanAnnotation(param)) {
          context.report({
            node: reporter,
            messageId: 'flagArgument',
            data: {
              param: paramName(param),
              fn: fnName,
            },
          });
        }
      }
    }

    return {
      'ExportNamedDeclaration > FunctionDeclaration'(
        node: TSESTree.FunctionDeclaration
      ) {
        checkParams(node.params, declarationName(node), node);
      },
      'ExportDefaultDeclaration > FunctionDeclaration'(
        node: TSESTree.FunctionDeclaration
      ) {
        checkParams(
          node.params,
          node.id?.name ?? 'default export',
          node
        );
      },
      'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator'(
        node: TSESTree.VariableDeclarator
      ) {
        const init = node.init;
        if (!init) return;
        if (
          init.type !== 'ArrowFunctionExpression' &&
          init.type !== 'FunctionExpression'
        ) {
          return;
        }
        checkParams(init.params, declarationName(node), init);
      },
    };
  },
});
