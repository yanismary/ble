import { WIDOOR_PRODUCT_PROFILE } from './widoor-product-profile';

describe('Widoor product profile', () => {
  it('should describe the current Widoor commands and settings exactly', () => {
    expect(WIDOOR_PRODUCT_PROFILE.family).toBe('widoor');
    expect(WIDOOR_PRODUCT_PROFILE.commands).toEqual([
      'motor-open',
      'motor-close',
      'motor-open-short-timed',
    ]);
    expect(WIDOOR_PRODUCT_PROFILE.userFields).toEqual([
      'open-speed',
      'close-speed',
      'short-timing',
      'rgb',
    ]);
    expect(WIDOOR_PRODUCT_PROFILE.professionalFields).toContain(
      'break-force-at-open',
    );
    expect(WIDOOR_PRODUCT_PROFILE.capabilities.professionalInputs)
      .toBeTrue();
    expect(WIDOOR_PRODUCT_PROFILE.behavior.refreshAfterMaintenanceAction)
      .toBeTrue();
  });

  it('should keep Widoor-specific presentation capabilities isolated', () => {
    expect(Object.isFrozen(WIDOOR_PRODUCT_PROFILE)).toBeTrue();
    expect(Object.isFrozen(WIDOOR_PRODUCT_PROFILE.sensitiveActions)).toBeTrue();
    expect(WIDOOR_PRODUCT_PROFILE.ui.widoorLayout).toBeTrue();
    expect(WIDOOR_PRODUCT_PROFILE.ui.moventivLayout).toBeFalse();
    expect(WIDOOR_PRODUCT_PROFILE.ui.phase1SliderInteraction).toBeTrue();
    expect(WIDOOR_PRODUCT_PROFILE.behavior.advancedSettingsConfirmation)
      .toBeTrue();
    expect(WIDOOR_PRODUCT_PROFILE.information.showMotorAddress).toBeFalse();
    expect(WIDOOR_PRODUCT_PROFILE.information.supplementalMaintenanceFields)
      .toEqual([
        'initializations',
        'cycles-since-init',
        'obstacles',
        'encoder-errors',
        'motor-errors',
      ]);
  });
});
