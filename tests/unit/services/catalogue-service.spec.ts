import { beforeEach, describe, expect, it } from 'vitest';
import { SEEDED_STAPLE_NAMES, createTestHarness, seedCatalogue } from '../../support/test-harness';

let harness: ReturnType<typeof createTestHarness>;
let groceryId: string;
let produceId: string;

async function createIngredient(name: string, categoryId: string): Promise<string> {
  const result = await harness.services.ingredients.create({ name, categoryId });
  if (!result.ok) {
    throw new Error(`Failed to create ingredient ${name}`);
  }
  return result.value.id;
}

beforeEach(async () => {
  harness = createTestHarness();
  const { grocery, produce } = await seedCatalogue(harness);
  groceryId = grocery.id;
  produceId = produce.id;
});

describe('BR-14 seed data', () => {
  it('creates the reserved category, six aisles and one enabled staple per seeded ingredient', async () => {
    const categories = await harness.services.categories.list();
    const staples = await harness.services.staples.list();
    const ingredients = await harness.services.ingredients.list();

    expect(categories).toHaveLength(7);
    expect(categories.some((category) => category.id === 'uncategorized')).toBe(true);
    expect(staples).toHaveLength(SEEDED_STAPLE_NAMES.length);
    expect(staples.every((staple) => staple.enabled)).toBe(true);
    expect(ingredients.map((ingredient) => ingredient.name)).toEqual(SEEDED_STAPLE_NAMES);
    expect(ingredients.every((ingredient) => ingredient.categoryId === groceryId)).toBe(true);
  });

  it('does not seed twice', async () => {
    await harness.services.seed.ensureSeeded();

    expect(await harness.services.categories.list()).toHaveLength(7);
    expect(await harness.services.staples.list()).toHaveLength(SEEDED_STAPLE_NAMES.length);
  });

  it('refuses to rename or delete the uncategorized category', async () => {
    expect(await harness.services.categories.rename('uncategorized', 'Other')).toMatchObject({
      ok: false,
      error: { code: 'category-reserved' },
    });
    expect(await harness.services.categories.remove('uncategorized')).toMatchObject({
      ok: false,
      error: { code: 'category-reserved' },
    });
  });
});

describe('category management', () => {
  it('creates a category with the next sort order', async () => {
    const result = await harness.services.categories.create('Bakery');

    expect(result).toMatchObject({ ok: true, value: { name: 'Bakery', sortOrder: 7 } });
  });

  it('rejects a duplicate category name', async () => {
    expect(await harness.services.categories.create('grocery')).toMatchObject({
      ok: false,
      error: { code: 'category-name-duplicate' },
    });
  });

  it('renames a category', async () => {
    const result = await harness.services.categories.rename(produceId, 'Fruit and veg');

    expect(result).toMatchObject({ ok: true, value: { name: 'Fruit and veg' } });
  });

  it('blocks deleting a category that still has ingredients', async () => {
    const result = await harness.services.categories.remove(groceryId);

    expect(result).toMatchObject({ ok: false, error: { code: 'category-referenced' } });
    if (!result.ok) {
      expect(result.error.details).toContain('Ingredient: Salt');
    }
  });

  it('deletes an unused category', async () => {
    const created = await harness.services.categories.create('Bakery');
    if (!created.ok) {
      throw new Error('category creation failed');
    }

    expect(await harness.services.categories.remove(created.value.id)).toMatchObject({ ok: true });
  });

  it('reports a missing category', async () => {
    expect(await harness.services.categories.remove('ghost')).toMatchObject({
      ok: false,
      error: { code: 'entity-not-found' },
    });
    expect(await harness.services.categories.rename('ghost', 'X')).toMatchObject({
      ok: false,
      error: { code: 'entity-not-found' },
    });
  });
});

describe('BR-21 an ingredient created from a search lands in uncategorized', () => {
  it('creates the searched name under the reserved category', async () => {
    const result = await harness.services.ingredients.createFromSearch('  Fresh   basil ');

    expect(result).toMatchObject({
      ok: true,
      value: { name: 'Fresh basil', categoryId: 'uncategorized' },
    });
  });

  it('rejects a name that already exists, whatever its category', async () => {
    await createIngredient('Basil', produceId);

    expect(await harness.services.ingredients.createFromSearch('basil')).toMatchObject({
      ok: false,
      error: { code: 'ingredient-name-duplicate' },
    });
  });

  it('rejects an empty search', async () => {
    expect(await harness.services.ingredients.createFromSearch('   ')).toMatchObject({
      ok: false,
      error: { code: 'ingredient-name-required' },
    });
  });
});

