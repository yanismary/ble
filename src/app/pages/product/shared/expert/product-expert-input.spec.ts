import { PRODUCT_PAGE_CONFIG } from
  '../../profiles/product-page-config.facade';
import {
  createProductExpertInputAuthorization,
  productExpertInputConfigsFor,
} from './product-expert-input';

describe('productExpertInputConfigsFor', () => {
  it('exposes input 1 and input 2 for Widoor and Moventiv profiles', () => {
    for (const profile of ['widoor', 'moventiv-60', 'moventiv-80'] as const) {
      const configs = productExpertInputConfigsFor(
        PRODUCT_PAGE_CONFIG[profile],
      );
      expect(configs.map((config) => config.field)).toEqual([
        'input-1',
        'input-2',
      ]);
    }
  });

  it('does not expose expert inputs for Garline', () => {
    expect(productExpertInputConfigsFor(PRODUCT_PAGE_CONFIG.garline))
      .toEqual([]);
  });

  it('encodes Phase 1 button/radar payloads without exposing radar tests', () => {
    const [input1, input2] = productExpertInputConfigsFor(
      PRODUCT_PAGE_CONFIG['moventiv-60'],
    );
    expect(input1.catalogFactory('radar').payloadHex).toBe('0a 07 01');
    expect(input1.catalogFactory('button').payloadHex).toBe('0a 07 02');
    expect(input2.catalogFactory('radar').payloadHex).toBe('0a 06 01');
    expect(input2.catalogFactory('button').payloadHex).toBe('0a 06 02');
  });

  it('creates a scoped authorization for a catalogued input write', () => {
    const [input1] = productExpertInputConfigsFor(
      PRODUCT_PAGE_CONFIG.widoor,
    );
    const write = input1.catalogFactory('radar');
    const authorization = createProductExpertInputAuthorization({
      write,
      deviceId: 'device-1',
      connectionGeneration: 4,
      attemptId: 'attempt-1',
      confirmationId: 'confirmation-1',
      confirmedAt: 100,
    });
    expect(authorization.operation).toBe('input-1-radar');
    expect(authorization.payloadHex).toBe('0a 07 01');
    expect(authorization.deviceId).toBe('device-1');
    expect(authorization.connectionGeneration).toBe(4);
  });
});
