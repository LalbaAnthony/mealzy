import type { MealPlannedId } from '../../types/identifiers';
import type { MealPlanned, MealSlot } from '../../types/meal';
import type { MealMoveDirection, MealOrderAdjustment } from '../../types/ordering';
import { compareIsoDates } from '../date/iso-date';

const SLOT_RANKS: Readonly<Record<MealSlot, number>> = {
  lunch: 0,
  dinner: 1,
};

const UNSLOTTED_RANK = 2;

function slotRank(slot: MealSlot | null): number {
  return slot === null ? UNSLOTTED_RANK : SLOT_RANKS[slot];
}

export function comparePlannedMeals(left: MealPlanned, right: MealPlanned): number {
  if (left.scheduledDate !== null && right.scheduledDate !== null) {
    const dateComparison = compareIsoDates(left.scheduledDate, right.scheduledDate);
    if (dateComparison !== 0) {
      return dateComparison;
    }
    const slotComparison = slotRank(left.slot) - slotRank(right.slot);
    if (slotComparison !== 0) {
      return slotComparison;
    }
    return left.manualOrder - right.manualOrder;
  }
  if (left.scheduledDate !== null) {
    return -1;
  }
  if (right.scheduledDate !== null) {
    return 1;
  }
  return left.manualOrder - right.manualOrder;
}

export function sortPlannedMeals(meals: readonly MealPlanned[]): readonly MealPlanned[] {
  return [...meals].sort(comparePlannedMeals);
}

export function sharesOrderingGroup(left: MealPlanned, right: MealPlanned): boolean {
  return left.scheduledDate === right.scheduledDate && left.slot === right.slot;
}

export function nextManualOrder(meals: readonly MealPlanned[]): number {
  return meals.reduce((highest, meal) => Math.max(highest, meal.manualOrder), 0) + 1;
}

export function planMealMove(
  meals: readonly MealPlanned[],
  mealPlannedId: MealPlannedId,
  direction: MealMoveDirection,
): readonly MealOrderAdjustment[] {
  const target = meals.find((meal) => meal.id === mealPlannedId);
  if (target === undefined) {
    return [];
  }
  const siblings = sortPlannedMeals(meals.filter((meal) => sharesOrderingGroup(meal, target)));
  const position = siblings.findIndex((meal) => meal.id === mealPlannedId);
  const neighbourPosition = direction === 'up' ? position - 1 : position + 1;
  if (neighbourPosition < 0) {
    return [];
  }
  const neighbour = siblings.at(neighbourPosition);
  if (neighbour === undefined) {
    return [];
  }
  return [
    { mealPlannedId: target.id, manualOrder: neighbour.manualOrder },
    { mealPlannedId: neighbour.id, manualOrder: target.manualOrder },
  ];
}
