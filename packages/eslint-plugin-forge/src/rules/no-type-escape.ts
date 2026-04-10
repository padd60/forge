import type { TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../create-rule.js';

type Options = [];
type MessageIds = 'anyType' | 'tsIgnore' | 'nonNullAssertion' | 'doubleCast';

/**
 * Walk up the AST to find the nearest enclosing function-ish node
 * and return its name — or `undefined` if no exported scope is found.
 *
 * Only reports when the function is part of an export declaration,
 * mirroring the "exported surface only" philosophy used by
 * `no-boolean-flag-arg`.
 */
function enclosingExportedFnName(
  node: TSESTree.Node
): string | undefined {
  let current: TSESTree.Node | undefined = node.parent;

  while (current) {
    // export function foo(…) { … }
    if (
      current.type === 'FunctionDeclaration' &&
      current.parent?.type === 'ExportNamedDeclaration'
    ) {
      return current.id?.name ?? '(default)';
    }

    // export default function foo(…) { … }
    if (
      current.type === 'FunctionDeclaration' &&
      current.parent?.type === 'ExportDefaultDeclaration'
    ) {
      return current.id?.name ?? '(default)';
    }

    // export const foo = (…) => { … }  or  export const foo = function(…) { … }
    if (
      (current.type === 'ArrowFunctionExpression' ||
        current.type === 'FunctionExpression') &&
      current.parent?.type === 'VariableDeclarator' &&
      current.parent.parent?.type === 'VariableDeclaration' &&
      current.parent.parent.parent?.type === 'ExportNamedDeclaration'
    ) {
      const declarator = current.parent as TSESTree.VariableDeclarator;
      return declarator.id.type === 'Identifier'
        ? declarator.id.name
        : '(anonymous)';
    }

    current = current.parent;
  }

  return undefined;
}

/**
 * Detect `as unknown as T` — a TSAsExpression whose inner expression
 * is itself a TSAsExpression casting to `unknown`.
 */
function isDoubleCast(node: TSESTree.TSAsExpression): boolean {
  const inner = node.expression;
  if (inner.type !== 'TSAsExpression') return false;
  return inner.typeAnnotation.type === 'TSUnknownKeyword';
}

export const noTypeEscape = createRule<Options, MessageIds>({
  name: 'no-type-escape',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow TypeScript type safety escapes — any, @ts-ignore, non-null assertions, and double casts.',
    },
    schema: [],
    messages: {
      anyType:
        'Explicit `any` in exported "{{name}}" defeats type safety. Use `unknown` and narrow, or define a proper type.',
      tsIgnore:
        '`@ts-ignore` suppresses all errors. Use `@ts-expect-error` with an explanation if a type workaround is truly needed.',
      nonNullAssertion:
        'Non-null assertion `!` in exported "{{name}}" hides potential null values. Use a guard or optional chaining.',
      doubleCast:
        'Double cast `as unknown as T` in "{{name}}" bypasses type checking entirely. Refactor the types instead.',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      // --- @ts-ignore in any comment (always flagged) ---
      Program(): void {
        const sourceCode = context.sourceCode;
        for (const comment of sourceCode.getAllComments()) {
          if (/@ts-ignore\b/.test(comment.value)) {
            context.report({
              node: comment as unknown as TSESTree.Node,
              messageId: 'tsIgnore',
            });
          }
        }
      },

      // --- explicit `any` type annotation in exported functions ---
      TSTypeAnnotation(node: TSESTree.TSTypeAnnotation): void {
        if (node.typeAnnotation.type !== 'TSAnyKeyword') return;
        const fnName = enclosingExportedFnName(node);
        if (!fnName) return;

        context.report({
          node: node.typeAnnotation,
          messageId: 'anyType',
          data: { name: fnName },
        });
      },

      // --- `as any` type assertion in exported functions ---
      TSAsExpression(node: TSESTree.TSAsExpression): void {
        // Check double cast first (more specific)
        if (isDoubleCast(node)) {
          const fnName = enclosingExportedFnName(node);
          if (!fnName) return;
          context.report({
            node,
            messageId: 'doubleCast',
            data: { name: fnName },
          });
          return;
        }

        // `as any`
        if (node.typeAnnotation.type === 'TSAnyKeyword') {
          const fnName = enclosingExportedFnName(node);
          if (!fnName) return;
          context.report({
            node,
            messageId: 'anyType',
            data: { name: fnName },
          });
        }
      },

      // --- non-null assertion `foo!` in exported functions ---
      TSNonNullExpression(node: TSESTree.TSNonNullExpression): void {
        const fnName = enclosingExportedFnName(node);
        if (!fnName) return;
        context.report({
          node,
          messageId: 'nonNullAssertion',
          data: { name: fnName },
        });
      },
    };
  },
});
