import { describe, expect, it } from 'vitest';
import {
  ALL_UNITS,
  measurementFamilyOf,
  normaliseQuantity,
} from '../../../src/domain/units/measurement';
import {
  formatOptionalQuantity,
  formatQuantity,
  promoteQuantityForDisplay,
  roundToTwoDecimals,
} from '../../../src/domain/units/format';

describe('measurement families', () => {
  it('maps every unit to a family', () => {
    expect(ALL_UNITS.map(measurementFamilyOf)).toEqual([
      'mass',
      'mass',
      'volume',
      'volume',
      'spoon',
      'spoon',
      'count',
    ]);
  });
});

describe('quantity normalisation', () => {
  it('converts kg to g', () => {
    expect(normaliseQuantity({ amount: 1.5, unit: 'kg' })).toEqual({ amount: 1500, unit: 'g' });
  });

  it('converts l to ml', () => {
    expect(normaliseQuantity({ amount: 2, unit: 'l' })).toEqual({ amount: 2000, unit: 'ml' });
  });

  it('leaves g and ml unchanged', () => {
    expect(normaliseQuantity({ amount: 200, unit: 'g' })).toEqual({ amount: 200, unit: 'g' });
    expect(normaliseQuantity({ amount: 50, unit: 'ml' })).toEqual({ amount: 50, unit: 'ml' });
  });

  it('keeps spoons and pieces in their own buckets', () => {
    expect(normaliseQuantity({ amount: 2, unit: 'tsp' })).toEqual({ amount: 2, unit: 'tsp' });
    expect(normaliseQuantity({ amount: 3, unit: 'tbsp' })).toEqual({ amount: 3, unit: 'tbsp' });
    expect(normaliseQuantity({ amount: 4, unit: 'piece' })).toEqual({ amount: 4, unit: 'piece' });
  });
});

describe('display normalisation', () => {
  it('keeps grams at exactly 1000', () => {
    expect(formatQuantity({ amount: 1000, unit: 'g' })).toBe('1000 g');
  });

  it('promotes grams just above 1000', () => {
    expect(formatQuantity({ amount: 1001, unit: 'g' })).toBe('1 kg');
    expect(formatQuantity({ amount: 1500, unit: 'g' })).toBe('1.5 kg');
  });

  it('keeps millilitres at exactly 1000', () => {
    expect(formatQuantity({ amount: 1000, unit: 'ml' })).toBe('1000 ml');
  });

  it('promotes millilitres just above 1000', () => {
    expect(formatQuantity({ amount: 1250, unit: 'ml' })).toBe('1.25 l');
  });

  it('never promotes spoons or pieces', () => {
    expect(formatQuantity({ amount: 1200, unit: 'tsp' })).toBe('1200 tsp');
    expect(formatQuantity({ amount: 1200, unit: 'piece' })).toBe('1200 piece');
  });

  it('leaves already promoted units untouched', () => {
    expect(promoteQuantityForDisplay({ amount: 2, unit: 'kg' })).toEqual({ amount: 2, unit: 'kg' });
    expect(promoteQuantityForDisplay({ amount: 2, unit: 'l' })).toEqual({ amount: 2, unit: 'l' });
  });

  it('rounds to at most two decimals', () => {
    expect(roundToTwoDecimals(1.005)).toBe(1);
    expect(roundToTwoDecimals(1.2345)).toBe(1.23);
    expect(formatQuantity({ amount: 1333, unit: 'g' })).toBe('1.33 kg');
  });

  it('formats an absent quantity as an empty string', () => {
    expect(formatOptionalQuantity(null)).toBe('');
    expect(formatOptionalQuantity({ amount: 3, unit: 'piece' })).toBe('3 piece');
  });
});
