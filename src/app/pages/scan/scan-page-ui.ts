import { normalizeBleProductName } from '../../core/services/ble-product-name';

export interface ScanDisplayNameParts {
  readonly displayName: string;
  readonly roomSuffix: string | null;
}

const KNOWN_ROOM_SUFFIXES = [
  '#CHA',
  '#SAL',
  '#SAM',
  '#CUI',
  '#SDB',
  '#WCS',
  '#GAR',
  '#SDJ',
  '#SLL',
  '#ENT',
] as const;

const ROOM_ICON_CLASS_BY_SUFFIX: Readonly<Record<string, string>> =
  Object.freeze({
    '#CHA': 'ai-loc-cha',
    '#SAL': 'ai-loc-sal',
    '#SAM': 'ai-loc-sam',
    '#CUI': 'ai-loc-cui',
    '#SDB': 'ai-loc-sdb',
    '#WCS': 'ai-loc-wcs',
    '#GAR': 'ai-loc-garage',
    '#SDJ': 'ai-loc-sdj',
    '#SLL': 'ai-loc-autre',
    '#ENT': 'ai-loc-autre',
  });

export function getBleSignalQualityFromRssi(rssi: number | null): number {
  if (rssi === null || !Number.isFinite(rssi)) {
    return 0;
  }
  if (rssi >= -60) {
    return 4;
  }
  if (rssi >= -70) {
    return 3;
  }
  if (rssi >= -80) {
    return 2;
  }
  if (rssi >= -90) {
    return 1;
  }
  return 0;
}

export function getBleSignalQualityAsset(rssi: number | null): string {
  return `assets/img/img_ble_strenght_${getBleSignalQualityFromRssi(rssi)}_4.svg`;
}

export function splitScanDisplayName(name: string): ScanDisplayNameParts {
  const trimmed = normalizeBleProductName(name);
  const roomSuffix = KNOWN_ROOM_SUFFIXES.find((suffix) =>
    trimmed.endsWith(suffix),
  ) ?? null;
  return Object.freeze({
    displayName: roomSuffix === null
      ? trimmed
      : trimmed.slice(0, -roomSuffix.length).trim(),
    roomSuffix,
  });
}

export function getScanRoomIconClass(roomSuffix: string | null): string | null {
  return roomSuffix === null
    ? null
    : ROOM_ICON_CLASS_BY_SUFFIX[roomSuffix] ?? null;
}
