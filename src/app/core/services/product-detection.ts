import { Injectable } from '@angular/core';
import { BleService as DiscoveredBleService } from '@capacitor-community/bluetooth-le';

import { BLE_UUIDS } from './ble-profile-catalog';

export { BLE_UUIDS } from './ble-profile-catalog';

export type SecondaryBleProfile =
  | 'Widoor'
  | 'Moventiv / Garline'
  | 'Contradictoire'
  | 'Inconnu';

export type DetectedProductType =
  | 'Widoor'
  | 'Moventiv 60 kg'
  | 'Moventiv 80 kg'
  | 'Garline'
  | 'Ambigu'
  | 'Inconnu';

export type DetectionConfidence = 'Forte' | 'Faible' | 'Indéterminée';

export interface VersionIdentification {
  readonly rawHex: string;
  readonly length: number;
  readonly productByte: number | null;
  readonly subtypeByte: number | null;
  readonly detectedType: DetectedProductType;
  readonly ambiguous: boolean;
  readonly detectionReason: string;
  readonly detectionConfidence: DetectionConfidence;
}

export interface MotorSwitchStates {
  readonly raw: number;
  readonly unknownHighBits: number;
  readonly pushAndGo: boolean;
  readonly ble: boolean;
  readonly automaticManual: boolean;
  readonly direction: boolean;
  readonly pairing: boolean;
}

export interface MotorStateFrame {
  readonly rawHex: string;
  readonly length: number;
  readonly state: number | null;
  readonly currentPosition: number | null;
  readonly maximumPosition: number | null;
  readonly error: number | null;
  readonly switches: MotorSwitchStates | null;
}

@Injectable({
  providedIn: 'root',
})
export class ProductDetection {
  interpretMotorState(value: DataView): MotorStateFrame {
    const bytes = new Uint8Array(
      value.buffer,
      value.byteOffset,
      value.byteLength,
    );
    const switchesValue = bytes.length > 6 ? bytes[6] : null;

    return {
      rawHex: Array.from(bytes, (byte) =>
        byte.toString(16).padStart(2, '0'),
      ).join(' '),
      length: bytes.length,
      state: bytes.length > 0 ? bytes[0] : null,
      currentPosition: bytes.length > 2
        ? this.readUnsignedBigEndian16(bytes[1], bytes[2])
        : null,
      maximumPosition: bytes.length > 4
        ? this.readUnsignedBigEndian16(bytes[3], bytes[4])
        : null,
      error: bytes.length > 5 ? bytes[5] : null,
      switches: switchesValue === null
        ? null
        : {
            raw: switchesValue,
            unknownHighBits: switchesValue & 0xe0,
            pushAndGo: Boolean(switchesValue & 0x10),
            ble: Boolean(switchesValue & 0x08),
            automaticManual: Boolean(switchesValue & 0x04),
            direction: Boolean(switchesValue & 0x02),
            pairing: Boolean(switchesValue & 0x01),
          },
    };
  }

  detectSecondaryProfile(
    services: readonly DiscoveredBleService[],
  ): SecondaryBleProfile {
    const serviceUuids = new Set(
      services.map(({ uuid }) => this.normalizeUuid(uuid)),
    );
    const hasWidoorService = serviceUuids.has(BLE_UUIDS.widoorService);
    const hasMoventivGarlineService = serviceUuids.has(
      BLE_UUIDS.moventivGarlineService,
    );

    if (hasWidoorService && hasMoventivGarlineService) {
      return 'Contradictoire';
    }

    if (hasWidoorService) {
      return 'Widoor';
    }

    if (hasMoventivGarlineService) {
      return 'Moventiv / Garline';
    }

    return 'Inconnu';
  }

  interpretVersion(
    value: DataView,
    bluetoothName: string | null | undefined,
    secondaryProfile: SecondaryBleProfile,
  ): VersionIdentification {
    const bytes = new Uint8Array(
      value.buffer,
      value.byteOffset,
      value.byteLength,
    );
    const productByte = bytes.length > 12 ? bytes[12] : null;
    const subtypeByte = bytes.length > 13 ? bytes[13] : null;
    const mappedType = this.mapProductByte(productByte);
    const isWidoorName = bluetoothName?.trim().toUpperCase().startsWith('WI')
      ?? false;
    const detection = this.detectProductType(
      secondaryProfile,
      isWidoorName,
      mappedType,
      productByte,
    );

    if (detection.ambiguous) {
      console.warn('Incohérence dans les indices d’identification BLE.', {
        bluetoothName: bluetoothName ?? null,
        secondaryProfile,
        productByte,
        mappedType,
        reason: detection.reason,
      });
    }

    return {
      rawHex: Array.from(bytes, (byte) =>
        byte.toString(16).padStart(2, '0'),
      ).join(' '),
      length: bytes.length,
      productByte,
      subtypeByte,
      detectedType: detection.type,
      ambiguous: detection.ambiguous,
      detectionReason: detection.reason,
      detectionConfidence: detection.confidence,
    };
  }

  private detectProductType(
    secondaryProfile: SecondaryBleProfile,
    isWidoorName: boolean,
    mappedType: DetectedProductType,
    productByte: number | null,
  ): {
    readonly type: DetectedProductType;
    readonly ambiguous: boolean;
    readonly reason: string;
    readonly confidence: DetectionConfidence;
  } {
    if (secondaryProfile === 'Contradictoire') {
      return {
        type: 'Ambigu',
        ambiguous: true,
        reason: 'Services secondaires contradictoires',
        confidence: 'Indéterminée',
      };
    }

    if (secondaryProfile === 'Widoor') {
      return {
        type: 'Widoor',
        ambiguous: false,
        reason: 'Service secondaire Widoor détecté',
        confidence: 'Forte',
      };
    }

    if (secondaryProfile === 'Moventiv / Garline') {
      if (isWidoorName) {
        return {
          type: 'Ambigu',
          ambiguous: true,
          reason:
            'Service Moventiv/Garline contradictoire avec le nom Bluetooth WI',
          confidence: 'Indéterminée',
        };
      }

      return {
        type: mappedType,
        ambiguous: false,
        reason: productByte === null
          ? 'Service Moventiv/Garline sans octet produit'
          : `Service Moventiv/Garline + octet produit ${productByte}`,
        confidence: mappedType === 'Inconnu' ? 'Indéterminée' : 'Forte',
      };
    }

    if (isWidoorName) {
      return {
        type: 'Widoor',
        ambiguous: false,
        reason: 'Nom Bluetooth WI sans service secondaire connu',
        confidence: 'Faible',
      };
    }

    return {
      type: 'Inconnu',
      ambiguous: false,
      reason: 'Aucun indice de produit reconnu',
      confidence: 'Indéterminée',
    };
  }

  private mapProductByte(productByte: number | null): DetectedProductType {
    switch (productByte) {
      case 0:
        return 'Moventiv 60 kg';
      case 1:
        return 'Moventiv 80 kg';
      case 2:
        return 'Garline';
      default:
        return 'Inconnu';
    }
  }

  private readUnsignedBigEndian16(
    mostSignificantByte: number,
    leastSignificantByte: number,
  ): number {
    return (mostSignificantByte << 8) | leastSignificantByte;
  }

  private normalizeUuid(uuid: string): string {
    return uuid.trim().toLowerCase();
  }
}
