import type { MealPlannedId } from './identifiers';

export type MealMoveDirection = 'up' | 'down';

export interface MealOrderAdjustment {
  readonly mealPlannedId: MealPlannedId;
  readonly manualOrder: number;
}
