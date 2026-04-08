import type { TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../create-rule';

type Options = [];
type MessageIds = 'entitiesMustBeReadonly' | 'featuresOwnCommands';

const ENTITIES_PATH = '/src/entities/';

/**
 * A conservative list of action-verb prefixes that forge treats as
 * "command" names when deciding whether a function inside `entities/`
 * has crossed into the write side. The list intentionally stops at
 * common vocabulary — if a project needs extra verbs it can wrap this
 * rule in a custom config override.
 */
const COMMAND_PREFIXES = [
  'create',
  'update',
  'delete',
  'submit',
  'save',
  'remove',
  'add',
  'reset',
  'patch',
  'destroy',
  'cancel',
  'set',
  'toggle',
  'mutate',
] as const;

function normalize(filename: string): string {
  return filename.split(/[\\/]/).join('/');
}

function isEntitiesFile(filename: string): boolean {
  return normalize(filename).includes(ENTITIES_PATH);
}

function hasCommandName(name: string): boolean {
  for (const prefix of COMMAND_PREFIXES) {
    if (!name.startsWith(prefix)) continue;
    if (name.length === prefix.length) continue;
    const nextChar = name.charAt(prefix.length);
    // A command prefix must be followed by an upper-case letter so
    // that `additional` or `setter` aren't false positives for
    // `add` and `set`.
    if (nextChar >= 'A' && nextChar <= 'Z') return true;
  }
  return false;
}

function allPropertiesReadonly(
  members: readonly TSESTree.TypeElement[]
): boolean {
  return members.every((member) => {
    if (member.type !== 'TSPropertySignature') return true;
    return member.readonly === true;
  });
}

export const cqrsLayerRole = createRule<Options, MessageIds>({
  name: 'cqrs-layer-role',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce forge CQRS mapping: entities layer is read-only, features layer owns commands.',
    },
    schema: [],
    messages: {
      entitiesMustBeReadonly:
        'Entities export "{{name}}" has at least one non-readonly property. The entities layer is the read model — every property must be `readonly`.',
      featuresOwnCommands:
        'Command export "{{name}}" is declared in entities/. Commands must live in features/.',
    },
  },
  defaultOptions: [],
  create(context) {
    if (!isEntitiesFile(context.filename)) return {};

    return {
      'ExportNamedDeclaration > TSInterfaceDeclaration'(
        node: TSESTree.TSInterfaceDeclaration
      ) {
        if (!allPropertiesReadonly(node.body.body)) {
          context.report({
            node,
            messageId: 'entitiesMustBeReadonly',
            data: { name: node.id.name },
          });
        }
      },
      'ExportNamedDeclaration > TSTypeAliasDeclaration'(
        node: TSESTree.TSTypeAliasDeclaration
      ) {
        if (node.typeAnnotation.type !== 'TSTypeLiteral') return;
        if (!allPropertiesReadonly(node.typeAnnotation.members)) {
          context.report({
            node,
            messageId: 'entitiesMustBeReadonly',
            data: { name: node.id.name },
          });
        }
      },
      'ExportNamedDeclaration > FunctionDeclaration'(
        node: TSESTree.FunctionDeclaration
      ) {
        const name = node.id?.name;
        if (name && hasCommandName(name)) {
          context.report({
            node,
            messageId: 'featuresOwnCommands',
            data: { name },
          });
        }
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
        const name =
          node.id.type === 'Identifier' ? node.id.name : undefined;
        if (name && hasCommandName(name)) {
          context.report({
            node,
            messageId: 'featuresOwnCommands',
            data: { name },
          });
        }
      },
    };
  },
});
