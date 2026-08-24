export type UnitMass = 'g' | 'kg';
export type UnitVolume = 'ml' | 'l';
export type UnitSpoon = 'tsp' | 'tbsp';
export type UnitCount = 'piece';
export type Unit = UnitMass | UnitVolume | UnitSpoon | UnitCount;

export type NormalisedUnit = 'g' | 'ml' | 'tsp' | 'tbsp' | 'piece';
export type QuantityBucket = NormalisedUnit | 'none';
export type MeasurementFamily = 'mass' | 'volume' | 'spoon' | 'count';

export interface Quantity {
  readonly amount: number;
  readonly unit: Unit;
}

export interface NormalisedQuantity {
  readonly amount: number;
  readonly unit: NormalisedUnit;
}

export interface UnitNormalisation {
  readonly unit: NormalisedUnit;
  readonly factor: number;
}
