import { isAbsolute, posix, resolve } from 'node:path';

import { createRule } from '../create-rule.js';
import {
  detectSliceLocation,
  isCrossSlice,
  isUpwardImport,
  type SliceLocation,
} from '../layer.js';

/**
 * Figure out the project root from an absolute file path by locating
 * the last `/<srcRoot>/` segment in it. This removes the rule's
 * dependency on `context.cwd`, which can differ between test runners,
 * IDE linters, and CI environments. When no `srcRoot` segment exists
 * (e.g. a Next.js route file at the repo root, or an unrelated
 * config file), we return `null` and the rule bails out — those files
 * have no FSD meaning so we don't want to enforce anything on them.
 */
function findProjectRootFromFile(
  absFile: string,
  srcRoot: string
): string | null {
  const posixFile = absFile.split(/[\\/]/).join('/');
  const needle = `/${srcRoot}/`;
  const idx = posixFile.lastIndexOf(needle);
  if (idx === -1) return null;
  return posixFile.slice(0, idx);
}

type Options = [
  {
    srcRoot?: string;
    alias?: string;
  },
];
type MessageIds = 'upwardImport' | 'siblingSlice' | 'nonPublicApi';

interface ResolvedImport {
  /** POSIX path relative to the project root. Never absolute. */
  relPath: string;
  /** Whether the original specifier pointed *into* the slice's body. */
  reachesIntoSlice: boolean;
}

/**
 * Resolve an import specifier to a repo-root-relative POSIX path and
 * remember whether the specifier reached into slice internals.
 *
 * We handle three specifier shapes:
 *   - relative (`./foo`, `../bar`)
 *   - alias (`@/features/auth-login`, default `@` → `<srcRoot>`)
 *   - bare (`react`, `zod`) → returns `null`
 *
 * tsconfig-paths-style resolution with multiple aliases is out of
 * scope for v0.1 — the single-alias contract keeps the rule zero-dep
 * and fast enough for pre-commit.
 */
function resolveImport(
  specifier: string,
  fromAbsPath: string,
  projectRoot: string,
  srcRoot: string,
  alias: string
): ResolvedImport | null {
  let targetAbs: string;
  let reachesIntoSlice = false;

  if (specifier.startsWith('.')) {
    const fromDir = posix.dirname(toPosix(fromAbsPath));
    targetAbs = posix.resolve(fromDir, specifier);
    // For relative imports we conservatively assume the author knows
    // what they are doing; "reachesIntoSlice" is decided later by
    // comparing against the slice's index path.
    reachesIntoSlice = true;
  } else if (specifier === alias || specifier.startsWith(`${alias}/`)) {
    const tail = specifier === alias ? '' : specifier.slice(alias.length + 1);
    targetAbs = posix.join(toPosix(projectRoot), srcRoot, tail);
    // An alias like `@/features/auth-login` that stops at the slice
    // root is the *public API* form. Anything deeper is reaching in.
    reachesIntoSlice = tail.split('/').filter(Boolean).length > 2;
  } else {
    return null;
  }

  const rel = posix.relative(toPosix(projectRoot), targetAbs);
  if (rel.startsWith('..') || isAbsolute(rel)) return null;
  return { relPath: rel, reachesIntoSlice };
}

function toPosix(p: string): string {
  return p.split(/[\\/]/).join('/');
}

/**
 * A cross-slice import is legal only when it targets the slice's
 * public API. That means either:
 *   - the specifier ends exactly at the slice root (e.g.
 *     `@/features/auth-login`), or
 *   - the specifier ends at `<sliceRoot>/index.(ts|tsx|js|jsx)`.
 *
 * Anything else reaches into private files.
 */
function importsSlicePublicApi(
  specifierRel: string,
  targetSlice: SliceLocation
): boolean {
  if (targetSlice.slice === null) return true; // shared / layer root
  const normalized = specifierRel.replace(/\.[tj]sx?$/, '');
  const sliceRoot = targetSlice.root;
  if (normalized === sliceRoot) return true;
  if (normalized === `${sliceRoot}/index`) return true;
  return false;
}

export const fsdSliceBoundary = createRule<Options, MessageIds>({
  name: 'fsd-slice-boundary',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce FSD layer direction, same-layer slice isolation, and public-API access.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          srcRoot: { type: 'string' },
          alias: { type: 'string' },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      upwardImport:
        'FSD violation: "{{fromLayer}}/" imports from "{{toLayer}}/". Layer order is strict — higher layers may import lower, never the reverse.',
      siblingSlice:
        'FSD violation: slice "{{fromSlice}}" imports sibling slice "{{toSlice}}" directly. Move shared code up a layer or refactor the dependency.',
      nonPublicApi:
        'FSD violation: import reaches into slice internals. Import only from "{{slicePublic}}".',
    },
  },
  defaultOptions: [{ srcRoot: 'src', alias: '@' }],
  create(context, [opts]) {
    const srcRoot = opts.srcRoot ?? 'src';
    const alias = opts.alias ?? '@';

    const fromAbs = resolve(context.filename);
    const projectRoot = findProjectRootFromFile(fromAbs, srcRoot);
    if (!projectRoot) return {};

    const fromRel = posix
      .relative(projectRoot, fromAbs.split(/[\\/]/).join('/'));
    const fromLocation = detectSliceLocation(fromRel, { srcRoot });

    // If the file isn't in the FSD tree (e.g. Next.js route file at
    // repo root, or a config file), we have nothing to enforce.
    if (!fromLocation) return {};

    return {
      ImportDeclaration(node) {
        const specifier = node.source.value;
        if (typeof specifier !== 'string') return;

        const resolved = resolveImport(
          specifier,
          fromAbs,
          projectRoot,
          srcRoot,
          alias
        );
        if (!resolved) return;

        const targetLocation = detectSliceLocation(resolved.relPath, {
          srcRoot,
        });
        if (!targetLocation) return;

        // Check 1 — upward import (higher layer importing lower-order).
        if (isUpwardImport(fromLocation.layer, targetLocation.layer)) {
          context.report({
            node: node.source,
            messageId: 'upwardImport',
            data: {
              fromLayer: fromLocation.layer,
              toLayer: targetLocation.layer,
            },
          });
          return;
        }

        // Check 2 — same layer, different slice.
        if (isCrossSlice(fromLocation, targetLocation)) {
          context.report({
            node: node.source,
            messageId: 'siblingSlice',
            data: {
              fromSlice: fromLocation.slice ?? '(layer root)',
              toSlice: targetLocation.slice ?? '(layer root)',
            },
          });
          return;
        }

        // Check 3 — cross-slice imports must hit the slice public API.
        const crossingSliceBoundary =
          fromLocation.slice !== targetLocation.slice ||
          fromLocation.layer !== targetLocation.layer;
        if (
          crossingSliceBoundary &&
          targetLocation.slice !== null &&
          resolved.reachesIntoSlice &&
          !importsSlicePublicApi(resolved.relPath, targetLocation)
        ) {
          context.report({
            node: node.source,
            messageId: 'nonPublicApi',
            data: {
              slicePublic: `${targetLocation.root}/index.ts`,
            },
          });
        }
      },
    };
  },
});
