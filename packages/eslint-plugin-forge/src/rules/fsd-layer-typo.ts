import { createRule } from '../create-rule.js';

type Options = [];
type MessageIds = 'layerTypo';

/**
 * Map of common singular-form typos to the correct FSD plural-form
 * layer directory. Only the most likely mistakes are included — adding
 * more can be done without a breaking change.
 */
const LAYER_TYPOS: ReadonlyMap<string, string> = new Map([
  ['/feature/', '/features/'],
  ['/entity/', '/entities/'],
  ['/page/', '/pages/'],
  ['/widget/', '/widgets/'],
]);

function toPosix(p: string): string {
  return p.split(/[\\/]/).join('/');
}

export const fsdLayerTypo = createRule<Options, MessageIds>({
  name: 'fsd-layer-typo',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Detect singular-form typos of FSD layer directory names ' +
        '(e.g. `feature/` instead of `features/`).',
    },
    schema: [],
    messages: {
      layerTypo:
        'Directory "{{actual}}" looks like a misspelled FSD layer. Did you mean "{{expected}}"?',
    },
  },
  defaultOptions: [],
  create(context) {
    const posixName = toPosix(context.filename);

    // Find the first matching typo in the file path.
    let actual: string | undefined;
    let expected: string | undefined;

    for (const [typo, correction] of LAYER_TYPOS) {
      if (posixName.includes(typo)) {
        actual = typo.slice(1, -1); // strip surrounding slashes
        expected = correction.slice(1, -1);
        break;
      }
    }

    if (!actual || !expected) return {};

    return {
      // Report once per file on the Program node.
      Program(node) {
        context.report({
          node,
          messageId: 'layerTypo',
          data: { actual, expected },
        });
      },
    };
  },
});
