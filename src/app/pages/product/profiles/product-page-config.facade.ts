import {
  KnownProductProfile,
} from '../../../core/services/product-data-load.service';
import {
  productProfileRegistry,
} from './product-profile.registry';

export type {
  ProductPageConfig,
  ProductExpertField,
  ProductUserField,
  ProductWeightRange,
} from './product-profile.types';

// Compatibility facade for existing Product and Scan consumers.
export const PRODUCT_PAGE_CONFIG = productProfileRegistry.asRecord();

export function isKnownProductProfile(
  value: unknown,
): value is KnownProductProfile {
  return productProfileRegistry.has(value);
}
