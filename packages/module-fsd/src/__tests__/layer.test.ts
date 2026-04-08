import { describe, expect, it } from 'vitest';
import {
  FSD_LAYERS,
  detectSliceLocation,
  isCrossSlice,
  isFsdLayer,
  isUpwardImport,
  layerOrder,
} from '../layer';

describe('FSD_LAYERS order', () => {
  it('starts with app and ends with shared', () => {
    expect(FSD_LAYERS[0]).toBe('app');
    expect(FSD_LAYERS[FSD_LAYERS.length - 1]).toBe('shared');
  });

  it('has distinct, monotonically increasing layer orders', () => {
    const orders = FSD_LAYERS.map((l) => layerOrder(l));
    expect(new Set(orders).size).toBe(FSD_LAYERS.length);
    for (let i = 1; i < orders.length; i++) {
      expect(orders[i]).toBeGreaterThan(orders[i - 1] ?? -1);
    }
  });
});

describe('isFsdLayer', () => {
  it('recognizes valid layer names', () => {
    expect(isFsdLayer('features')).toBe(true);
    expect(isFsdLayer('shared')).toBe(true);
  });

  it('rejects unknown names', () => {
    expect(isFsdLayer('feature')).toBe(false);
    expect(isFsdLayer('utils')).toBe(false);
  });
});

describe('detectSliceLocation', () => {
  it('detects a slice inside a layer', () => {
    const loc = detectSliceLocation('src/features/auth-login/ui/form.tsx');
    expect(loc).toEqual({
      layer: 'features',
      slice: 'auth-login',
      root: 'src/features/auth-login',
    });
  });

  it('treats shared as sliceless even when nested', () => {
    const loc = detectSliceLocation('src/shared/ui/button.tsx');
    expect(loc?.layer).toBe('shared');
    expect(loc?.slice).toBeNull();
  });

  it('returns null for files outside src/', () => {
    expect(detectSliceLocation('app/example/page.tsx')).toBeNull();
    expect(detectSliceLocation('scripts/build.ts')).toBeNull();
  });

  it('returns null for files inside src/ but not in any FSD layer', () => {
    expect(detectSliceLocation('src/utils/index.ts')).toBeNull();
  });

  it('treats a file directly in the layer root as sliceless', () => {
    const loc = detectSliceLocation('src/features/index.ts');
    expect(loc?.layer).toBe('features');
    expect(loc?.slice).toBeNull();
  });

  it('honors a custom srcRoot', () => {
    const loc = detectSliceLocation('app-src/features/a/index.ts', {
      srcRoot: 'app-src',
    });
    expect(loc?.slice).toBe('a');
  });
});

describe('isUpwardImport', () => {
  it('flags shared → features as upward', () => {
    expect(isUpwardImport('shared', 'features')).toBe(true);
  });
  it('allows features → shared', () => {
    expect(isUpwardImport('features', 'shared')).toBe(false);
  });
  it('treats same-layer as non-upward', () => {
    expect(isUpwardImport('features', 'features')).toBe(false);
  });
});

describe('isCrossSlice', () => {
  it('flags two different slices in the same layer', () => {
    const a = detectSliceLocation('src/features/auth-login/ui.tsx')!;
    const b = detectSliceLocation('src/features/auth-profile/ui.tsx')!;
    expect(isCrossSlice(a, b)).toBe(true);
  });
  it('does not flag two files inside the same slice', () => {
    const a = detectSliceLocation('src/features/auth-login/ui.tsx')!;
    const b = detectSliceLocation('src/features/auth-login/model.ts')!;
    expect(isCrossSlice(a, b)).toBe(false);
  });
  it('does not flag cross-layer imports', () => {
    const a = detectSliceLocation('src/features/auth-login/ui.tsx')!;
    const b = detectSliceLocation('src/entities/user/model.ts')!;
    expect(isCrossSlice(a, b)).toBe(false);
  });
  it('does not flag shared (sliceless) interactions', () => {
    const a = detectSliceLocation('src/shared/ui/button.tsx')!;
    const b = detectSliceLocation('src/shared/lib/format.ts')!;
    expect(isCrossSlice(a, b)).toBe(false);
  });
});
