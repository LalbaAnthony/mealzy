import { describe, expect, it } from 'vitest';
import { aggregateShoppingList } from '../../../src/domain/aggregation/aggregate-shopping-list';
import type { ShoppingListAggregationInput } from '../../../src/types/shopping';
import {
  makeAdHocItem,
  makeIngredient,
  makeMealPlanned,
  makeRecipe,
  makeStaple,
} from '../../support/factories';

const tomato = makeIngredient({ id: 'tomato', name: 'Tomato', categoryId: 'produce' });
const onion = makeIngredient({ id: 'onion', name: 'Onion', categoryId: 'produce' });
const butter = makeIngredient({ id: 'butter', name: 'Butter', categoryId: 'dairy' });

function emptyInput(): ShoppingListAggregationInput {
  return {
    plannedMeals: [],
    recipes: [],
    ingredients: [],
    staples: [],
    adHocItems: [],
    purchasedKeys: [],
  };
}

describe('aggregateShoppingList', () => {
  it('returns nothing for an empty state', () => {
    expect(aggregateShoppingList(emptyInput())).toEqual([]);
  });

  it('produces one line per ingredient of a single planned meal', () => {
    const lines = aggregateShoppingList({
      ...emptyInput(),
      ingredients: [tomato, onion],
      recipes: [
        makeRecipe({
          id: 'soup',
          ingredients: [
            { ingredientId: 'tomato', quantity: { amount: 500, unit: 'g' } },
            { ingredientId: 'onion', quantity: { amount: 2, unit: 'piece' } },
          ],
        }),
      ],
      plannedMeals: [makeMealPlanned({ id: 'meal-1', recipeId: 'soup' })],
    });

    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({
      key: 'ingredient:tomato:g',
      label: 'Tomato',
      categoryId: 'produce',
      quantity: { amount: 500, unit: 'g' },
      purchased: false,
    });
    expect(lines[0]?.sources).toEqual([{ kind: 'meal', mealPlannedId: 'meal-1' }]);
  });

  it('merges two meals that share an ingredient in the same unit', () => {
    const lines = aggregateShoppingList({
      ...emptyInput(),
      ingredients: [tomato],
      recipes: [
        makeRecipe({
          id: 'soup',
          ingredients: [{ ingredientId: 'tomato', quantity: { amount: 500, unit: 'g' } }],
        }),
        makeRecipe({
          id: 'salad',
          ingredients: [{ ingredientId: 'tomato', quantity: { amount: 300, unit: 'g' } }],
        }),
      ],
      plannedMeals: [
        makeMealPlanned({ id: 'meal-1', recipeId: 'soup' }),
        makeMealPlanned({ id: 'meal-2', recipeId: 'salad' }),
      ],
    });

    expect(lines).toHaveLength(1);
    expect(lines[0]?.quantity).toEqual({ amount: 800, unit: 'g' });
    expect(lines[0]?.sources).toEqual([
      { kind: 'meal', mealPlannedId: 'meal-1' },
      { kind: 'meal', mealPlannedId: 'meal-2' },
    ]);
  });

  it('normalises mixed units inside the same measurement family', () => {
    const lines = aggregateShoppingList({
      ...emptyInput(),
      ingredients: [tomato],
      recipes: [
        makeRecipe({
          id: 'soup',
          ingredients: [{ ingredientId: 'tomato', quantity: { amount: 200, unit: 'g' } }],
        }),
        makeRecipe({
          id: 'stew',
          ingredients: [{ ingredientId: 'tomato', quantity: { amount: 1, unit: 'kg' } }],
        }),
      ],
      plannedMeals: [
        makeMealPlanned({ id: 'meal-1', recipeId: 'soup' }),
        makeMealPlanned({ id: 'meal-2', recipeId: 'stew' }),
      ],
    });

    expect(lines).toHaveLength(1);
    expect(lines[0]?.key).toBe('ingredient:tomato:g');
    expect(lines[0]?.quantity).toEqual({ amount: 1200, unit: 'g' });
  });

  it('keeps units from different families on separate adjacent lines', () => {
    const lines = aggregateShoppingList({
      ...emptyInput(),
      ingredients: [tomato],
      recipes: [
        makeRecipe({
          id: 'mixed',
          ingredients: [{ ingredientId: 'tomato', quantity: { amount: 200, unit: 'g' } }],
        }),
        makeRecipe({
          id: 'heavy',
          ingredients: [{ ingredientId: 'tomato', quantity: { amount: 1, unit: 'kg' } }],
        }),
        makeRecipe({
          id: 'spoon',
          ingredients: [{ ingredientId: 'tomato', quantity: { amount: 2, unit: 'tbsp' } }],
        }),
        makeRecipe({
          id: 'vague',
          ingredients: [{ ingredientId: 'tomato', quantity: null }],
        }),
      ],
      plannedMeals: [
        makeMealPlanned({ id: 'meal-1', recipeId: 'mixed' }),
        makeMealPlanned({ id: 'meal-2', recipeId: 'heavy' }),
        makeMealPlanned({ id: 'meal-3', recipeId: 'spoon' }),
        makeMealPlanned({ id: 'meal-4', recipeId: 'vague' }),
      ],
    });

    expect(lines.map((line) => line.key)).toEqual([
      'ingredient:tomato:g',
      'ingredient:tomato:tbsp',
      'ingredient:tomato:none',
    ]);
    expect(lines[0]?.quantity).toEqual({ amount: 1200, unit: 'g' });
    expect(lines[1]?.quantity).toEqual({ amount: 2, unit: 'tbsp' });
    expect(lines[2]?.quantity).toBeNull();
  });

  it('groups unquantified contributions into a single none bucket', () => {
    const lines = aggregateShoppingList({
      ...emptyInput(),
      ingredients: [tomato],
      recipes: [
        makeRecipe({ id: 'a', ingredients: [{ ingredientId: 'tomato', quantity: null }] }),
        makeRecipe({ id: 'b', ingredients: [{ ingredientId: 'tomato', quantity: null }] }),
      ],
      plannedMeals: [
        makeMealPlanned({ id: 'meal-1', recipeId: 'a' }),
        makeMealPlanned({ id: 'meal-2', recipeId: 'b' }),
      ],
    });

    expect(lines).toHaveLength(1);
    expect(lines[0]?.quantity).toBeNull();
    expect(lines[0]?.sources).toHaveLength(2);
  });

  it('BR-07 ignores meals that have been eaten', () => {
    const lines = aggregateShoppingList({
      ...emptyInput(),
      ingredients: [tomato],
      recipes: [
        makeRecipe({
          id: 'soup',
          ingredients: [{ ingredientId: 'tomato', quantity: { amount: 500, unit: 'g' } }],
        }),
      ],
      plannedMeals: [
        makeMealPlanned({ id: 'meal-1', recipeId: 'soup', status: 'eaten', eatenAt: 10 }),
      ],
    });

    expect(lines).toEqual([]);
  });

  it('ignores meals whose recipe no longer exists', () => {
    const lines = aggregateShoppingList({
      ...emptyInput(),
      ingredients: [tomato],
      plannedMeals: [makeMealPlanned({ id: 'meal-1', recipeId: 'missing' })],
    });

    expect(lines).toEqual([]);
  });

  it('ignores contributions for ingredients that no longer exist', () => {
    const lines = aggregateShoppingList({
      ...emptyInput(),
      recipes: [
        makeRecipe({
          id: 'soup',
          ingredients: [{ ingredientId: 'ghost', quantity: { amount: 1, unit: 'g' } }],
        }),
      ],
      plannedMeals: [makeMealPlanned({ id: 'meal-1', recipeId: 'soup' })],
    });

    expect(lines).toEqual([]);
  });
});

