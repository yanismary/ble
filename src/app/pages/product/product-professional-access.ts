import { KnownProductProfile } from '../../core/services/product-data-load.service';
import { ProductProfessionalField } from './product-page.config';
import { productProfileRegistry } from
  './profiles/product-profile.registry';

export function productProfessionalFieldRequiresAccess(
  profile: KnownProductProfile,
  field: ProductProfessionalField,
): boolean {
  return productProfileRegistry.get(profile).capabilities
    .professionalAccessFields.includes(field);
}
