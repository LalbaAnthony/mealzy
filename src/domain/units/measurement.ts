import type {
  MeasurementFamily,
  NormalisedQuantity,
  Quantity,
  Unit,
  UnitNormalisation,
} from '../../types/units';

const measurementFamilies: Readonly<Record<Unit, MeasurementFamily>> = {
  g: 'mass',
  kg: 'mass',
  ml: 'volume',
  l: 'volume',
  tsp: 'spoon',
  tbsp: 'spoon',
  piece: 'count',
};

const unitNormalisations: Readonly<Record<Unit, UnitNormalisation>> = {
  g: { unit: 'g', factor: 1 },
  kg: { unit: 'g', factor: 1000 },
  ml: { unit: 'ml', factor: 1 },
  l: { unit: 'ml', factor: 1000 },
  tsp: { unit: 'tsp', factor: 1 },
  tbsp: { unit: 'tbsp', factor: 1 },
  piece: { unit: 'piece', factor: 1 },
};

export const ALL_UNITS: readonly Unit[] = ['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'piece'];

export function measurementFamilyOf(unit: Unit): MeasurementFamily {
  return measurementFamilies[unit];
}

export function normaliseQuantity(quantity: Quantity): NormalisedQuantity {
  const normalisation = unitNormalisations[quantity.unit];
  return { amount: quantity.amount * normalisation.factor, unit: normalisation.unit };
}
