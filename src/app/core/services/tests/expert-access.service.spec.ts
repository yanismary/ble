import {
  ExpertAccessContext,
  ExpertAccessService,
} from '../expert-access.service';

describe('ExpertAccessService', () => {
  let service: ExpertAccessService;
  const legacyExpertCode = 'expert';
  const legacyOldExpertCode = 'WidoorSAV';
  const invalidAccessCode = 'bad-code';
  const context: ExpertAccessContext = {
    profile: 'moventiv-80',
    deviceId: 'device-1',
    connectionGeneration: 4,
  };

  beforeEach(() => {
    service = new ExpertAccessService();
  });

  it('starts without expert access', () => {
    expect(service.isAuthenticated(context)).toBeFalse();
    expect(service.isAuthenticated(null)).toBeFalse();
  });

  it('rejects invalid access codes', () => {
    expect(service.authenticate(context, invalidAccessCode)).toBeFalse();
    expect(service.isAuthenticated(context)).toBeFalse();
  });

  it('accepts both legacy expert access codes without persisting the code',
    () => {
      expect(service.authenticate(context, legacyExpertCode)).toBeTrue();
      expect(service.isAuthenticated(context)).toBeTrue();

      service.reset();

      expect(service.authenticate(context, legacyOldExpertCode)).toBeTrue();
      expect(service.isAuthenticated(context)).toBeTrue();
      expect(JSON.stringify(service)).not.toContain(legacyOldExpertCode);
    },
  );

  it('scopes expert access to one connected product context', () => {
    expect(service.authenticate(context, legacyExpertCode)).toBeTrue();
    expect(service.isAuthenticated({
      ...context,
      deviceId: 'other-device',
    })).toBeFalse();
    expect(service.isAuthenticated({
      ...context,
      profile: 'garline',
    })).toBeFalse();
    expect(service.isAuthenticated({
      ...context,
      connectionGeneration: 5,
    })).toBeFalse();
  });

  it('resets only the matching context when one is provided', () => {
    expect(service.authenticate(context, legacyExpertCode)).toBeTrue();

    service.reset({ ...context, deviceId: 'other-device' });
    expect(service.isAuthenticated(context)).toBeTrue();

    service.reset(context);
    expect(service.isAuthenticated(context)).toBeFalse();
  });
});
