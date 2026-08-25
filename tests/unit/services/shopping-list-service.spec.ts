import { beforeEach, describe, expect, it } from 'vitest';
import { SEEDED_STAPLE_LABELS, createTestHarness, seedCatalogue } from '../../support/test-harness';

let harness: ReturnType<typeof createTestHarness>;
let produceId: string;
let dairyId: string;

async function createIngredient(name: string, categoryId: string): Promise<string> {
  const result = await harness.services.ingredients.create({ name, categoryId });
  if (!result.ok) {
    throw new Error(`Failed to create ingredient ${name}`);
  }
  return result.value.id;
}

async function planRecipe(
  name: string,
  ingredients: readonly { ingredientId: string; quantity: { amount: number; unit: 'g' } | null }[],
): Promise<string> {
  const recipe = await harness.services.recipes.create({ name, notes: '', ingredients });
  if (!recipe.ok) {
    throw new Error('recipe creation failed');
  }
  const meal = await harness.services.meals.plan(recipe.value.id, {
    scheduledDate: null,
    slot: null,
  });
  if (!meal.ok) {
    throw new Error('planning failed');
  }
  return meal.value.id;
}

beforeEach(async () => {
  harness = createTestHarness();
  const { produce } = await seedCatalogue(harness);
  produceId = produce.id;
  const categories = await harness.services.categories.list();
  const dairy = categories.find((category) => category.name === 'Dairy');
  if (dairy === undefined) {
    throw new Error('missing dairy category');
  }
  dairyId = dairy.id;
});

describe('BR-18 grouped snapshot', () => {
  it('groups lines by category with uncategorized last', async () => {
    const tomatoId = await createIngredient('Tomato', produceId);
    const creamId = await createIngredient('Cream', dairyId);
    await planRecipe('Soup', [
      { ingredientId: tomatoId, quantity: { amount: 500, unit: 'g' } },
      { ingredientId: creamId, quantity: { amount: 100, unit: 'g' } },
    ]);

    const snapshot = await harness.services.shoppingList.getSnapshot();
    const names = snapshot.groups.map((group) => group.categoryName);

    expect(names).toEqual(['Produce', 'Dairy', 'Grocery']);
    expect(snapshot.totalCount).toBe(SEEDED_STAPLE_LABELS.length + 2);
  });

  it('includes every seeded staple', async () => {
    const snapshot = await harness.services.shoppingList.getSnapshot();
    const grocery = snapshot.groups.find((group) => group.categoryName === 'Grocery');

    expect(grocery?.lines.map((line) => line.label)).toEqual(SEEDED_STAPLE_LABELS);
  });
});

describe('BR-16 purchased state survives recomputation', () => {
  it('persists a tick and keeps it when another meal is added', async () => {
    const tomatoId = await createIngredient('Tomato', produceId);
    await planRecipe('Soup', [{ ingredientId: tomatoId, quantity: { amount: 500, unit: 'g' } }]);

    const key = `ingredient:${tomatoId}:g`;
    await harness.services.shoppingList.setPurchased(key, true);

    const creamId = await createIngredient('Cream', dairyId);
    await planRecipe('Gratin', [{ ingredientId: creamId, quantity: { amount: 200, unit: 'g' } }]);

    const snapshot = await harness.services.shoppingList.getSnapshot();
    expect(snapshot.lines.find((line) => line.key === key)?.purchased).toBe(true);
    expect(snapshot.purchasedCount).toBe(1);
  });

  it('unticks a line', async () => {
    const tomatoId = await createIngredient('Tomato', produceId);
    await planRecipe('Soup', [{ ingredientId: tomatoId, quantity: { amount: 500, unit: 'g' } }]);
    const key = `ingredient:${tomatoId}:g`;

    await harness.services.shoppingList.setPurchased(key, true);
    await harness.services.shoppingList.setPurchased(key, false);

    const snapshot = await harness.services.shoppingList.getSnapshot();
    expect(snapshot.lines.find((line) => line.key === key)?.purchased).toBe(false);
  });
});