describe('BR-12 ingredient deletion is blocked while referenced', () => {
  it('lists the recipes and staples that block deletion', async () => {
    const tomatoId = await createIngredient('Tomato', produceId);
    await harness.services.recipes.create({
      name: 'Salad',
      notes: '',
      ingredients: [{ ingredientId: tomatoId, quantity: null }],
    });

    const result = await harness.services.ingredients.remove(tomatoId);

    expect(result).toMatchObject({ ok: false, error: { code: 'ingredient-referenced' } });
    if (!result.ok) {
      expect(result.error.details).toEqual(['Recipe: Salad']);
    }
  });

  it('blocks deletion of a staple ingredient and names the staple', async () => {
    const ingredients = await harness.services.ingredients.list();
    const salt = ingredients.find((ingredient) => ingredient.name === 'Salt');
    if (salt === undefined) {
      throw new Error('missing seeded salt');
    }

    const result = await harness.services.ingredients.remove(salt.id);

    expect(result).toMatchObject({ ok: false, error: { code: 'ingredient-referenced' } });
    if (!result.ok) {
      expect(result.error.details).toEqual(['Staple: Salt']);
    }
  });

  it('deletes an unreferenced ingredient', async () => {
    const tomatoId = await createIngredient('Tomato', produceId);

    expect(await harness.services.ingredients.remove(tomatoId)).toMatchObject({ ok: true });
  });

  it('rejects duplicate ingredient names and unknown categories', async () => {
    await createIngredient('Tomato', produceId);

    expect(
      await harness.services.ingredients.create({ name: ' tomato ', categoryId: produceId }),
    ).toMatchObject({ ok: false, error: { code: 'ingredient-name-duplicate' } });
    expect(
      await harness.services.ingredients.create({ name: 'Leek', categoryId: 'ghost' }),
    ).toMatchObject({ ok: false, error: { code: 'ingredient-category-unknown' } });
  });

  it('updates an ingredient and stamps the update time', async () => {
    const tomatoId = await createIngredient('Tomato', produceId);
    harness.advanceTo(9000);

    const result = await harness.services.ingredients.update(tomatoId, {
      name: 'Beef tomato',
      categoryId: groceryId,
    });

    expect(result).toMatchObject({
      ok: true,
      value: { name: 'Beef tomato', categoryId: groceryId, updatedAt: 9000 },
    });
  });

  it('reports a missing ingredient', async () => {
    expect(await harness.services.ingredients.remove('ghost')).toMatchObject({
      ok: false,
      error: { code: 'entity-not-found' },
    });
    expect(
      await harness.services.ingredients.update('ghost', { name: 'X', categoryId: produceId }),
    ).toMatchObject({ ok: false, error: { code: 'entity-not-found' } });
  });
});

describe('BR-13 staple management', () => {
  it('creates, updates and deletes a staple', async () => {
    const riceId = await createIngredient('Rice', groceryId);

    const created = await harness.services.staples.create({
      ingredientId: riceId,
      defaultQuantity: { amount: 500, unit: 'ml' },
      enabled: true,
    });
    expect(created).toMatchObject({ ok: true });
    if (!created.ok) {
      throw new Error('staple creation failed');
    }

    const updated = await harness.services.staples.update(created.value.id, {
      ingredientId: riceId,
      defaultQuantity: null,
      enabled: false,
    });
    expect(updated).toMatchObject({ ok: true, value: { enabled: false, defaultQuantity: null } });

    expect(await harness.services.staples.remove(created.value.id)).toMatchObject({ ok: true });
    expect(await harness.services.staples.list()).toHaveLength(SEEDED_STAPLE_NAMES.length);
  });

  it('rejects a second staple for the same ingredient', async () => {
    const ingredients = await harness.services.ingredients.list();
    const salt = ingredients.find((ingredient) => ingredient.name === 'Salt');
    if (salt === undefined) {
      throw new Error('missing seeded salt');
    }

    expect(
      await harness.services.staples.create({
        ingredientId: salt.id,
        defaultQuantity: null,
        enabled: true,
      }),
    ).toMatchObject({ ok: false, error: { code: 'staple-ingredient-duplicate' } });
  });

  it('reports a missing staple', async () => {
    expect(await harness.services.staples.remove('ghost')).toMatchObject({
      ok: false,
      error: { code: 'entity-not-found' },
    });
    expect(
      await harness.services.staples.update('ghost', {
        ingredientId: groceryId,
        defaultQuantity: null,
        enabled: true,
      }),
    ).toMatchObject({ ok: false, error: { code: 'entity-not-found' } });
  });
});
