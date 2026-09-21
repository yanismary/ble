import { ProductPage } from '../product.page';

describe('ProductPage settings entry refresh', () => {
  function page(): ProductPage {
    const component = Object.create(ProductPage.prototype) as ProductPage;
    component.activeMainTab = 'commands';
    component.activeSettingsTab = 'basic';
    Object.defineProperties(component, {
      context: {
        value: { mode: 'connected', profile: 'widoor', deviceId: 'door-1' },
      },
      pageContextCurrent: { value: true },
      canRefresh: { value: true, configurable: true },
      viewModel: {
        value: {
          reads: {
            userParameters: { status: 'available' },
            advancedParameters: { status: 'available' },
          },
        },
      },
      userSpeedDrafts: { value: new Map() },
      userTimingDrafts: { value: new Map() },
      expertScalarDrafts: { value: new Map() },
    });
    return component;
  }

  it('reads only settings parameters on each entry, not on inner tab changes',
    async () => {
      const component = page();
      const refresh = spyOn(component, 'refreshProductData')
        .and.resolveTo();

      component.setActiveMainTab('settings');
      await Promise.resolve();
      component.setActiveSettingsTab('advanced');
      component.setActiveMainTab('settings');
      component.setActiveMainTab('information');
      component.setActiveMainTab('settings');
      await Promise.resolve();

      expect(refresh).toHaveBeenCalledTimes(2);
      for (const call of refresh.calls.all()) {
        expect(call.args).toEqual([{
          version: false,
          datesAndCycles: false,
          maintenance: false,
          userParameters: true,
          advancedParameters: true,
        }, false, true]);
      }
      expect(component.activeSettingsTab).toBe('basic');
    });

  it('does not start another settings read during a pending BLE load', () => {
    const component = page();
    Object.defineProperty(component, 'canRefresh', { value: false });
    const refresh = spyOn(component, 'refreshProductData')
      .and.resolveTo();

    component.setActiveMainTab('settings');

    expect(refresh).not.toHaveBeenCalled();
  });
});
