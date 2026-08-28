import { beforeEach, describe, expect, it } from 'vitest';
import { createTestHarness, seedCatalogue, seededIngredientId } from '../../support/test-harness';

let harness: ReturnType<typeof createTestHarness>;

beforeEach(async () => {
  harness = createTestHarness();
  await seedCatalogue(harness);
});

describe('BR-01 recipe names are unique', () => {
  it('rejects a duplicate name regardless of case', async () => {
    const first = await harness.services.recipes.create({
      name: 'Tomato Soup',
      notes: '',
      ingredients: [],
    });
    const second = await harness.services.recipes.create({
      name: '  tomato soup ',
      notes: '',
      ingredients: [],
    });

    expect(first.ok).toBe(true);
    expect(second).toMatchObject({ ok: false, error: { code: 'recipe-name-duplicate' } });
    expect(await harness.services.recipes.list()).toHaveLength(1);
  });
});

describe('BR-02 and BR-03 recipe ingredients', () => {
  it('stores an ingredient without a quantity', async () => {
    const tomatoId = await seededIngredientId(harness, 'Tomato');
    const result = await harness.services.recipes.create({
      name: 'Salad',
      notes: '',
      ingredients: [{ ingredientId: tomatoId, quantity: null }],
    });

    expect(result).toMatchObject({ ok: true });
    if (result.ok) {
      expect(result.value.ingredients).toEqual([{ ingredientId: tomatoId, quantity: null }]);
    }
  });

  it('rejects the same ingredient twice', async () => {
    const tomatoId = await seededIngredientId(harness, 'Tomato');
    const result = await harness.services.recipes.create({
      name: 'Salad',
      notes: '',
      ingredients: [
        { ingredientId: tomatoId, quantity: null },
        { ingredientId: tomatoId, quantity: { amount: 2, unit: 'piece' } },
      ],
    });

    expect(result).toMatchObject({ ok: false, error: { code: 'recipe-ingredient-duplicate' } });
  });
});

describe('BR-04 recipe name snapshots', () => {
  it('refreshes the snapshot of planned meals when the recipe is renamed', async () => {
    const created = await harness.services.recipes.create({
      name: 'Old Name',
      notes: '',
      ingredients: [],
    });
    if (!created.ok) {
      throw new Error('recipe creation failed');
    }

    await harness.services.meals.plan(created.value.id, { scheduledDate: null, slot: null });
    await harness.services.recipes.update(created.value.id, {
      name: 'New Name',
      notes: '',
      ingredients: [],
    });

    const meals = await harness.services.meals.list();
    expect(meals[0]?.recipeNameSnapshot).toBe('New Name');
  });

  it('leaves the snapshot of eaten meals untouched when the recipe is renamed', async () => {
    const created = await harness.services.recipes.create({
      name: 'Old Name',
      notes: '',
      ingredients: [],
    });
    if (!created.ok) {
      throw new Error('recipe creation failed');
    }

    const planned = await harness.services.meals.plan(created.value.id, {
      scheduledDate: null,
      slot: null,
    });
    if (!planned.ok) {
      throw new Error('planning failed');
    }

    await harness.services.meals.markEaten(planned.value.id);
    await harness.services.recipes.update(created.value.id, {
      name: 'New Name',
      notes: '',
      ingredients: [],
    });

    const meals = await harness.services.meals.list();
    expect(meals[0]?.recipeNameSnapshot).toBe('Old Name');
  });
});

describe('BR-11 recipe deletion', () => {
  it('is blocked while a planned meal references the recipe and lists the blockers', async () => {
    const created = await harness.services.recipes.create({
      name: 'Soup',
      notes: '',
      ingredients: [],
    });
    if (!created.ok) {
      throw new Error('recipe creation failed');
    }

    await harness.services.meals.plan(created.value.id, {
      scheduledDate: '2026-09-01',
      slot: 'dinner',
    });

    const result = await harness.services.recipes.remove(created.value.id);

    expect(result).toMatchObject({
      ok: false,
      error: { code: 'recipe-referenced-by-planned-meals' },
    });
    if (!result.ok) {
      expect(result.error.details).toEqual(['Soup on Tue, 1 Sept 2026 dinner']);
    }
    expect(await harness.services.recipes.list()).toHaveLength(1);
  });

  it('succeeds when only eaten meals reference the recipe', async () => {
    const created = await harness.services.recipes.create({
      name: 'Soup',
      notes: '',
      ingredients: [],
    });
    if (!created.ok) {
      throw new Error('recipe creation failed');
    }

    const planned = await harness.services.meals.plan(created.value.id, {
      scheduledDate: null,
      slot: null,
    });
    if (!planned.ok) {
      throw new Error('planning failed');
    }
    await harness.services.meals.markEaten(planned.value.id);

    const result = await harness.services.recipes.remove(created.value.id);

    expect(result).toMatchObject({ ok: true });
    expect(await harness.services.recipes.list()).toHaveLength(0);
    const meals = await harness.services.meals.list();
    expect(meals[0]?.recipeNameSnapshot).toBe('Soup');
  });

  it('reports a missing recipe', async () => {
    expect(await harness.services.recipes.remove('ghost')).toMatchObject({
      ok: false,
      error: { code: 'entity-not-found' },
    });
    expect(
      await harness.services.recipes.update('ghost', { name: 'X', notes: '', ingredients: [] }),
    ).toMatchObject({ ok: false, error: { code: 'entity-not-found' } });
  });

  it('reads a recipe back by id', async () => {
    const created = await harness.services.recipes.create({
      name: 'Soup',
      notes: 'warm',
      ingredients: [],
    });
    if (!created.ok) {
      throw new Error('recipe creation failed');
    }

    expect(await harness.services.recipes.getById(created.value.id)).toMatchObject({
      name: 'Soup',
      notes: 'warm',
    });
    expect(await harness.services.recipes.getById('ghost')).toBeNull();
  });
});
