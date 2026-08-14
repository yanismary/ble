import { stepProductDraftValue } from './product-draft-step';

describe('stepProductDraftValue', () => {
  const range = { min: 10, max: 20 };

  it('increments by one by default', () => {
    expect(stepProductDraftValue(14, 1, range)).toBe(15);
  });

  it('decrements by one by default', () => {
    expect(stepProductDraftValue(14, -1, range)).toBe(13);
  });

  it('clamps at the upper limit', () => {
    expect(stepProductDraftValue(20, 1, range)).toBe(20);
  });

  it('clamps at the lower limit', () => {
    expect(stepProductDraftValue(10, -1, range)).toBe(10);
  });

  it('supports an explicit step', () => {
    expect(stepProductDraftValue(12, 1, range, 3)).toBe(15);
  });

  it('rejects invalid ranges and step values', () => {
    expect(() =>
      stepProductDraftValue(12, 1, { min: 20, max: 10 }),
    ).toThrowError();
    expect(() =>
      stepProductDraftValue(12, 1, range, 0),
    ).toThrowError();
  });
});
