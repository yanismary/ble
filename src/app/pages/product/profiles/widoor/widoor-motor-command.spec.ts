import {
  WIDOOR_COMMAND_AUTHORIZATION_TTL_MS,
  WIDOOR_MOTOR_COMMAND_DEFINITIONS,
} from './widoor-motor-command';

describe('Widoor motor-command definitions', () => {
  it('owns the exact visible Phase 1 command order and payloads', () => {
    expect(WIDOOR_MOTOR_COMMAND_DEFINITIONS.map((definition) =>
      definition.command,
    )).toEqual(['OPEN', 'CLOSE', 'OPEN_SHORT_TIMED']);
    expect(WIDOOR_MOTOR_COMMAND_DEFINITIONS.map((definition) =>
      definition.catalogFactory().payloadHex,
    )).toEqual(['00 20 00 00', '00 30', '00 21 00 00']);
    expect(WIDOOR_MOTOR_COMMAND_DEFINITIONS.every(Object.isFrozen)).toBeTrue();
  });

  it('keeps the validated Widoor authorization lifetime unchanged', () => {
    expect(WIDOOR_COMMAND_AUTHORIZATION_TTL_MS).toBe(15_000);
  });
});
