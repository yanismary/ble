import {
  MaintenanceAccessContext,
  MaintenanceAccessService,
} from './maintenance-access.service';

describe('MaintenanceAccessService', () => {
  let service: MaintenanceAccessService;
  const legacyMaintenanceCode = 'MovMaint';
  const legacyServiceCode = 'service';
  const invalidAccessCode = 'bad-code';
  const context: MaintenanceAccessContext = {
    profile: 'moventiv-80',
    deviceId: 'device-1',
    connectionGeneration: 4,
  };

  beforeEach(() => {
    service = new MaintenanceAccessService();
  });

  it('starts without maintenance access', () => {
    expect(service.isAuthenticated(context)).toBeFalse();
    expect(service.isAuthenticated(null)).toBeFalse();
  });

  it('rejects invalid access codes', () => {
    expect(service.authenticate(context, invalidAccessCode)).toBeFalse();
    expect(service.isAuthenticated(context)).toBeFalse();
  });

  it('accepts both legacy maintenance codes without persisting the code',
    () => {
      expect(service.authenticate(context, legacyMaintenanceCode)).toBeTrue();
      expect(service.isAuthenticated(context)).toBeTrue();

      service.reset();

      expect(service.authenticate(context, legacyServiceCode)).toBeTrue();
      expect(service.isAuthenticated(context)).toBeTrue();
      expect(JSON.stringify(service)).not.toContain(legacyServiceCode);
      expect(JSON.stringify(service)).not.toContain(legacyMaintenanceCode);
    },
  );

  it('scopes maintenance access to one connected product context', () => {
    expect(service.authenticate(context, legacyMaintenanceCode)).toBeTrue();
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
    expect(service.authenticate(context, legacyMaintenanceCode)).toBeTrue();

    service.reset({ ...context, deviceId: 'other-device' });
    expect(service.isAuthenticated(context)).toBeTrue();

    service.reset(context);
    expect(service.isAuthenticated(context)).toBeFalse();
  });
});