describe('BR-07 eaten meals leave the shopping list', () => {
  it('drops the ingredients of an eaten meal', async () => {
    const tomatoId = await createIngredient('Tomato', produceId);
    const mealId = await planRecipe('Soup', [
      { ingredientId: tomatoId, quantity: { amount: 500, unit: 'g' } },
    ]);

    await harness.services.meals.markEaten(mealId);

    const snapshot = await harness.services.shoppingList.getSnapshot();
    expect(snapshot.lines.some((line) => line.label === 'Tomato')).toBe(false);
  });
});

describe('BR-15 and BR-17 ad hoc items and trip reset', () => {
  it('adds an ad hoc item without merging it with an ingredient', async () => {
    const result = await harness.services.adHocItems.create({
      label: 'Salt',
      quantity: null,
      categoryId: dairyId,
    });

    expect(result).toMatchObject({ ok: true });
    const snapshot = await harness.services.shoppingList.getSnapshot();
    const saltLines = snapshot.lines.filter((line) => line.label === 'Salt');
    expect(saltLines).toHaveLength(2);
  });

  it('clears ticks and deletes purchased ad hoc items only', async () => {
    const purchased = await harness.services.adHocItems.create({
      label: 'Light bulbs',
      quantity: null,
      categoryId: dairyId,
    });
    const kept = await harness.services.adHocItems.create({
      label: 'Toilet paper',
      quantity: null,
      categoryId: dairyId,
    });
    if (!purchased.ok || !kept.ok) {
      throw new Error('ad hoc creation failed');
    }

    const tomatoId = await createIngredient('Tomato', produceId);
    await planRecipe('Soup', [{ ingredientId: tomatoId, quantity: { amount: 500, unit: 'g' } }]);

    await harness.services.shoppingList.setPurchased(`adhoc:${purchased.value.id}`, true);
    await harness.services.shoppingList.setPurchased(`ingredient:${tomatoId}:g`, true);

    await harness.services.shoppingList.resetTrip();

    const items = await harness.services.adHocItems.list();
    expect(items.map((item) => item.label)).toEqual(['Toilet paper']);

    const snapshot = await harness.services.shoppingList.getSnapshot();
    expect(snapshot.purchasedCount).toBe(0);
    expect(snapshot.lines.some((line) => line.label === 'Tomato')).toBe(true);
  });

  it('updates and deletes an ad hoc item', async () => {
    const created = await harness.services.adHocItems.create({
      label: 'Bulbs',
      quantity: null,
      categoryId: dairyId,
    });
    if (!created.ok) {
      throw new Error('ad hoc creation failed');
    }

    const updated = await harness.services.adHocItems.update(created.value.id, {
      label: 'Light bulbs',
      quantity: { amount: 4, unit: 'piece' },
      categoryId: dairyId,
    });
    expect(updated).toMatchObject({ ok: true, value: { label: 'Light bulbs' } });

    expect(await harness.services.adHocItems.remove(created.value.id)).toMatchObject({ ok: true });
    expect(await harness.services.adHocItems.list()).toHaveLength(0);
  });

  it('reports a missing ad hoc item', async () => {
    expect(await harness.services.adHocItems.remove('ghost')).toMatchObject({
      ok: false,
      error: { code: 'entity-not-found' },
    });
    expect(
      await harness.services.adHocItems.update('ghost', {
        label: 'X',
        quantity: null,
        categoryId: dairyId,
      }),
    ).toMatchObject({ ok: false, error: { code: 'entity-not-found' } });
  });
});

describe('BR-19 export excludes purchased lines', () => {
  it('renders the grouped plain text list', async () => {
    const tomatoId = await createIngredient('Tomato', produceId);
    const onionId = await createIngredient('Onion', produceId);
    await planRecipe('Soup', [
      { ingredientId: tomatoId, quantity: { amount: 500, unit: 'g' } },
      { ingredientId: onionId, quantity: null },
    ]);

    await harness.services.shoppingList.setPurchased(`ingredient:${onionId}:none`, true);

    const text = await harness.services.shoppingList.buildExportText();

    expect(text.startsWith('Shopping list - 2026-08-24')).toBe(true);
    expect(text).toContain('PRODUCE');
    expect(text).toContain('- Tomato 500 g');
    expect(text).not.toContain('Onion');
    expect(text).toContain('GROCERY');
    expect(text).toContain('- Salt');
  });
});
