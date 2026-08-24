import type { MeasurementFamily } from '../types/units';
import type { UnitOption } from '../types/ui';
import type { UnitOptionsApi } from '../types/composables';
import { ALL_UNITS, measurementFamilyOf } from '../domain/units/measurement';

const FAMILY_LABELS: Record<MeasurementFamily, string> = {
  mass: 'weight',
  volume: 'volume',
  spoon: 'spoons',
  count: 'count',
};

export function useUnitOptions(): UnitOptionsApi {
  const unitOptions: readonly UnitOption[] = ALL_UNITS.map((unit) => ({
    value: unit,
    label: `${unit} (${FAMILY_LABELS[measurementFamilyOf(unit)]})`,
  }));

  return { unitOptions };
}
