import {
  BleProfessionalParameters,
  decodeProfessionalPeripheralFlags,
} from '../../core/services/ble-read-decoders';
import { ProductDisplayRow } from './product-view.model';

export interface ProfessionalPeripheralDiagnosticText {
  readonly radarTest1: string;
  readonly radarTest2: string;
  readonly peripheralLock: string;
  readonly enabled: string;
  readonly disabled: string;
}

export interface ProfessionalPeripheralDiagnosticOptions {
  readonly includeLock: boolean;
}

export function createProfessionalPeripheralDiagnosticRows(
  value: BleProfessionalParameters,
  text: ProfessionalPeripheralDiagnosticText,
  options: ProfessionalPeripheralDiagnosticOptions,
): readonly ProductDisplayRow[] {
  const flags = decodeProfessionalPeripheralFlags(value.peripheralByte1);
  const rows: ProductDisplayRow[] = [
    Object.freeze({
      key: 'professional-radar-test-1',
      label: text.radarTest1,
      value: flags.radarTest1 ? text.enabled : text.disabled,
    }),
    Object.freeze({
      key: 'professional-radar-test-2',
      label: text.radarTest2,
      value: flags.radarTest2 ? text.enabled : text.disabled,
    }),
  ];

  if (options.includeLock) {
    rows.push(Object.freeze({
      key: 'professional-peripheral-lock',
      label: text.peripheralLock,
      value: flags.locked ? text.enabled : text.disabled,
    }));
  }

  return Object.freeze(rows);
}
