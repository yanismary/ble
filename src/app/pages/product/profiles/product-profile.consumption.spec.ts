import { PRODUCT_PAGE_CONFIG } from
  './product-page-config.facade';
import { isProductDemoProfile } from '../shared/demo/product-demo';
import {
  MOTOR_COMMAND_UI_CONFIGS,
  productMotorCommandConfigsFor,
} from './product-motor-command.registry';
import { productExpertInputConfigsFor } from
  '../shared/expert/product-expert-input';
import { productSensitiveActionConfigsFor } from
  '../shared/actions/product-sensitive-action';
import { productWeightRangeConfigsFor } from
  './moventiv/moventiv-weight-range';
import {
  isMoventivProductProfile,
  productProfileRegistry,
} from './product-profile.registry';

describe('Product profile consumption', () => {
  it('resolves ProductPage motor commands from profile order and selection', () => {
    const definition = productProfileRegistry.get('widoor');
    const resolved = productMotorCommandConfigsFor({
      ...definition,
      commands: ['motor-close', 'motor-open'],
    });

    expect(resolved.map(({ operation }) => operation)).toEqual([
      'motor-close',
      'motor-open',
    ]);
    expect(resolved[0]).toBe(MOTOR_COMMAND_UI_CONFIGS.widoor[1]);
    expect(() => productMotorCommandConfigsFor({
      ...definition,
      commands: ['motor-open-long-timed'],
    })).toThrowError(
      'Missing motor-command implementation for widoor: ' +
      'motor-open-long-timed.',
    );
  });

  it('derives Demo availability from the registered capability', () => {
    for (const definition of productProfileRegistry.all()) {
      expect(isProductDemoProfile(definition))
        .toBe(definition.capabilities.demo);
    }
  });

  it('derives Moventiv membership from the registered family', () => {
    for (const definition of productProfileRegistry.all()) {
      expect(isMoventivProductProfile(definition.profile))
        .toBe(definition.family === 'moventiv');
    }
  });

  it('uses expertInputs to expose the historical input controls', () => {
    for (const definition of productProfileRegistry.all()) {
      const controls = productExpertInputConfigsFor(
        PRODUCT_PAGE_CONFIG[definition.profile],
      );
      expect(controls.length > 0)
        .toBe(definition.capabilities.expertInputs);
    }
  });

  it('uses weightRangeControl to expose only historical range controls', () => {
    for (const definition of productProfileRegistry.all()) {
      const controls = productWeightRangeConfigsFor(
        PRODUCT_PAGE_CONFIG[definition.profile],
      );
      expect(controls.length > 0).toBe(
        definition.capabilities.weightRangeControl !== 'none',
      );
    }
  });

  it('uses profile sensitiveActions as the visible action source', () => {
    for (const definition of productProfileRegistry.all()) {
      expect(productSensitiveActionConfigsFor(definition).map(
        ({ action }) => action,
      )).toEqual(definition.sensitiveActions);
    }
  });
});
