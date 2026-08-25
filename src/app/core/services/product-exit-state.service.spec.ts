import { TestBed } from '@angular/core/testing';

import { ProductExitStateService } from './product-exit-state.service';

describe('ProductExitStateService', () => {
  let service: ProductExitStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductExitStateService);
  });

  it('should expose a product exit result exactly once', () => {
    service.record({
      deviceId: 'device-1',
      disconnectStatus: 'success',
    });

    expect(service.consume()).toEqual({
      deviceId: 'device-1',
      disconnectStatus: 'success',
    });
    expect(service.consume()).toBeNull();
  });

  it('should clear a pending result when navigation does not complete', () => {
    service.record({
      deviceId: 'device-1',
      disconnectStatus: 'failed',
    });

    service.clear();

    expect(service.consume()).toBeNull();
  });
});
