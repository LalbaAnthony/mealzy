import { beforeEach, describe, expect, it } from 'vitest';
import {
  SEEDED_CATEGORY_COUNT,
  SEEDED_INGREDIENT_NAMES,
  UNSEEDED_CATEGORY_NAME,
  createTestHarness,
  seedCatalogue,
  seededIngredientId,
} from '../../support/test-harness';

let harness: ReturnType<typeof createTestHarness>;
let produceId: string;

async function buildSampleState(): Promise<void> {
  const tomatoId = await seededIngredientId(harness, 'Tomato');
  const recipe = await harness.services.recipes.create({
    name: 'Soup',
    notes: 'warm',
    ingredients: [{ ingredientId: tomatoId, quantity: { amount: 500, unit: 'g' } }],
  });
  if (!recipe.ok) {
    throw new Error('recipe creation failed');
  }
  await harness.services.meals.plan(recipe.value.id, {
    scheduledDate: '2026-09-01',
    slot: 'dinner',
  });
  await harness.services.adHocItems.create({
    label: 'Light bulbs',
    quantity: { amount: 2, unit: 'piece' },
    categoryId: produceId,
  });
  const staple = await harness.services.staples.create({
    ingredientId: tomatoId,
    defaultQuantity: null,
    enabled: true,
  });
  if (!staple.ok) {
    throw new Error('staple creation failed');
  }
  await harness.services.shoppingList.setPurchased(`ingredient:${tomatoId}:g`, true);
  await harness.services.settings.setThemePreference('dark');
}

beforeEach(async () => {
  harness = createTestHarness();
  const { produce } = await seedCatalogue(harness);
  produceId = produce.id;
});

describe('local data summary', () => {
  it('counts what an erase would destroy', async () => {
    await buildSampleState();

    const summary = await harness.services.dataReset.summarise();

    expect(summary).toStrictEqual({
      recipes: 1,
      plannedMeals: 1,
      ingredients: SEEDED_INGREDIENT_NAMES.length,
      categories: SEEDED_CATEGORY_COUNT,
      staples: 1,
      adHocItems: 1,
      purchasedTicks: 1,
    });
  });
});

describe('BR-20 deleting all local data', () => {
  it('removes every recipe, meal, ad hoc item and purchased tick', async () => {
    await buildSampleState();

    await harness.services.dataReset.eraseEverything();

    expect(await harness.services.recipes.list()).toStrictEqual([]);
    expect(await harness.services.meals.list()).toStrictEqual([]);
    expect(await harness.services.adHocItems.list()).toStrictEqual([]);
    expect(await harness.repositories.meta.getPurchasedKeys()).toStrictEqual([]);
  });

  it('restores the first-run seed data', async () => {
    await buildSampleState();
    const categoriesBefore = await harness.services.categories.list();
    const created = await harness.services.categories.create(UNSEEDED_CATEGORY_NAME);
    expect(created).toMatchObject({ ok: true });

    await harness.services.dataReset.eraseEverything();

    const categories = await harness.services.categories.list();
    const staples = await harness.services.staples.list();
    const ingredients = await harness.services.ingredients.list();
    expect(categories.map((category) => category.name).sort()).toStrictEqual(
      categoriesBefore.map((category) => category.name).sort(),
    );
    expect(staples).toStrictEqual([]);
    expect(ingredients.map((ingredient) => ingredient.name).sort()).toStrictEqual(
      [...SEEDED_INGREDIENT_NAMES].sort(),
    );
  });

  it('resets the stored preferences to the first-run defaults', async () => {
    await buildSampleState();

    await harness.services.dataReset.eraseEverything();

    expect(await harness.services.settings.getPreferences()).toStrictEqual({
      themePreference: 'system',
    });
  });

  it('keeps the schema version current so the next start does not seed again', async () => {
    await buildSampleState();

    await harness.services.dataReset.eraseEverything();
    await harness.services.seed.ensureSeeded();

    expect(await harness.repositories.meta.getSchemaVersion()).toBe(harness.schemaVersion);
    expect(await harness.services.categories.list()).toHaveLength(SEEDED_CATEGORY_COUNT);
  });

  it('leaves a summary of nothing but the seed data behind', async () => {
    await buildSampleState();

    await harness.services.dataReset.eraseEverything();

    expect(await harness.services.dataReset.summarise()).toStrictEqual({
      recipes: 0,
      plannedMeals: 0,
      ingredients: SEEDED_INGREDIENT_NAMES.length,
      categories: SEEDED_CATEGORY_COUNT,
      staples: 0,
      adHocItems: 0,
      purchasedTicks: 0,
    });
  });
});
