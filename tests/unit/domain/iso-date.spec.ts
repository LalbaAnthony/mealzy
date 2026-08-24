import { describe, expect, it } from 'vitest';
import {
  compareIsoDates,
  formatIsoDateForDisplay,
  isValidIsoDate,
} from '../../../src/domain/date/iso-date';

describe('iso date handling', () => {
  it('accepts a real calendar date', () => {
    expect(isValidIsoDate('2026-08-24')).toBe(true);
  });

  it('rejects a malformed string', () => {
    expect(isValidIsoDate('24-08-2026')).toBe(false);
    expect(isValidIsoDate('')).toBe(false);
  });

  it('rejects a well formed but impossible date', () => {
    expect(isValidIsoDate('2026-02-30')).toBe(false);
    expect(isValidIsoDate('2026-13-01')).toBe(false);
  });

  it('compares dates lexicographically', () => {
    expect(compareIsoDates('2026-08-24', '2026-08-24')).toBe(0);
    expect(compareIsoDates('2026-08-23', '2026-08-24')).toBeLessThan(0);
    expect(compareIsoDates('2026-08-25', '2026-08-24')).toBeGreaterThan(0);
  });

  it('formats a valid date for display', () => {
    expect(formatIsoDateForDisplay('2026-08-24')).toBe('Mon, 24 Aug 2026');
  });

  it('returns an invalid date unchanged', () => {
    expect(formatIsoDateForDisplay('not-a-date')).toBe('not-a-date');
  });
});
