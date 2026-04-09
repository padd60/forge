import type { TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../create-rule.js';

type Options = [{ entityPathPattern?: string }];
type MessageIds = 'missingId';

const DEFAULT_ENTITY_PATH = '/entities/';

/**
 * Detect whether the current file is inside an FSD `entities/` folder
 * (or whatever path pattern the user configures). This is the
 * primary signal forge uses to decide "this type is an entity".
 */
function isEntityFile(filename: string, pattern: string): boolean {
  const posixName = filename.split(/[\\/]/).join('/');
  return posixName.includes(pattern);
}

/**
 * Does the JSDoc block immediately above this node contain `@entity`?
 * This is the fallback signal: a user can mark a type as an entity
 * outside the default path by annotating it explicitly.
 */
function hasEntityJSDoc(
  node: TSESTree.Node,
  sourceCode: {
    getCommentsBefore: (node: TSESTree.Node) => TSESTree.Comment[];
  }
): boolean {
  const comments = sourceCode.getCommentsBefore(node);
  return comments.some(
    (c) => c.type === 'Block' && /@entity\b/.test(c.value)
  );
}

function hasIdMember(
  members: readonly TSESTree.TypeElement[]
): boolean {
  return members.some((member) => {
    if (member.type !== 'TSPropertySignature') return false;
    if (member.key.type !== 'Identifier') return false;
    return member.key.name === 'id';
  });
}

export const dddEntityId = createRule<Options, MessageIds>({
  name: 'ddd-entity-id',
  meta: {
    type: 'problem',
    docs: {
      description:
        "Require an `id` field on types declared as DDD entities (by path or @entity JSDoc).",
    },
    schema: [
      {
        type: 'object',
        properties: { entityPathPattern: { type: 'string' } },
        additionalProperties: false,
      },
    ],
    messages: {
      missingId:
        'Entity type "{{name}}" is missing an `id` field. DDD entities must be identifiable.',
    },
  },
  defaultOptions: [{ entityPathPattern: DEFAULT_ENTITY_PATH }],
  create(context, [opts]) {
    const pattern = opts.entityPathPattern ?? DEFAULT_ENTITY_PATH;
    const sourceCode = context.sourceCode;

    /**
     * Decide whether a given type declaration should be treated as
     * an entity, and check whether it has the required `id` field.
     */
    function check(
      node:
        | TSESTree.TSInterfaceDeclaration
        | TSESTree.TSTypeAliasDeclaration,
      members: readonly TSESTree.TypeElement[] | null
    ): void {
      const byPath = isEntityFile(context.filename, pattern);
      const byJSDoc = hasEntityJSDoc(node, sourceCode);
      if (!byPath && !byJSDoc) return;
      if (members === null) return; // non-object type alias, skip
      if (hasIdMember(members)) return;
      context.report({
        node,
        messageId: 'missingId',
        data: { name: node.id.name },
      });
    }

    return {
      TSInterfaceDeclaration(node) {
        check(node, node.body.body);
      },
      TSTypeAliasDeclaration(node) {
        if (node.typeAnnotation.type !== 'TSTypeLiteral') {
          // Only plain object literal aliases are checkable by syntax;
          // intersections, generics, and imports are skipped.
          return;
        }
        check(node, node.typeAnnotation.members);
      },
    };
  },
});
