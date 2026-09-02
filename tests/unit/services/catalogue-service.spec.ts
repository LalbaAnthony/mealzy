import { beforeEach, describe, expect, it } from 'vitest';
import {
  NEXT_CATEGORY_SORT_ORDER,
  SEEDED_CATEGORY_COUNT,
  SEEDED_INGREDIENT_NAMES,
  UNSEEDED_CATEGORY_NAME,
  UNSEEDED_INGREDIENT_NAME,
  createTestHarness,
  seedCatalogue,
  seededIngredientId,
} from '../../support/test-harness';

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

async function seededTomatoId(): Promise<string> {
  return seededIngredientId(harness, 'Tomato');
}

async function createStaple(ingredientId: string): Promise<string> {
  const result = await harness.services.staples.create({
    ingredientId,
    defaultQuantity: null,
    enabled: true,
  });
  if (!result.ok) {
    throw new Error('Failed to create staple');
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
  it('creates the reserved category, the aisles and the catalogue ingredients', async () => {
    const categories = await harness.services.categories.list();
    const ingredients = await harness.services.ingredients.list();
    const categoryIds = new Set(categories.map((category) => category.id));

    expect(categories).toHaveLength(SEEDED_CATEGORY_COUNT);
    expect(categories.some((category) => category.id === 'uncategorized')).toBe(true);
    expect(ingredients.map((ingredient) => ingredient.name)).toEqual(SEEDED_INGREDIENT_NAMES);
    expect(ingredients.every((ingredient) => categoryIds.has(ingredient.categoryId))).toBe(true);
  });

  it('creates no staple', async () => {
    expect(await harness.services.staples.list()).toStrictEqual([]);
  });

  it('does not seed twice', async () => {
    await harness.services.seed.ensureSeeded();

    expect(await harness.services.categories.list()).toHaveLength(SEEDED_CATEGORY_COUNT);
    expect(await harness.services.ingredients.list()).toHaveLength(SEEDED_INGREDIENT_NAMES.length);
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
    const result = await harness.services.categories.create(UNSEEDED_CATEGORY_NAME);

    expect(result).toMatchObject({
      ok: true,
      value: { name: UNSEEDED_CATEGORY_NAME, sortOrder: NEXT_CATEGORY_SORT_ORDER },
    });
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
    const created = await harness.services.categories.create(UNSEEDED_CATEGORY_NAME);
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
    const ingredients = await harness.services.ingredients.list();
    const basil = ingredients.find((ingredient) => ingredient.name === 'Basil');
    expect(basil?.categoryId).not.toBe('uncategorized');

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
    const tomatoId = await seededTomatoId();
    await harness.services.recipes.create({
      name: 'Salad',
      notes: '',
      instructions: '',
      ingredients: [{ ingredientId: tomatoId, quantity: null }],
    });

    const result = await harness.services.ingredients.remove(tomatoId);

    expect(result).toMatchObject({ ok: false, error: { code: 'ingredient-referenced' } });
    if (!result.ok) {
      expect(result.error.details).toEqual(['Recipe: Salad']);
    }
  });

  it('blocks deletion of a staple ingredient and names the staple', async () => {
    const saltId = await seededIngredientId(harness, 'Salt');
    await createStaple(saltId);

    const result = await harness.services.ingredients.remove(saltId);

    expect(result).toMatchObject({ ok: false, error: { code: 'ingredient-referenced' } });
    if (!result.ok) {
      expect(result.error.details).toEqual(['Staple: Salt']);
    }
  });

  it('deletes an unreferenced ingredient', async () => {
    const tomatoId = await seededTomatoId();

    expect(await harness.services.ingredients.remove(tomatoId)).toMatchObject({ ok: true });
  });

  it('rejects duplicate ingredient names and unknown categories', async () => {
    await seededTomatoId();

    expect(
      await harness.services.ingredients.create({ name: ' tomato ', categoryId: produceId }),
    ).toMatchObject({ ok: false, error: { code: 'ingredient-name-duplicate' } });
    expect(
      await harness.services.ingredients.create({
        name: UNSEEDED_INGREDIENT_NAME,
        categoryId: 'ghost',
      }),
    ).toMatchObject({ ok: false, error: { code: 'ingredient-category-unknown' } });
  });

  it('updates an ingredient and stamps the update time', async () => {
    const tomatoId = await seededTomatoId();
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
    expect(await harness.services.staples.list()).toStrictEqual([]);
  });

  it('rejects a second staple for the same ingredient', async () => {
    const saltId = await seededIngredientId(harness, 'Salt');
    await createStaple(saltId);

    expect(
      await harness.services.staples.create({
        ingredientId: saltId,
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
