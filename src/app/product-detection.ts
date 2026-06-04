export type DetectedProductType = 'widoor' | 'moventiv60' | 'moventiv80' | 'garline' | 'unknown';
export type ProductFamily = 'widoor' | 'moventiv' | 'garline' | 'unknown';

export interface ProductDetectionResult {
  productType: DetectedProductType;
  family: ProductFamily;
  productTypeByte: number | null;
  reason: string;
}

export const VERSION_WORD_PRODUCT_TYPE_INDEX = 12;

export function isWidoorBluetoothName(deviceName: string | undefined | null): boolean {
  return normalizeDeviceName(deviceName).indexOf('WI') === 0;
}

export function detectProductType(deviceName: string | undefined | null, versionWordBytes?: ArrayLike<number> | null): ProductDetectionResult {
  if (isWidoorBluetoothName(deviceName)) {
    return {
      productType: 'widoor',
      family: 'widoor',
      productTypeByte: null,
      reason: 'bluetooth_name_prefix_wi'
    };
  }

  if (!versionWordBytes || versionWordBytes.length <= VERSION_WORD_PRODUCT_TYPE_INDEX) {
    return {
      productType: 'unknown',
      family: 'unknown',
      productTypeByte: null,
      reason: 'version_word_missing_or_too_short'
    };
  }

  const productTypeByte = Number(versionWordBytes[VERSION_WORD_PRODUCT_TYPE_INDEX]);

  switch (productTypeByte) {
    case 0:
      return {
        productType: 'moventiv60',
        family: 'moventiv',
        productTypeByte: productTypeByte,
        reason: 'version_word_byte_12'
      };
    case 1:
      return {
        productType: 'moventiv80',
        family: 'moventiv',
        productTypeByte: productTypeByte,
        reason: 'version_word_byte_12'
      };
    case 2:
      return {
        productType: 'garline',
        family: 'garline',
        productTypeByte: productTypeByte,
        reason: 'version_word_byte_12'
      };
    default:
      return {
        productType: 'unknown',
        family: 'unknown',
        productTypeByte: productTypeByte,
        reason: 'version_word_unknown_product_byte'
      };
  }
}

export function normalizeProductType(productType: string | undefined | null): DetectedProductType {
  const normalizedType = String(productType || '').toLowerCase();

  if (normalizedType === 'widoor') {
    return 'widoor';
  }
  if (normalizedType === 'garline') {
    return 'garline';
  }
  if (normalizedType === 'moventiv60' || normalizedType === 'moventiv_60' || normalizedType === 'moventiv-60') {
    return 'moventiv60';
  }
  if (normalizedType === 'moventiv80' || normalizedType === 'moventiv_80' || normalizedType === 'moventiv-80') {
    return 'moventiv80';
  }
  if (normalizedType === 'moventiv') {
    return 'moventiv60';
  }

  return 'unknown';
}

export function isGarlineProductType(productType: string | undefined | null): boolean {
  return normalizeProductType(productType) === 'garline';
}

export function isMoventivProductType(productType: string | undefined | null): boolean {
  const normalizedType = normalizeProductType(productType);
  return normalizedType === 'moventiv60' || normalizedType === 'moventiv80';
}

export function getProductDisplayName(productType: string | undefined | null): string {
  return isGarlineProductType(productType) ? 'GARLINE' : 'MOVENTIV';
}

export function getProductConfigId(productType: DetectedProductType): string | null {
  if (productType === 'widoor') {
    return 'widoor';
  }
  if (productType === 'garline') {
    return 'garline';
  }
  if (productType === 'moventiv60' || productType === 'moventiv80') {
    return 'moventiv';
  }
  return null;
}

export function productTypeLabel(productType: DetectedProductType): string {
  switch (productType) {
    case 'widoor':
      return 'Widoor';
    case 'moventiv60':
      return 'Moventiv 60 kg';
    case 'moventiv80':
      return 'Moventiv 80 kg';
    case 'garline':
      return 'Garline';
    default:
      return 'Produit inconnu';
  }
}

export function versionWordBytesToHex(versionWordBytes?: ArrayLike<number> | null): string {
  if (!versionWordBytes || versionWordBytes.length === 0) {
    return '';
  }

  const hexParts: string[] = [];
  for (let i = 0; i < versionWordBytes.length; i++) {
    const value = Number(versionWordBytes[i]) & 0xFF;
    hexParts.push(('0' + value.toString(16)).slice(-2).toUpperCase());
  }
  return hexParts.join(' ');
}

function normalizeDeviceName(deviceName: string | undefined | null): string {
  return String(deviceName || '').trim().toUpperCase();
}
