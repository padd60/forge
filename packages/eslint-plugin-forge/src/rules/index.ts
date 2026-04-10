import { cleanArchDomainIsolation } from './clean-arch-domain-isolation.js';
import { componentMaxLines } from './component-max-lines.js';
import { cqrsLayerRole } from './cqrs-layer-role.js';
import { dddEntityId } from './ddd-entity-id.js';
import { fsdLayerTypo } from './fsd-layer-typo.js';
import { fsdNoWildcardReexport } from './fsd-no-wildcard-reexport.js';
import { fsdSliceBoundary } from './fsd-slice-boundary.js';
import { noBooleanFlagArg } from './no-boolean-flag-arg.js';
import { noTypeEscape } from './no-type-escape.js';

export const rules = {
  'component-max-lines': componentMaxLines,
  'no-boolean-flag-arg': noBooleanFlagArg,
  'no-type-escape': noTypeEscape,
  'fsd-slice-boundary': fsdSliceBoundary,
  'fsd-no-wildcard-reexport': fsdNoWildcardReexport,
  'fsd-layer-typo': fsdLayerTypo,
  'cqrs-layer-role': cqrsLayerRole,
  'ddd-entity-id': dddEntityId,
  'clean-arch-domain-isolation': cleanArchDomainIsolation,
} as const;

export type ForgeRuleName = keyof typeof rules;
