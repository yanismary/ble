import {
  defineProductProfile,
  ProductFamily,
  ProductProfileDefinition,
  ProductProfileId,
  ProductVariant,
} from './product-profile.types';
import { GARLINE_PRODUCT_PROFILE } from
  './garline/garline-product-profile';
import {
  MOVENTIV_60_PRODUCT_PROFILE,
  MOVENTIV_80_PRODUCT_PROFILE,
} from './moventiv/moventiv-product-profile';
import { WIDOOR_PRODUCT_PROFILE } from
  './widoor/widoor-product-profile';

export const KNOWN_PRODUCT_PROFILES: readonly ProductProfileId[] =
  Object.freeze([
    'widoor',
    'moventiv-60',
    'moventiv-80',
    'garline',
  ]);

const PRODUCT_PROFILE_IDENTITIES: Readonly<Record<ProductProfileId, Readonly<{
  family: ProductFamily;
  variant: ProductVariant;
}>>> = Object.freeze({
  widoor: Object.freeze({ family: 'widoor', variant: 'standard' }),
  'moventiv-60': Object.freeze({ family: 'moventiv', variant: '60' }),
  'moventiv-80': Object.freeze({ family: 'moventiv', variant: '80' }),
  garline: Object.freeze({ family: 'garline', variant: 'standard' }),
});

export class ProductProfileRegistry {
  private readonly definitions: Readonly<
    Record<ProductProfileId, ProductProfileDefinition>
  >;

  constructor(definitions: Readonly<
    Record<ProductProfileId, ProductProfileDefinition>
  >) {
    for (const profile of KNOWN_PRODUCT_PROFILES) {
      validateProductProfile(profile, definitions[profile]);
    }
    this.definitions = Object.freeze({
      widoor: defineProductProfile(definitions.widoor),
      'moventiv-60': defineProductProfile(definitions['moventiv-60']),
      'moventiv-80': defineProductProfile(definitions['moventiv-80']),
      garline: defineProductProfile(definitions.garline),
    });
  }

  resolve(value: unknown): ProductProfileDefinition | undefined {
    if (typeof value !== 'string' ||
        !Object.prototype.hasOwnProperty.call(this.definitions, value)) {
      return undefined;
    }
    return this.definitions[value as ProductProfileId];
  }

  get(profile: ProductProfileId): ProductProfileDefinition {
    const definition = this.resolve(profile);
    if (definition === undefined) {
      throw new Error(`Unknown product profile: ${profile}.`);
    }
    return definition;
  }

  has(value: unknown): value is ProductProfileId {
    return this.resolve(value) !== undefined;
  }

  all(): readonly ProductProfileDefinition[] {
    return Object.freeze(KNOWN_PRODUCT_PROFILES.map((profile) =>
      this.definitions[profile],
    ));
  }

  asRecord(): Readonly<
    Record<ProductProfileId, ProductProfileDefinition>
  > {
    return this.definitions;
  }
}

export const productProfileRegistry = new ProductProfileRegistry({
  widoor: WIDOOR_PRODUCT_PROFILE,
  'moventiv-60': MOVENTIV_60_PRODUCT_PROFILE,
  'moventiv-80': MOVENTIV_80_PRODUCT_PROFILE,
  garline: GARLINE_PRODUCT_PROFILE,
});

export function isMoventivProductProfile(
  value: unknown,
): boolean {
  return productProfileRegistry.resolve(value)?.family === 'moventiv';
}

function validateProductProfile(
  profile: ProductProfileId,
  definition: ProductProfileDefinition | undefined,
): void {
  if (definition === undefined || definition.profile !== profile) {
    throw new Error(`Product profile registry mismatch for ${profile}.`);
  }

  const identity = PRODUCT_PROFILE_IDENTITIES[profile];
  if (definition.family !== identity.family ||
      definition.variant !== identity.variant) {
    throw new Error(`Product profile identity mismatch for ${profile}.`);
  }

  if (definition.capabilities.expertInputs &&
      !definition.expertFields.includes('peripherals')) {
    throw new Error(
      `Expert inputs require peripherals for ${profile}.`,
    );
  }

  const hasWeightRangeField = definition.expertFields
    .includes('weight-range');
  const hasWeightRangeControl = definition.capabilities
    .weightRangeControl !== 'none';
  if (hasWeightRangeField !== hasWeightRangeControl ||
      (hasWeightRangeControl && definition.weightRanges.length === 0)) {
    throw new Error(`Weight-range capability mismatch for ${profile}.`);
  }
}
