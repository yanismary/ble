import { decodeBleUserParameters } from '../../../core/services/ble-read-decoders';
import { ProductPage } from '../product.page';
import { ProductExpertInputUiConfig } from '../shared/expert/product-expert-input';

describe('ProductPage input mode read source', () => {
  const input1 = { profile: 'moventiv-80', field: 'input-1' } as
    ProductExpertInputUiConfig;
  const input2 = { profile: 'moventiv-80', field: 'input-2' } as
    ProductExpertInputUiConfig;

  function page(userByte: number, advancedByte: number): ProductPage {
    const decoded = decodeBleUserParameters(new Uint8Array([
      0, 100, 100, 5, 1, userByte, 0,
    ]));
    if (!decoded.valid) {
      throw new Error('Expected a valid user-parameters frame.');
    }
    const component = Object.create(ProductPage.prototype) as ProductPage;
    Object.defineProperties(component, {
      config: { value: { profile: 'moventiv-80' } },
      context: { value: { mode: 'connected' } },
      requestedExpertInputModes: { value: new Map() },
      viewModel: {
        value: {
          reads: {
            userParameters: { value: decoded.value },
            advancedParameters: {
              value: { profile: 'moventiv-80', peripheralByte1: advancedByte },
            },
          },
        },
      },
    });
    return component;
  }

  it('shows both inputs as Radar from BF despite contrary advanced bits', () => {
    const component = page(0xbf, 0x00);
    expect(component.currentExpertInputMode(input1)).toBe('radar');
    expect(component.currentExpertInputMode(input2)).toBe('radar');
  });

  it('uses the high nibble of User Parameters and ignores Advanced modes', () => {
    const component = page(0x1f, 0xc0);
    expect(component.currentExpertInputMode(input1)).toBe('button');
    expect(component.currentExpertInputMode(input2)).toBe('radar');
  });
});