describe('staple contributions', () => {
  it('BR-13 adds an enabled staple even when no meal needs it', () => {
    const lines = aggregateShoppingList({
      ...emptyInput(),
      ingredients: [butter],
      staples: [makeStaple({ id: 'staple-butter', ingredientId: 'butter', enabled: true })],
    });

    expect(lines).toHaveLength(1);
    expect(lines[0]?.key).toBe('ingredient:butter:none');
    expect(lines[0]?.sources).toEqual([{ kind: 'staple', stapleId: 'staple-butter' }]);
  });

  it('BR-13 skips a disabled staple', () => {
    const lines = aggregateShoppingList({
      ...emptyInput(),
      ingredients: [butter],
      staples: [makeStaple({ id: 'staple-butter', ingredientId: 'butter', enabled: false })],
    });

    expect(lines).toEqual([]);
  });

  it('merges a staple into the line of a meal that uses the same ingredient', () => {
    const lines = aggregateShoppingList({
      ...emptyInput(),
      ingredients: [butter],
      recipes: [
        makeRecipe({
          id: 'cake',
          ingredients: [{ ingredientId: 'butter', quantity: { amount: 200, unit: 'g' } }],
        }),
      ],
      plannedMeals: [makeMealPlanned({ id: 'meal-1', recipeId: 'cake' })],
      staples: [
        makeStaple({
          id: 'staple-butter',
          ingredientId: 'butter',
          defaultQuantity: { amount: 50, unit: 'g' },
        }),
      ],
    });

    expect(lines).toHaveLength(1);
    expect(lines[0]?.quantity).toEqual({ amount: 250, unit: 'g' });
    expect(lines[0]?.sources).toEqual([
      { kind: 'meal', mealPlannedId: 'meal-1' },
      { kind: 'staple', stapleId: 'staple-butter' },
    ]);
  });

  it('keeps an unquantified staple separate from a quantified meal contribution', () => {
    const lines = aggregateShoppingList({
      ...emptyInput(),
      ingredients: [butter],
      recipes: [
        makeRecipe({
          id: 'cake',
          ingredients: [{ ingredientId: 'butter', quantity: { amount: 200, unit: 'g' } }],
        }),
      ],
      plannedMeals: [makeMealPlanned({ id: 'meal-1', recipeId: 'cake' })],
      staples: [makeStaple({ id: 'staple-butter', ingredientId: 'butter' })],
    });

    expect(lines.map((line) => line.key)).toEqual([
      'ingredient:butter:g',
      'ingredient:butter:none',
    ]);
  });
});

