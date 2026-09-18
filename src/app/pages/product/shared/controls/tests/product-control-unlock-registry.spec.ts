import { ProductControlUnlockRegistry } from
  '../product-control-unlock-registry';

describe('ProductControlUnlockRegistry', () => {
  it('keeps controls locked by default', () => {
    const registry = new ProductControlUnlockRegistry();

    expect(registry.hasUnlockedControls).toBeFalse();
    expect(registry.isUnlocked('open-speed')).toBeFalse();
  });

  it('toggles one control independently', () => {
    const registry = new ProductControlUnlockRegistry();

    expect(registry.toggle('open-speed')).toBeTrue();
    expect(registry.hasUnlockedControls).toBeTrue();
    expect(registry.isUnlocked('open-speed')).toBeTrue();
    expect(registry.isUnlocked('close-speed')).toBeFalse();

    expect(registry.toggle('open-speed')).toBeFalse();
    expect(registry.hasUnlockedControls).toBeFalse();
    expect(registry.isUnlocked('open-speed')).toBeFalse();
  });

  it('locks one control without affecting another', () => {
    const registry = new ProductControlUnlockRegistry();

    registry.toggle('open-speed');
    registry.toggle('close-speed');
    registry.lock('open-speed');

    expect(registry.isUnlocked('open-speed')).toBeFalse();
    expect(registry.isUnlocked('close-speed')).toBeTrue();
  });

  it('locks every control', () => {
    const registry = new ProductControlUnlockRegistry();

    registry.toggle('open-speed');
    registry.toggle('short-timing');
    registry.lockAll();

    expect(registry.hasUnlockedControls).toBeFalse();
    expect(registry.isUnlocked('open-speed')).toBeFalse();
    expect(registry.isUnlocked('short-timing')).toBeFalse();
  });
});
