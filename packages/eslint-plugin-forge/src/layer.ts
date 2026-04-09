/**
 * FSD layer detection used by both the `fsd-slice-boundary` ESLint rule
 * and `@forge-kit-dev/module-fsd`. The canonical copy lives here because the
 * rule needs it and rules must not reach into module packages; the
 * module re-exports these helpers through its own `./layer` facade.
 *
 * Keep this file dependency-free — it runs inside ESLint where loading
 * anything beyond `node:path` bloats lint time noticeably.
 */
import { posix } from 'node:path';

export const FSD_LAYERS = [
  'app',
  'pages',
  'widgets',
  'features',
  'entities',
  'shared',
] as const;

export type FsdLayer = (typeof FSD_LAYERS)[number];

export function layerOrder(layer: FsdLayer): number {
  return FSD_LAYERS.indexOf(layer);
}

export interface SliceLocation {
  layer: FsdLayer;
  slice: string | null;
  root: string;
}

export interface DetectOptions {
  srcRoot?: string;
}

export function isFsdLayer(value: string): value is FsdLayer {
  return (FSD_LAYERS as readonly string[]).includes(value);
}

export function detectSliceLocation(
  relFromRepoRoot: string,
  options: DetectOptions = {}
): SliceLocation | null {
  const srcRoot = options.srcRoot ?? 'src';
  const normalized = posix
    .normalize(relFromRepoRoot.replace(/\\/g, '/'))
    .replace(/^\.\//, '');
  const srcPrefix = `${srcRoot}/`;
  if (!normalized.startsWith(srcPrefix)) return null;
  const insideSrc = normalized.slice(srcPrefix.length);
  const parts = insideSrc.split('/').filter(Boolean);
  const [layerCandidate, second, ...rest] = parts;
  if (!layerCandidate || !isFsdLayer(layerCandidate)) return null;
  const layer: FsdLayer = layerCandidate;
  if (layer === 'shared') {
    return { layer, slice: null, root: posix.join(srcRoot, layer) };
  }
  if (!second) {
    return { layer, slice: null, root: posix.join(srcRoot, layer) };
  }
  // A file placed directly under the layer root (e.g. `features/index.ts`)
  // is not a slice; slices are always directories. We recognize this by
  // checking whether `second` looks like a file (has an extension) while
  // there are no further path segments.
  const secondIsFile = /\.[a-z0-9]+$/i.test(second) && rest.length === 0;
  if (secondIsFile) {
    return { layer, slice: null, root: posix.join(srcRoot, layer) };
  }
  return {
    layer,
    slice: second,
    root: posix.join(srcRoot, layer, second),
  };
}

export function isUpwardImport(source: FsdLayer, target: FsdLayer): boolean {
  return layerOrder(target) < layerOrder(source);
}

export function isCrossSlice(
  source: SliceLocation,
  target: SliceLocation
): boolean {
  if (source.layer !== target.layer) return false;
  if (source.slice === null || target.slice === null) return false;
  return source.slice !== target.slice;
}
