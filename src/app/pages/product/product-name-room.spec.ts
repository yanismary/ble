import { BLE_UUIDS } from '../../core/services/ble-profile-catalog';
import { encodeLegacyLockMode } from
  '../../core/services/legacy-ble-write-catalog';
import {
  PRODUCT_KNOWN_ROOM_OPTIONS,
  PRODUCT_NAME_ROOM_EXECUTION_POLICY,
  PRODUCT_NAME_ROOM_POST_WRITE_COOLDOWN_MS,
  PRODUCT_NAME_ROOM_PRE_WRITE_DELAY_MS,
  PRODUCT_NAME_ROOM_WRITE_TIMEOUT_MS,
  PRODUCT_ROOM_OPTIONS,
  createProductNameRoomAuthorization,
  createProductNameRoomDraft,
  encodeProductNameRoomWrite,
  splitProductDisplayName,
  validateProductNameRoomDraft,
} from './product-name-room';

describe('Product name and room controls', () => {
  it('keeps the Phase 1 timing contract scoped to name-room writes', () => {
    expect(PRODUCT_NAME_ROOM_PRE_WRITE_DELAY_MS).toBe(200);
    expect(PRODUCT_NAME_ROOM_POST_WRITE_COOLDOWN_MS).toBe(1_800);
    expect(PRODUCT_NAME_ROOM_WRITE_TIMEOUT_MS).toBe(15_000);
    expect(PRODUCT_NAME_ROOM_EXECUTION_POLICY).toEqual({
      allowPhase1ReferenceOnly: true,
      gattWriteTimeoutMs: 15_000,
      useLegacyAndroidWriteApi: true,
    });
  });

  it('splits known room suffixes from the BLE display name', () => {
    expect(splitProductDisplayName('Firma#CHA')).toEqual({
      name: 'Firma',
      roomSuffix: '#CHA',
    });
    expect(splitProductDisplayName('Door#SDJ')).toEqual({
      name: 'Door',
      roomSuffix: '#SDJ',
    });
    expect(splitProductDisplayName('Door')).toEqual({
      name: 'Door',
      roomSuffix: null,
    });
    expect(splitProductDisplayName('Door#ABC')).toEqual({
      name: 'Door#ABC',
      roomSuffix: null,
    });
    expect(splitProductDisplayName('Door#cha')).toEqual({
      name: 'Door#cha',
      roomSuffix: null,
    });
    expect(splitProductDisplayName('  Door - 1#SAL  ')).toEqual({
      name: 'Door - 1',
      roomSuffix: '#SAL',
    });
    expect(splitProductDisplayName('#CHA')).toEqual({
      name: '',
      roomSuffix: '#CHA',
    });
  });

  it('declares every legacy room suffix known by Phase 1 parsing', () => {
    expect(PRODUCT_KNOWN_ROOM_OPTIONS.map((option) => option.suffix)).toEqual([
      '#CHA',
      '#ENT',
      '#SAL',
      '#CUI',
      '#SAM',
      '#SDB',
      '#WCS',
      '#GAR',
      '#SLL',
      '#SDJ',
    ]);
  });

  it('exposes only the room options present in the Phase 1 select', () => {
    expect(PRODUCT_ROOM_OPTIONS.map((option) => option.suffix)).toEqual([
      '#CHA',
      '#SAL',
      '#SAM',
      '#CUI',
      '#SDB',
      '#WCS',
      '#GAR',
      '#SDJ',
    ]);
  });

  it('validates name and room drafts before encoding', () => {
    const current = splitProductDisplayName('Porte#CHA');
    expect(validateProductNameRoomDraft(
      current,
      createProductNameRoomDraft(current),
    )).toEqual({ valid: false, error: 'unchanged' });
    expect(validateProductNameRoomDraft(current, {
      name: 'Abc',
      roomSuffix: '#CHA',
    })).toEqual({ valid: false, error: 'too-short' });
    expect(validateProductNameRoomDraft(current, {
      name: 'Porte_1',
      roomSuffix: '#CHA',
    })).toEqual({ valid: false, error: 'invalid-characters' });
    expect(validateProductNameRoomDraft(current, {
      name: '123456789012',
      roomSuffix: '#CHA',
    })).toEqual({ valid: false, error: 'too-long' });
    expect(validateProductNameRoomDraft(current, {
      name: 'Porte',
      roomSuffix: '#ENT',
    })).toEqual({ valid: false, error: 'invalid-room' });
    expect(validateProductNameRoomDraft(current, {
      name: 'Porte',
      roomSuffix: '#ABC' as '#CHA',
    })).toEqual({ valid: false, error: 'invalid-room' });
    expect(validateProductNameRoomDraft(current, {
      name: 'Porte#1',
      roomSuffix: '#CHA',
    })).toEqual({ valid: false, error: 'invalid-characters' });
    expect(validateProductNameRoomDraft(current, {
      name: 'Porteé',
      roomSuffix: '#CHA',
    })).toEqual({ valid: false, error: 'invalid-characters' });
    expect(validateProductNameRoomDraft(current, {
      name: "Porte d'1",
      roomSuffix: '#CHA',
    })).toEqual({ valid: false, error: 'invalid-characters' });
    expect(validateProductNameRoomDraft(current, {
      name: 'Porte🚪',
      roomSuffix: '#CHA',
    })).toEqual({ valid: false, error: 'invalid-characters' });
  });

  it('applies the 15-character limit to name plus room suffix', () => {
    const current = splitProductDisplayName('Porte#CHA');

    expect(validateProductNameRoomDraft(current, {
      name: '1234567890',
      roomSuffix: '#SAL',
    })).toEqual(jasmine.objectContaining({
      valid: true,
      valueToWrite: '1234567890#SAL',
    }));
    expect(validateProductNameRoomDraft(current, {
      name: '12345678901',
      roomSuffix: '#SAL',
    })).toEqual(jasmine.objectContaining({
      valid: true,
      valueToWrite: '12345678901#SAL',
    }));
    expect(validateProductNameRoomDraft(current, {
      name: '123456789012',
      roomSuffix: '#SAL',
    })).toEqual({ valid: false, error: 'too-long' });
  });

  it('replaces the existing suffix once for Widoor and Moventiv', () => {
    const validation = validateProductNameRoomDraft(
      splitProductDisplayName('Mov-BE-L#SAL'),
      { name: 'Mov-BE-L', roomSuffix: '#CHA' },
    );

    expect(validation).toEqual(jasmine.objectContaining({
      valid: true,
      baseName: 'Mov-BE-L',
      roomSuffix: '#CHA',
      valueToWrite: 'Mov-BE-L#CHA',
      nameChanged: false,
      roomChanged: true,
    }));
    if (!validation.valid) {
      return;
    }
    for (const profile of ['widoor', 'moventiv-60', 'moventiv-80'] as const) {
      const write = encodeProductNameRoomWrite(profile, validation);
      expect(write.payloadHex).withContext(profile)
        .toBe('4d 6f 76 2d 42 45 2d 4c 23 43 48 41');
      expect(Array.from(write.payload)).withContext(profile).toEqual(
        Array.from('Mov-BE-L#CHA', (character) => character.charCodeAt(0)),
      );
    }
  });

  it('preserves legacy-only suffixes but does not expose them as new choices',
    () => {
      const current = splitProductDisplayName('Porte#ENT');

      expect(validateProductNameRoomDraft(current, {
        name: 'Garage',
        roomSuffix: '#ENT',
      })).toEqual(jasmine.objectContaining({
        valid: true,
        valueToWrite: 'Garage#ENT',
      }));
      expect(validateProductNameRoomDraft(current, {
        name: 'Garage',
        roomSuffix: '#SLL',
      })).toEqual({ valid: false, error: 'invalid-room' });
    },
  );

  it('encodes room removal as a name without suffix', () => {
    const validation = validateProductNameRoomDraft(
      splitProductDisplayName('Porte#CHA'),
      { name: 'Porte', roomSuffix: null },
    );

    expect(validation).toEqual(jasmine.objectContaining({
      valid: true,
      valueToWrite: 'Porte',
      roomSuffix: null,
    }));
  });

  it('encodes validated name and room writes through the legacy catalog', () => {
    const validation = validateProductNameRoomDraft(
      splitProductDisplayName('Porte#CHA'),
      { name: 'Garage', roomSuffix: '#GAR' },
    );
    expect(validation.valid).toBeTrue();
    if (!validation.valid) {
      return;
    }
    const write = encodeProductNameRoomWrite('garline', validation);

    expect(write.operation).toBe('name-room');
    expect(write.profile).toBe('garline');
    expect(write.serviceUuid).toBe(BLE_UUIDS.shdoService);
    expect(write.characteristicUuid).toBe(BLE_UUIDS.nameCharacteristic);
    expect(write.payloadHex).toBe('47 61 72 61 67 65 23 47 41 52');
    expect(Array.from(write.payload)).toEqual(
      Array.from('Garage#GAR', (character) => character.charCodeAt(0)),
    );
  });

  it('keeps room empty as an absent BLE suffix', () => {
    const validation = validateProductNameRoomDraft(
      splitProductDisplayName('Porte'),
      { name: 'Garage', roomSuffix: null },
    );

    expect(validation.valid).toBeTrue();
    if (!validation.valid) {
      return;
    }
    const write = encodeProductNameRoomWrite('moventiv-80', validation);

    expect(write.payloadHex).toBe('47 61 72 61 67 65');
    expect(Array.from(write.payload)).toEqual(
      Array.from('Garage', (character) => character.charCodeAt(0)),
    );
  });

  it('supports name writes for every known product profile', () => {
    const validation = validateProductNameRoomDraft(
      splitProductDisplayName('Porte#CHA'),
      { name: 'Garage', roomSuffix: '#GAR' },
    );
    expect(validation.valid).toBeTrue();
    if (!validation.valid) {
      return;
    }

    expect(['widoor', 'moventiv-60', 'moventiv-80', 'garline'].map(
      (profile) => encodeProductNameRoomWrite(
        profile as 'widoor' | 'moventiv-60' | 'moventiv-80' | 'garline',
        validation,
      ).profile,
    )).toEqual(['widoor', 'moventiv-60', 'moventiv-80', 'garline']);
  });

  it('creates scoped authorizations only for catalogued name-room writes',
    () => {
      const validation = validateProductNameRoomDraft(
        splitProductDisplayName('Porte#CHA'),
        { name: 'Porte', roomSuffix: '#SAL' },
      );
      expect(validation.valid).toBeTrue();
      if (!validation.valid) {
        return;
      }
      const authorization = createProductNameRoomAuthorization({
        write: encodeProductNameRoomWrite('widoor', validation),
        deviceId: 'device-1',
        connectionGeneration: 4,
        attemptId: 'attempt-1',
        confirmationId: 'confirmation-1',
        confirmedAt: 1_000,
      });

      expect(authorization.profile).toBe('widoor');
      expect(authorization.operation).toBe('name-room');
      expect(authorization.payloadHex).toBe('50 6f 72 74 65 23 53 41 4c');
      expect(authorization.motorMovementConfirmed).toBeUndefined();
      expect(() => createProductNameRoomAuthorization({
        write: encodeLegacyLockMode('widoor', 'none'),
        deviceId: 'device-1',
        connectionGeneration: 4,
        attemptId: 'attempt-2',
        confirmationId: 'confirmation-2',
        confirmedAt: 1_000,
      })).toThrowError(/name-room write/);
    },
  );
});
