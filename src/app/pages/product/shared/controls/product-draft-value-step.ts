export interface ProductDraftRange {
  readonly min: number;
  readonly max: number;
}

export type ProductDraftStepDirection = -1 | 1;

export function stepProductDraftValue(
  currentValue: number,
  direction: ProductDraftStepDirection,
  range: ProductDraftRange,
  step = 1,
): number {
  if (!Number.isFinite(currentValue) ||
      !Number.isFinite(range.min) ||
      !Number.isFinite(range.max) ||
      !Number.isFinite(step) ||
      step <= 0 ||
      range.min > range.max) {
    throw new Error('Invalid product draft step configuration.');
  }

  const nextValue = currentValue + (direction * step);
  return Math.min(range.max, Math.max(range.min, nextValue));
}
