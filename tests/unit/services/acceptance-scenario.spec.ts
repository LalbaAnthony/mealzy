import { beforeEach, describe, expect, it } from 'vitest';
import type { AppServices } from '../../../src/types/container';
import type { AppRepositories } from '../../../src/types/persistence';
import { sortPlannedMeals } from '../../../src/domain/ordering/meal-order';
import { createTestHarness, seedCatalogue } from '../../support/test-harness';

let harness: ReturnType<typeof createTestHarness>;
let services: AppServices;
let repositories: AppRepositories;

let produceId = '';
let dairyId = '';
let tomatoId = '';
let onionId = '';
let creamId = '';
let soupMealId = '';
let stewMealId = '';
let gratinMealId = '';
let bulbsId = '';

async function createIngredient(name: string, categoryId: string): Promise<string> {
  const result = await services.ingredients.create({ name, categoryId });
  if (!result.ok) {
    throw new Error(`could not create ${name}`);
  }
  return result.value.id;
}

async function createRecipeAndPlan(
  name: string,
  ingredients: readonly {
    ingredientId: string;
    quantity: { amount: number; unit: 'g' | 'kg' | 'piece' } | null;
  }[],
): Promise<string> {
  const recipe = await services.recipes.create({ name, notes: '', ingredients });
  if (!recipe.ok) {
    throw new Error(`could not create recipe ${name}`);
  }
  const meal = await services.meals.plan(recipe.value.id, { scheduledDate: null, slot: null });
  if (!meal.ok) {
    throw new Error(`could not plan ${name}`);
  }
  return meal.value.id;
}

function reloadTheApplication(): void {
  harness = createTestHarness(repositories);
  services = harness.services;
}

beforeEach(async () => {
  harness = createTestHarness();
  services = harness.services;
  repositories = harness.repositories;

  const { produce } = await seedCatalogue(harness);
  produceId = produce.id;
  const categories = await services.categories.list();
  const dairy = categories.find((category) => category.name === 'Dairy');
  if (dairy === undefined) {
    throw new Error('missing dairy');
  }
  dairyId = dairy.id;

  tomatoId = await createIngredient('Tomato', produceId);
  onionId = await createIngredient('Onion', produceId);
  creamId = await createIngredient('Cream', dairyId);

  soupMealId = await createRecipeAndPlan('Tomato soup', [
    { ingredientId: tomatoId, quantity: { amount: 500, unit: 'g' } },
    { ingredientId: onionId, quantity: { amount: 2, unit: 'piece' } },
  ]);
  stewMealId = await createRecipeAndPlan('Tomato stew', [
    { ingredientId: tomatoId, quantity: { amount: 1, unit: 'kg' } },
    { ingredientId: creamId, quantity: { amount: 200, unit: 'g' } },
  ]);
  gratinMealId = await createRecipeAndPlan('Gratin', [{ ingredientId: creamId, quantity: null }]);
});

