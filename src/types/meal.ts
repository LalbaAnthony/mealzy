import type { EpochMillis, IsoDate, MealPlannedId, RecipeId } from './identifiers';

export type MealSlot = 'lunch' | 'dinner';
export type MealPlannedStatus = 'planned' | 'eaten';
export type MealFilter = 'planned' | 'eaten' | 'all';

export interface MealPlanned {
  readonly id: MealPlannedId;
  readonly recipeId: RecipeId;
  readonly recipeNameSnapshot: string;
  readonly scheduledDate: IsoDate | null;
  readonly slot: MealSlot | null;
  readonly manualOrder: number;
  readonly status: MealPlannedStatus;
  readonly eatenAt: EpochMillis | null;
  readonly createdAt: EpochMillis;
  readonly updatedAt: EpochMillis;
}