describe('ad hoc contributions', () => {
  it('BR-15 never merges ad hoc items with identical labels', () => {
    const lines = aggregateShoppingList({
      ...emptyInput(),
      adHocItems: [
        makeAdHocItem({ id: 'adhoc-1', label: 'Light bulbs' }),
        makeAdHocItem({ id: 'adhoc-2', label: 'Light bulbs' }),
      ],
    });

    expect(lines.map((line) => line.key)).toEqual(['adhoc:adhoc-1', 'adhoc:adhoc-2']);
    expect(lines[0]?.sources).toEqual([{ kind: 'adhoc', adHocItemId: 'adhoc-1' }]);
  });

  it('BR-15 never merges an ad hoc item with an ingredient line of the same name', () => {
    const lines = aggregateShoppingList({
      ...emptyInput(),
      ingredients: [butter],
      staples: [makeStaple({ id: 'staple-butter', ingredientId: 'butter' })],
      adHocItems: [makeAdHocItem({ id: 'adhoc-1', label: 'Butter' })],
    });

    expect(lines.map((line) => line.key)).toEqual(['ingredient:butter:none', 'adhoc:adhoc-1']);
  });

  it('carries the ad hoc quantity through unchanged', () => {
    const lines = aggregateShoppingList({
      ...emptyInput(),
      adHocItems: [makeAdHocItem({ id: 'adhoc-1', quantity: { amount: 6, unit: 'piece' } })],
    });

    expect(lines[0]?.quantity).toEqual({ amount: 6, unit: 'piece' });
  });
});

describe('BR-16 purchased state', () => {
  const soup = makeRecipe({
    id: 'soup',
    ingredients: [{ ingredientId: 'tomato', quantity: { amount: 500, unit: 'g' } }],
  });
  const salad = makeRecipe({
    id: 'salad',
    ingredients: [{ ingredientId: 'onion', quantity: { amount: 1, unit: 'piece' } }],
  });

  it('marks a line purchased when its key is in the purchased set', () => {
    const lines = aggregateShoppingList({
      ...emptyInput(),
      ingredients: [tomato],
      recipes: [soup],
      plannedMeals: [makeMealPlanned({ id: 'meal-1', recipeId: 'soup' })],
      purchasedKeys: ['ingredient:tomato:g'],
    });

    expect(lines[0]?.purchased).toBe(true);
  });

  it('keeps the purchased flag when another meal is added', () => {
    const before = aggregateShoppingList({
      ...emptyInput(),
      ingredients: [tomato, onion],
      recipes: [soup, salad],
      plannedMeals: [makeMealPlanned({ id: 'meal-1', recipeId: 'soup' })],
      purchasedKeys: ['ingredient:tomato:g'],
    });

    const after = aggregateShoppingList({
      ...emptyInput(),
      ingredients: [tomato, onion],
      recipes: [soup, salad],
      plannedMeals: [
        makeMealPlanned({ id: 'meal-1', recipeId: 'soup' }),
        makeMealPlanned({ id: 'meal-2', recipeId: 'salad' }),
      ],
      purchasedKeys: ['ingredient:tomato:g'],
    });

    expect(before[0]?.purchased).toBe(true);
    expect(after).toHaveLength(2);
    expect(after.find((line) => line.key === 'ingredient:tomato:g')?.purchased).toBe(true);
    expect(after.find((line) => line.key === 'ingredient:onion:piece')?.purchased).toBe(false);
  });

  it('keeps the purchased flag when a meal is removed', () => {
    const after = aggregateShoppingList({
      ...emptyInput(),
      ingredients: [tomato, onion],
      recipes: [soup, salad],
      plannedMeals: [makeMealPlanned({ id: 'meal-1', recipeId: 'soup' })],
      purchasedKeys: ['ingredient:tomato:g', 'ingredient:onion:piece'],
    });

    expect(after).toHaveLength(1);
    expect(after[0]?.purchased).toBe(true);
  });

  it('marks an ad hoc line purchased by its stable key', () => {
    const lines = aggregateShoppingList({
      ...emptyInput(),
      adHocItems: [makeAdHocItem({ id: 'adhoc-1' })],
      purchasedKeys: ['adhoc:adhoc-1'],
    });

    expect(lines[0]?.purchased).toBe(true);
  });
});
