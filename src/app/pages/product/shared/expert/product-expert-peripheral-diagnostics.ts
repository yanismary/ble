import {
  BleProfessionalParameters,
  decodeProfessionalPeripheralFlags,
} from '../../../../core/services/ble-read-decoders';
import { ProductDisplayRow } from '../models/product-view.model';

export interface ExpertPeripheralDiagnosticText {
  readonly radarTest1: string;
  readonly radarTest2: string;
  readonly peripheralLock: string;
  readonly enabled: string;
  readonly disabled: string;
}

export interface ExpertPeripheralDiagnosticOptions {
  readonly includeLock: boolean;
}

export function createExpertPeripheralDiagnosticRows(
  value: BleProfessionalParameters,
  text: ExpertPeripheralDiagnosticText,
  options: ExpertPeripheralDiagnosticOptions,
): readonly ProductDisplayRow[] {
  const flags = decodeProfessionalPeripheralFlags(value.peripheralByte1);
  const rows: ProductDisplayRow[] = [
    Object.freeze({
      key: 'expert-radar-test-1',
      label: text.radarTest1,
      value: flags.radarTest1 ? text.enabled : text.disabled,
    }),
    Object.freeze({
      key: 'expert-radar-test-2',
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
