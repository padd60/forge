import { cleanArchDomainIsolation } from './clean-arch-domain-isolation';
import { componentMaxLines } from './component-max-lines';
import { cqrsLayerRole } from './cqrs-layer-role';
import { dddEntityId } from './ddd-entity-id';
import { fsdSliceBoundary } from './fsd-slice-boundary';
import { noBooleanFlagArg } from './no-boolean-flag-arg';

export const rules = {
  'component-max-lines': componentMaxLines,
  'no-boolean-flag-arg': noBooleanFlagArg,
  'fsd-slice-boundary': fsdSliceBoundary,
  'cqrs-layer-role': cqrsLayerRole,
  'ddd-entity-id': dddEntityId,
  'clean-arch-domain-isolation': cleanArchDomainIsolation,
} as const;

export type ForgeRuleName = keyof typeof rules;
