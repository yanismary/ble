import type {
  ProductExpertField,
  ProductProfileDefinition,
} from '../../profiles/product-profile.types';

export function productExpertFieldRequiresAccess(
  definition: Pick<ProductProfileDefinition, 'capabilities'>,
  field: ProductExpertField,
): boolean {
  return definition.capabilities.expertAccessFields.includes(field);
}
