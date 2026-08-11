import { KnownProductProfile } from '../../core/services/product-data-load.service';
import { ProductProfessionalField } from './product-page.config';

const MOVENTIV_PROTECTED_PROFESSIONAL_FIELDS: readonly (
  ProductProfessionalField
)[] = [
  'near-open-torque',
  'near-close-torque',
  'braking-open-power',
  'obstacle-sensitivity',
];

const GARLINE_PROTECTED_PROFESSIONAL_FIELDS: readonly (
  ProductProfessionalField
)[] = ['obstacle-sensitivity'];

export function productProfessionalFieldRequiresAccess(
  profile: KnownProductProfile,
  field: ProductProfessionalField,
): boolean {
  switch (profile) {
    case 'moventiv-60':
    case 'moventiv-80':
      return MOVENTIV_PROTECTED_PROFESSIONAL_FIELDS.includes(field);
    case 'garline':
      return GARLINE_PROTECTED_PROFESSIONAL_FIELDS.includes(field);
    case 'widoor':
      return false;
  }
}
