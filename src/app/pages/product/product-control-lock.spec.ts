import { ProductControlLockRegistry } from './product-control-lock';

describe('ProductControlLockRegistry', () => {
  it('keeps controls locked by default', () => {
    const registry = new ProductControlLockRegistry();

    expect(registry.isUnlocked('open-speed')).toBeFalse();
  });

  it('toggles one control independently', () => {
    const registry = new ProductControlLockRegistry();

    expect(registry.toggle('open-speed')).toBeTrue();
    expect(registry.isUnlocked('open-speed')).toBeTrue();
    expect(registry.isUnlocked('close-speed')).toBeFalse();

    expect(registry.toggle('open-speed')).toBeFalse();
    expect(registry.isUnlocked('open-speed')).toBeFalse();
  });

  it('locks one control without affecting another', () => {
    const registry = new ProductControlLockRegistry();

    registry.toggle('open-speed');
    registry.toggle('close-speed');
    registry.lock('open-speed');

    expect(registry.isUnlocked('open-speed')).toBeFalse();
    expect(registry.isUnlocked('close-speed')).toBeTrue();
  });

  it('locks every control', () => {
    const registry = new ProductControlLockRegistry();

    registry.toggle('open-speed');
    registry.toggle('short-timing');
    registry.lockAll();

    expect(registry.isUnlocked('open-speed')).toBeFalse();
    expect(registry.isUnlocked('short-timing')).toBeFalse();
  });
});
