import {
  BLE_PROFILE_CATALOG,
  MotorCommand,
  ProductProfile,
} from './ble-profile-catalog';

const OPEN_FRAME = [0x00, 0x20, 0x00, 0x00] as const;

export function encodeMotorCommand(
  profile: ProductProfile,
  command: MotorCommand,
): Uint8Array {
  const configuration = BLE_PROFILE_CATALOG[profile];

  if (!configuration.writable) {
    throw new Error(`BLE writes are forbidden for profile "${profile}".`);
  }

  if (!configuration.allowedCommands.includes(command)) {
    throw new Error(
      `Motor command "${command}" is not allowed for profile "${profile}".`,
    );
  }

  switch (command) {
    case 'OPEN':
      return Uint8Array.from(OPEN_FRAME);
    default:
      throw new Error(`Unsupported motor command "${String(command)}".`);
  }
}
