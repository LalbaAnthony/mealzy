import { beforeEach, describe, expect, it } from 'vitest';
import { createTestHarness, seedCatalogue } from '../../support/test-harness';

let harness: ReturnType<typeof createTestHarness>;

async function createRecipe(name: string): Promise<string> {
  const result = await harness.services.recipes.create({ name, notes: '', ingredients: [] });
  if (!result.ok) {
    throw new Error(`Failed to create recipe ${name}`);
  }
  return result.value.id;
}

async function planMeal(recipeId: string, scheduledDate: string | null): Promise<string> {
  const result = await harness.services.meals.plan(recipeId, { scheduledDate, slot: null });
  if (!result.ok) {
    throw new Error('Failed to plan meal');
  }
  return result.value.id;
}

beforeEach(async () => {
  harness = createTestHarness();
  await seedCatalogue(harness);
});

describe('BR-05 schedule and slot are optional and independent', () => {
  it('plans a meal with neither a date nor a slot', async () => {
    const recipeId = await createRecipe('Soup');
    const result = await harness.services.meals.plan(recipeId, {
      scheduledDate: null,
      slot: null,
    });

    expect(result).toMatchObject({ ok: true });
    if (result.ok) {
      expect(result.value.scheduledDate).toBeNull();
      expect(result.value.slot).toBeNull();
      expect(result.value.status).toBe('planned');
      expect(result.value.recipeNameSnapshot).toBe('Soup');
    }
  });

  it('rejects an invalid date', async () => {
    const recipeId = await createRecipe('Soup');
    const result = await harness.services.meals.plan(recipeId, {
      scheduledDate: '2026-02-30',
      slot: 'lunch',
    });

    expect(result).toMatchObject({ ok: false, error: { code: 'meal-date-invalid' } });
  });

  it('rejects an unknown recipe', async () => {
    const result = await harness.services.meals.plan('ghost', {
      scheduledDate: null,
      slot: null,
    });

    expect(result).toMatchObject({ ok: false, error: { code: 'meal-recipe-unknown' } });
  });

  it('updates the date and slot of an existing meal', async () => {
    const recipeId = await createRecipe('Soup');
    const mealId = await planMeal(recipeId, null);

    const result = await harness.services.meals.update(mealId, {
      scheduledDate: '2026-09-02',
      slot: 'lunch',
    });

    expect(result).toMatchObject({
      ok: true,
      value: { scheduledDate: '2026-09-02', slot: 'lunch' },
    });
  });
});

describe('BR-06 manual ordering', () => {
  it('assigns increasing manual order to new meals and swaps them on move', async () => {
    const recipeA = await createRecipe('A');
    const recipeB = await createRecipe('B');
    const firstId = await planMeal(recipeA, null);
    const secondId = await planMeal(recipeB, null);

    const before = await harness.services.meals.list();
    expect(before.find((meal) => meal.id === firstId)?.manualOrder).toBe(1);
    expect(before.find((meal) => meal.id === secondId)?.manualOrder).toBe(2);

    await harness.services.meals.moveUp(secondId);

    const after = await harness.services.meals.list();
    expect(after.find((meal) => meal.id === secondId)?.manualOrder).toBe(1);
    expect(after.find((meal) => meal.id === firstId)?.manualOrder).toBe(2);
  });

  it('moves a meal down', async () => {
    const recipeA = await createRecipe('A');
    const recipeB = await createRecipe('B');
    const firstId = await planMeal(recipeA, null);
    const secondId = await planMeal(recipeB, null);

    await harness.services.meals.moveDown(firstId);

    const after = await harness.services.meals.list();
    expect(after.find((meal) => meal.id === firstId)?.manualOrder).toBe(2);
    expect(after.find((meal) => meal.id === secondId)?.manualOrder).toBe(1);
  });

  it('leaves the order untouched at the boundaries', async () => {
    const recipeId = await createRecipe('Only');
    const mealId = await planMeal(recipeId, null);

    await harness.services.meals.moveUp(mealId);
    await harness.services.meals.moveDown(mealId);

    const meals = await harness.services.meals.list();
    expect(meals[0]?.manualOrder).toBe(1);
  });
});

describe('BR-07 and BR-08 eaten status', () => {
  it('marks a meal eaten with a timestamp', async () => {
    const recipeId = await createRecipe('Soup');
    const mealId = await planMeal(recipeId, null);

    harness.advanceTo(5000);
    const result = await harness.services.meals.markEaten(mealId);

    expect(result).toMatchObject({ ok: true, value: { status: 'eaten', eatenAt: 5000 } });
  });

  it('reverses the eaten status and clears the timestamp', async () => {
    const recipeId = await createRecipe('Soup');
    const mealId = await planMeal(recipeId, null);

    await harness.services.meals.markEaten(mealId);
    const result = await harness.services.meals.markPlanned(mealId);

    expect(result).toMatchObject({ ok: true, value: { status: 'planned', eatenAt: null } });
  });

  it('refreshes a stale snapshot when a meal returns to planned', async () => {
    const recipeId = await createRecipe('Old Name');
    const mealId = await planMeal(recipeId, null);
    await harness.services.meals.markEaten(mealId);

    await harness.services.recipes.update(recipeId, {
      name: 'New Name',
      notes: '',
      ingredients: [],
    });
    const result = await harness.services.meals.markPlanned(mealId);

    expect(result).toMatchObject({ ok: true, value: { recipeNameSnapshot: 'New Name' } });
  });

  it('keeps the snapshot when the recipe is gone', async () => {
    const recipeId = await createRecipe('Soup');
    const mealId = await planMeal(recipeId, null);
    await harness.services.meals.markEaten(mealId);
    await harness.services.recipes.remove(recipeId);

    const result = await harness.services.meals.markPlanned(mealId);

    expect(result).toMatchObject({ ok: true, value: { recipeNameSnapshot: 'Soup' } });
  });

  it('does not delete the meal when marking it eaten', async () => {
    const recipeId = await createRecipe('Soup');
    const mealId = await planMeal(recipeId, null);

    await harness.services.meals.markEaten(mealId);

    expect(await harness.services.meals.list()).toHaveLength(1);
  });
});

describe('BR-09 permanent deletion', () => {
  it('removes the meal', async () => {
    const recipeId = await createRecipe('Soup');
    const mealId = await planMeal(recipeId, null);

    const result = await harness.services.meals.remove(mealId);

    expect(result).toMatchObject({ ok: true });
    expect(await harness.services.meals.list()).toHaveLength(0);
  });

  it('reports a missing meal for every operation', async () => {
    expect(await harness.services.meals.remove('ghost')).toMatchObject({
      ok: false,
      error: { code: 'entity-not-found' },
    });
    expect(await harness.services.meals.markEaten('ghost')).toMatchObject({
      ok: false,
      error: { code: 'entity-not-found' },
    });
    expect(await harness.services.meals.markPlanned('ghost')).toMatchObject({
      ok: false,
      error: { code: 'entity-not-found' },
    });
    expect(
      await harness.services.meals.update('ghost', { scheduledDate: null, slot: null }),
    ).toMatchObject({ ok: false, error: { code: 'entity-not-found' } });
  });
});
