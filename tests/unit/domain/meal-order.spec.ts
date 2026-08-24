import { describe, expect, it } from 'vitest';
import {
  comparePlannedMeals,
  nextManualOrder,
  planMealMove,
  sharesOrderingGroup,
  sortPlannedMeals,
} from '../../../src/domain/ordering/meal-order';
import { makeMealPlanned } from '../../support/factories';

describe('BR-06 planned meal ordering', () => {
  it('places dated meals before undated meals', () => {
    const dated = makeMealPlanned({ id: 'dated', scheduledDate: '2026-09-01' });
    const undated = makeMealPlanned({ id: 'undated', scheduledDate: null });

    expect(sortPlannedMeals([undated, dated]).map((meal) => meal.id)).toEqual(['dated', 'undated']);
    expect(comparePlannedMeals(dated, undated)).toBeLessThan(0);
    expect(comparePlannedMeals(undated, dated)).toBeGreaterThan(0);
  });

  it('orders dated meals ascending by date', () => {
    const later = makeMealPlanned({ id: 'later', scheduledDate: '2026-09-05' });
    const earlier = makeMealPlanned({ id: 'earlier', scheduledDate: '2026-09-01' });

    expect(sortPlannedMeals([later, earlier]).map((meal) => meal.id)).toEqual(['earlier', 'later']);
  });

  it('orders lunch before dinner on the same date', () => {
    const dinner = makeMealPlanned({ id: 'dinner', scheduledDate: '2026-09-01', slot: 'dinner' });
    const lunch = makeMealPlanned({ id: 'lunch', scheduledDate: '2026-09-01', slot: 'lunch' });

    expect(sortPlannedMeals([dinner, lunch]).map((meal) => meal.id)).toEqual(['lunch', 'dinner']);
  });

  it('places a dated meal without a slot after lunch and dinner', () => {
    const noSlot = makeMealPlanned({ id: 'no-slot', scheduledDate: '2026-09-01', slot: null });
    const dinner = makeMealPlanned({ id: 'dinner', scheduledDate: '2026-09-01', slot: 'dinner' });

    expect(sortPlannedMeals([noSlot, dinner]).map((meal) => meal.id)).toEqual([
      'dinner',
      'no-slot',
    ]);
  });

  it('falls back to manual order for the same date and slot', () => {
    const second = makeMealPlanned({
      id: 'second',
      scheduledDate: '2026-09-01',
      slot: 'lunch',
      manualOrder: 2,
    });
    const first = makeMealPlanned({
      id: 'first',
      scheduledDate: '2026-09-01',
      slot: 'lunch',
      manualOrder: 1,
    });

    expect(sortPlannedMeals([second, first]).map((meal) => meal.id)).toEqual(['first', 'second']);
  });

  it('orders undated meals by manual order alone', () => {
    const second = makeMealPlanned({ id: 'second', manualOrder: 5 });
    const first = makeMealPlanned({ id: 'first', manualOrder: 2 });

    expect(sortPlannedMeals([second, first]).map((meal) => meal.id)).toEqual(['first', 'second']);
  });

  it('reports whether two meals share an ordering group', () => {
    const left = makeMealPlanned({ id: 'a', scheduledDate: '2026-09-01', slot: 'lunch' });
    const right = makeMealPlanned({ id: 'b', scheduledDate: '2026-09-01', slot: 'lunch' });
    const other = makeMealPlanned({ id: 'c', scheduledDate: '2026-09-02', slot: 'lunch' });

    expect(sharesOrderingGroup(left, right)).toBe(true);
    expect(sharesOrderingGroup(left, other)).toBe(false);
  });

  it('computes the next manual order', () => {
    expect(nextManualOrder([])).toBe(1);
    expect(
      nextManualOrder([makeMealPlanned({ manualOrder: 3 }), makeMealPlanned({ manualOrder: 7 })]),
    ).toBe(8);
  });
});

describe('BR-06 manual move', () => {
  const first = makeMealPlanned({ id: 'first', manualOrder: 1 });
  const second = makeMealPlanned({ id: 'second', manualOrder: 2 });
  const third = makeMealPlanned({ id: 'third', manualOrder: 3 });
  const meals = [first, second, third];

  it('swaps manual order with the previous sibling when moving up', () => {
    expect(planMealMove(meals, 'second', 'up')).toEqual([
      { mealPlannedId: 'second', manualOrder: 1 },
      { mealPlannedId: 'first', manualOrder: 2 },
    ]);
  });

  it('swaps manual order with the next sibling when moving down', () => {
    expect(planMealMove(meals, 'second', 'down')).toEqual([
      { mealPlannedId: 'second', manualOrder: 3 },
      { mealPlannedId: 'third', manualOrder: 2 },
    ]);
  });

  it('does nothing when moving the first sibling up', () => {
    expect(planMealMove(meals, 'first', 'up')).toEqual([]);
  });

  it('does nothing when moving the last sibling down', () => {
    expect(planMealMove(meals, 'third', 'down')).toEqual([]);
  });

  it('does nothing for an unknown meal', () => {
    expect(planMealMove(meals, 'ghost', 'up')).toEqual([]);
  });

  it('only moves within the same date and slot group', () => {
    const monday = makeMealPlanned({
      id: 'monday',
      scheduledDate: '2026-09-01',
      slot: 'lunch',
      manualOrder: 1,
    });
    const tuesday = makeMealPlanned({
      id: 'tuesday',
      scheduledDate: '2026-09-02',
      slot: 'lunch',
      manualOrder: 2,
    });

    expect(planMealMove([monday, tuesday], 'tuesday', 'up')).toEqual([]);
  });
});
