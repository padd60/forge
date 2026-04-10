import { createRule } from '../create-rule.js';

type Options = [];
type MessageIds = 'wildcardReexport';

/** FSD layer directories where the rule fires. */
const FSD_LAYER_SEGMENTS = [
  '/features/',
  '/entities/',
  '/shared/',
  '/widgets/',
  '/pages/',
  '/app/',
] as const;

function toPosix(p: string): string {
  return p.split(/[\\/]/).join('/');
}

function isInsideFsdLayer(filePath: string): boolean {
  const posixPath = toPosix(filePath);
  return FSD_LAYER_SEGMENTS.some((seg) => posixPath.includes(seg));
}

export const fsdNoWildcardReexport = createRule<Options, MessageIds>({
  name: 'fsd-no-wildcard-reexport',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow wildcard re-exports (`export * from`) inside FSD slices. ' +
        'They damage discoverability and may accidentally expose internal details.',
    },
    schema: [],
    messages: {
      wildcardReexport:
        'Wildcard re-export `export *` in "{{file}}" may leak internal implementation details. Use explicit named re-exports instead.',
    },
  },
  defaultOptions: [],
  create(context) {
    const posixName = toPosix(context.filename);

    // Only enforce inside FSD layer directories.
    if (!isInsideFsdLayer(posixName)) return {};

    return {
      ExportAllDeclaration(node) {
        // `export * from '...'` — flagged.
        // `export * as ns from '...'` — also uses ExportAllDeclaration
        // with `node.exported`, still a wildcard barrel; flag it too.
        context.report({
          node,
          messageId: 'wildcardReexport',
          data: {
            file: posixName.split('/').pop() ?? posixName,
          },
        });
      },
    };
  },
});