describe('acceptance scenario', () => {
  it('merges the shared ingredient and keeps mixed units on adjacent distinct lines', async () => {
    const snapshot = await services.shoppingList.getSnapshot();

    const tomatoLines = snapshot.lines.filter((line) => line.label === 'Tomato');
    expect(tomatoLines).toHaveLength(1);
    expect(tomatoLines[0]?.quantity).toEqual({ amount: 1500, unit: 'g' });
    expect(tomatoLines[0]?.sources).toHaveLength(2);

    const creamLines = snapshot.lines.filter((line) => line.label === 'Cream');
    expect(creamLines.map((line) => line.key)).toEqual([
      `ingredient:${creamId}:g`,
      `ingredient:${creamId}:none`,
    ]);

    const dairyGroup = snapshot.groups.find((group) => group.categoryName === 'Dairy');
    expect(dairyGroup?.lines.map((line) => line.key)).toEqual([
      `ingredient:${creamId}:g`,
      `ingredient:${creamId}:none`,
    ]);
  });

  it('lists the four seeded staples', async () => {
    const snapshot = await services.shoppingList.getSnapshot();
    const grocery = snapshot.groups.find((group) => group.categoryName === 'Grocery');

    expect(grocery?.lines.map((line) => line.label)).toEqual(['Butter', 'Flour', 'Pepper', 'Salt']);
  });

  it('keeps ticks across a reload and across adding a fourth meal', async () => {
    const added = await services.adHocItems.create({
      label: 'Light bulbs',
      quantity: { amount: 4, unit: 'piece' },
      categoryId: dairyId,
    });
    if (!added.ok) {
      throw new Error('could not add the ad hoc item');
    }
    bulbsId = added.value.id;

    const before = await services.shoppingList.getSnapshot();
    const tickedKeys = before.lines.filter((_, index) => index % 2 === 0).map((line) => line.key);
    for (const key of tickedKeys) {
      await services.shoppingList.setPurchased(key, true);
    }
    await services.shoppingList.setPurchased(`adhoc:${bulbsId}`, true);

    reloadTheApplication();

    const afterReload = await services.shoppingList.getSnapshot();
    for (const key of tickedKeys) {
      expect(afterReload.lines.find((line) => line.key === key)?.purchased).toBe(true);
    }

    await createRecipeAndPlan('Bread', [{ ingredientId: onionId, quantity: null }]);

    const afterFourthMeal = await services.shoppingList.getSnapshot();
    for (const key of tickedKeys) {
      expect(afterFourthMeal.lines.find((line) => line.key === key)?.purchased).toBe(true);
    }
    expect(afterFourthMeal.lines.some((line) => line.key === `ingredient:${onionId}:none`)).toBe(
      true,
    );
  });

  it('exports the list in the documented plain text format', async () => {
    const text = await services.shoppingList.buildExportText();
    const lines = text.split('\n');

    expect(lines[0]).toBe('Shopping list - 2026-08-24');
    expect(lines[1]).toBe('');
    expect(lines[2]).toBe('PRODUCE');
    expect(lines).toContain('- Onion 2 piece');
    expect(lines).toContain('- Tomato 1.5 kg');
    expect(lines).toContain('DAIRY');
    expect(lines).toContain('- Cream 200 g');
    expect(lines).toContain('- Cream');
    expect(lines).toContain('GROCERY');
    expect(lines).toContain('- Salt');
  });

  it('BR-07, BR-08 and BR-10 move a meal out of the list and back', async () => {
    await services.meals.markEaten(stewMealId);

    const afterEaten = await services.shoppingList.getSnapshot();
    const tomato = afterEaten.lines.find((line) => line.label === 'Tomato');
    expect(tomato?.quantity).toEqual({ amount: 500, unit: 'g' });
    expect(afterEaten.lines.some((line) => line.key === `ingredient:${creamId}:g`)).toBe(false);

    const allMeals = await services.meals.list();
    expect(allMeals.filter((meal) => meal.status === 'planned')).toHaveLength(2);
    expect(allMeals.filter((meal) => meal.status === 'eaten').map((meal) => meal.id)).toEqual([
      stewMealId,
    ]);

    await services.meals.markPlanned(stewMealId);

    const afterUnmark = await services.shoppingList.getSnapshot();
    expect(afterUnmark.lines.find((line) => line.label === 'Tomato')?.quantity).toEqual({
      amount: 1500,
      unit: 'g',
    });
    expect((await services.meals.list()).every((meal) => meal.status === 'planned')).toBe(true);
  });

  it('BR-17 resets the trip, clearing ticks and deleting purchased ad hoc items only', async () => {
    const purchased = await services.adHocItems.create({
      label: 'Light bulbs',
      quantity: null,
      categoryId: dairyId,
    });
    const kept = await services.adHocItems.create({
      label: 'Toilet paper',
      quantity: null,
      categoryId: dairyId,
    });
    if (!purchased.ok || !kept.ok) {
      throw new Error('could not add the ad hoc items');
    }

    await services.shoppingList.setPurchased(`adhoc:${purchased.value.id}`, true);
    await services.shoppingList.setPurchased(`ingredient:${tomatoId}:g`, true);

    await services.shoppingList.resetTrip();

    const snapshot = await services.shoppingList.getSnapshot();
    expect(snapshot.purchasedCount).toBe(0);
    expect((await services.adHocItems.list()).map((item) => item.label)).toEqual(['Toilet paper']);
    expect(snapshot.lines.some((line) => line.label === 'Tomato')).toBe(true);
  });

  it('restores an identical state from a backup after the data is wiped', async () => {
    await services.adHocItems.create({
      label: 'Light bulbs',
      quantity: { amount: 4, unit: 'piece' },
      categoryId: dairyId,
    });
    await services.shoppingList.setPurchased(`ingredient:${tomatoId}:g`, true);
    await services.meals.markEaten(gratinMealId);
    await services.settings.setThemePreference('dark');

    const backup = await services.backup.exportDocument();
    const expectedSnapshot = await services.shoppingList.getSnapshot();
    const expectedMeals = sortPlannedMeals(await services.meals.list());
    const expectedRecipes = await services.recipes.list();

    const wiped = createTestHarness();
    const result = await wiped.services.backup.importDocument(backup);
    expect(result).toMatchObject({ ok: true });

    const restoredSnapshot = await wiped.services.shoppingList.getSnapshot();
    expect(restoredSnapshot.lines).toEqual(expectedSnapshot.lines);
    expect(restoredSnapshot.groups).toEqual(expectedSnapshot.groups);
    expect(restoredSnapshot.purchasedCount).toBe(expectedSnapshot.purchasedCount);
    expect(sortPlannedMeals(await wiped.services.meals.list())).toEqual(expectedMeals);
    expect(await wiped.services.recipes.list()).toEqual(expectedRecipes);
    expect(await wiped.services.settings.getPreferences()).toEqual({ themePreference: 'dark' });
  });

  it('BR-11 blocks deleting a recipe that a planned meal still uses', async () => {
    const recipes = await services.recipes.list();
    const soup = recipes.find((recipe) => recipe.name === 'Tomato soup');
    if (soup === undefined) {
      throw new Error('missing soup recipe');
    }

    const blocked = await services.recipes.remove(soup.id);
    expect(blocked).toMatchObject({
      ok: false,
      error: { code: 'recipe-referenced-by-planned-meals' },
    });

    await services.meals.markEaten(soupMealId);

    expect(await services.recipes.remove(soup.id)).toMatchObject({ ok: true });
    const survivingMeal = (await services.meals.list()).find((meal) => meal.id === soupMealId);
    expect(survivingMeal?.recipeNameSnapshot).toBe('Tomato soup');
  });
});
