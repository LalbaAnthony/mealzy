import type { Quantity } from '../../types/units';

const PROMOTION_THRESHOLD = 1000;

export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

export function promoteQuantityForDisplay(quantity: Quantity): Quantity {
  if (quantity.unit === 'g' && quantity.amount > PROMOTION_THRESHOLD) {
    return { amount: roundToTwoDecimals(quantity.amount / PROMOTION_THRESHOLD), unit: 'kg' };
  }
  if (quantity.unit === 'ml' && quantity.amount > PROMOTION_THRESHOLD) {
    return { amount: roundToTwoDecimals(quantity.amount / PROMOTION_THRESHOLD), unit: 'l' };
  }
  return { amount: roundToTwoDecimals(quantity.amount), unit: quantity.unit };
}

export function formatQuantity(quantity: Quantity): string {
  const promoted = promoteQuantityForDisplay(quantity);
  return `${String(promoted.amount)} ${promoted.unit}`;
}

export function formatOptionalQuantity(quantity: Quantity | null): string {
  return quantity === null ? '' : formatQuantity(quantity);
}
