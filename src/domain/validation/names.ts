export function normaliseName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function namesMatch(left: string, right: string): boolean {
  return normaliseName(left).toLowerCase() === normaliseName(right).toLowerCase();
}

export function isPositiveAmount(amount: number): boolean {
  return Number.isFinite(amount) && amount > 0;
}
