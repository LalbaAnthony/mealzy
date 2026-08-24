import { describe, expect, it } from 'vitest';
import { validateRecipeDraft } from '../../../src/domain/validation/recipe';
import { validateIngredientDraft } from '../../../src/domain/validation/ingredient';
import { isReservedCategory, validateCategoryName } from '../../../src/domain/validation/category';
import { validateStapleDraft } from '../../../src/domain/validation/staple';
import { validateAdHocItemDraft } from '../../../src/domain/validation/adhoc';
import { validateMealPlannedDraft } from '../../../src/domain/validation/meal';
import {
  findCategoryReferents,
  findIngredientReferents,
  findPlannedMealsBlockingRecipeDeletion,
  hasCategoryReferents,
  hasIngredientReferents,
} from '../../../src/domain/validation/references';
import { domainError, fail, ok } from '../../../src/domain/validation/result';
import { isPositiveAmount, namesMatch, normaliseName } from '../../../src/domain/validation/names';
import {
  makeAdHocItem,
  makeCategory,
  makeIngredient,
  makeMealPlanned,
  makeRecipe,
  makeStaple,
} from '../../support/factories';

const flour = makeIngredient({ id: 'flour', name: 'Flour' });
const sugar = makeIngredient({ id: 'sugar', name: 'Sugar' });
const grocery = makeCategory({ id: 'grocery', name: 'Grocery', sortOrder: 4 });

describe('result helpers', () => {
  it('builds success and failure results', () => {
    expect(ok(1)).toEqual({ ok: true, value: 1 });
    expect(fail('entity-not-found', 'gone', ['x'])).toEqual({
      ok: false,
      error: { code: 'entity-not-found', message: 'gone', details: ['x'] },
    });
    expect(domainError('backup-invalid', 'bad', [])).toEqual({
      code: 'backup-invalid',
      message: 'bad',
      details: [],
    });
  });
});

describe('name helpers', () => {
  it('collapses whitespace and trims', () => {
    expect(normaliseName('  Red   Onion  ')).toBe('Red Onion');
  });

  it('compares names case insensitively', () => {
    expect(namesMatch(' tomato ', 'Tomato')).toBe(true);
    expect(namesMatch('tomato', 'onion')).toBe(false);
  });

  it('validates positive finite amounts', () => {
    expect(isPositiveAmount(1)).toBe(true);
    expect(isPositiveAmount(0)).toBe(false);
    expect(isPositiveAmount(-1)).toBe(false);
    expect(isPositiveAmount(Number.NaN)).toBe(false);
    expect(isPositiveAmount(Number.POSITIVE_INFINITY)).toBe(false);
  });
});

describe('BR-01 recipe name', () => {
  it('rejects an empty name', () => {
    const result = validateRecipeDraft({
      draft: { name: '   ', notes: '', ingredients: [] },
      existingRecipes: [],
      ingredients: [],
      recipeIdInEdit: null,
    });

    expect(result).toMatchObject({ ok: false, error: { code: 'recipe-name-required' } });
  });

  it('rejects a duplicate name ignoring case and surrounding spaces', () => {
    const result = validateRecipeDraft({
      draft: { name: '  tomato SOUP ', notes: '', ingredients: [] },
      existingRecipes: [makeRecipe({ id: 'other', name: 'Tomato Soup' })],
      ingredients: [],
      recipeIdInEdit: null,
    });

    expect(result).toMatchObject({ ok: false, error: { code: 'recipe-name-duplicate' } });
  });

  it('allows a recipe to keep its own name while editing', () => {
    const result = validateRecipeDraft({
      draft: { name: 'Tomato Soup', notes: '', ingredients: [] },
      existingRecipes: [makeRecipe({ id: 'self', name: 'Tomato Soup' })],
      ingredients: [],
      recipeIdInEdit: 'self',
    });

    expect(result.ok).toBe(true);
  });

  it('normalises the name and trims the notes', () => {
    const result = validateRecipeDraft({
      draft: { name: '  Tomato   Soup ', notes: '  tasty  ', ingredients: [] },
      existingRecipes: [],
      ingredients: [],
      recipeIdInEdit: null,
    });

    expect(result).toEqual({
      ok: true,
      value: { name: 'Tomato Soup', notes: 'tasty', ingredients: [] },
    });
  });
});

describe('BR-02 recipe ingredients reference existing ingredients', () => {
  it('rejects an unknown ingredient', () => {
    const result = validateRecipeDraft({
      draft: { name: 'Soup', notes: '', ingredients: [{ ingredientId: 'ghost', quantity: null }] },
      existingRecipes: [],
      ingredients: [flour],
      recipeIdInEdit: null,
    });

    expect(result).toMatchObject({
      ok: false,
      error: { code: 'recipe-ingredient-unknown', details: ['ghost'] },
    });
  });

  it('accepts an ingredient with no quantity', () => {
    const result = validateRecipeDraft({
      draft: { name: 'Soup', notes: '', ingredients: [{ ingredientId: 'flour', quantity: null }] },
      existingRecipes: [],
      ingredients: [flour],
      recipeIdInEdit: null,
    });

    expect(result.ok).toBe(true);
  });

  it('rejects a non positive quantity', () => {
    const result = validateRecipeDraft({
      draft: {
        name: 'Soup',
        notes: '',
        ingredients: [{ ingredientId: 'flour', quantity: { amount: 0, unit: 'g' } }],
      },
      existingRecipes: [],
      ingredients: [flour],
      recipeIdInEdit: null,
    });

    expect(result).toMatchObject({
      ok: false,
      error: { code: 'recipe-quantity-invalid', details: ['Flour'] },
    });
  });
});

describe('BR-03 an ingredient appears at most once per recipe', () => {
  it('rejects a repeated ingredient', () => {
    const result = validateRecipeDraft({
      draft: {
        name: 'Soup',
        notes: '',
        ingredients: [
          { ingredientId: 'flour', quantity: null },
          { ingredientId: 'flour', quantity: { amount: 2, unit: 'g' } },
        ],
      },
      existingRecipes: [],
      ingredients: [flour],
      recipeIdInEdit: null,
    });

    expect(result).toMatchObject({
      ok: false,
      error: { code: 'recipe-ingredient-duplicate', details: ['Flour'] },
    });
  });

  it('accepts two different ingredients', () => {
    const result = validateRecipeDraft({
      draft: {
        name: 'Soup',
        notes: '',
        ingredients: [
          { ingredientId: 'flour', quantity: null },
          { ingredientId: 'sugar', quantity: null },
        ],
      },
      existingRecipes: [],
      ingredients: [flour, sugar],
      recipeIdInEdit: null,
    });

    expect(result.ok).toBe(true);
  });
});

describe('ingredient validation', () => {
  it('rejects an empty name', () => {
    const result = validateIngredientDraft({
      draft: { name: ' ', categoryId: 'grocery' },
      existingIngredients: [],
      categories: [grocery],
      ingredientIdInEdit: null,
    });

    expect(result).toMatchObject({ ok: false, error: { code: 'ingredient-name-required' } });
  });

  it('rejects a duplicate name', () => {
    const result = validateIngredientDraft({
      draft: { name: 'flour', categoryId: 'grocery' },
      existingIngredients: [flour],
      categories: [grocery],
      ingredientIdInEdit: null,
    });

    expect(result).toMatchObject({ ok: false, error: { code: 'ingredient-name-duplicate' } });
  });

  it('allows an ingredient to keep its own name while editing', () => {
    const result = validateIngredientDraft({
      draft: { name: 'Flour', categoryId: 'grocery' },
      existingIngredients: [flour],
      categories: [grocery],
      ingredientIdInEdit: 'flour',
    });

    expect(result.ok).toBe(true);
  });

  it('rejects an unknown category', () => {
    const result = validateIngredientDraft({
      draft: { name: 'Flour', categoryId: 'ghost' },
      existingIngredients: [],
      categories: [grocery],
      ingredientIdInEdit: null,
    });

    expect(result).toMatchObject({ ok: false, error: { code: 'ingredient-category-unknown' } });
  });
});

describe('BR-14 the uncategorized category is reserved', () => {
  it('recognises the reserved category', () => {
    expect(isReservedCategory(makeCategory({ id: 'uncategorized' }))).toBe(true);
    expect(isReservedCategory(grocery)).toBe(false);
  });

  it('refuses to rename the reserved category', () => {
    const result = validateCategoryName({
      name: 'Anything',
      existingCategories: [],
      categoryIdInEdit: 'uncategorized',
    });

    expect(result).toMatchObject({ ok: false, error: { code: 'category-reserved' } });
  });

  it('rejects an empty category name', () => {
    const result = validateCategoryName({
      name: '  ',
      existingCategories: [],
      categoryIdInEdit: null,
    });

    expect(result).toMatchObject({ ok: false, error: { code: 'category-name-required' } });
  });

  it('rejects a duplicate category name', () => {
    const result = validateCategoryName({
      name: 'grocery',
      existingCategories: [grocery],
      categoryIdInEdit: null,
    });

    expect(result).toMatchObject({ ok: false, error: { code: 'category-name-duplicate' } });
  });

  it('accepts a fresh category name', () => {
    expect(
      validateCategoryName({
        name: '  Bakery ',
        existingCategories: [grocery],
        categoryIdInEdit: null,
      }),
    ).toEqual({ ok: true, value: 'Bakery' });
  });
});

describe('BR-13 staple validation', () => {
  it('rejects an unknown ingredient', () => {
    const result = validateStapleDraft({
      draft: { ingredientId: 'ghost', defaultQuantity: null, enabled: true },
      existingStaples: [],
      ingredients: [flour],
      stapleIdInEdit: null,
    });

    expect(result).toMatchObject({ ok: false, error: { code: 'staple-ingredient-unknown' } });
  });

  it('rejects a second staple for the same ingredient', () => {
    const result = validateStapleDraft({
      draft: { ingredientId: 'flour', defaultQuantity: null, enabled: true },
      existingStaples: [makeStaple({ id: 'existing', ingredientId: 'flour' })],
      ingredients: [flour],
      stapleIdInEdit: null,
    });

    expect(result).toMatchObject({ ok: false, error: { code: 'staple-ingredient-duplicate' } });
  });

  it('allows a staple to keep its own ingredient while editing', () => {
    const result = validateStapleDraft({
      draft: { ingredientId: 'flour', defaultQuantity: null, enabled: false },
      existingStaples: [makeStaple({ id: 'self', ingredientId: 'flour' })],
      ingredients: [flour],
      stapleIdInEdit: 'self',
    });

    expect(result).toEqual({
      ok: true,
      value: { ingredientId: 'flour', defaultQuantity: null, enabled: false },
    });
  });

  it('rejects a non positive default quantity', () => {
    const result = validateStapleDraft({
      draft: { ingredientId: 'flour', defaultQuantity: { amount: -1, unit: 'g' }, enabled: true },
      existingStaples: [],
      ingredients: [flour],
      stapleIdInEdit: null,
    });

    expect(result).toMatchObject({ ok: false, error: { code: 'recipe-quantity-invalid' } });
  });
});

describe('BR-15 ad hoc item validation', () => {
  it('rejects an empty label', () => {
    const result = validateAdHocItemDraft({
      draft: { label: '  ', quantity: null, categoryId: 'grocery' },
      categories: [grocery],
    });

    expect(result).toMatchObject({ ok: false, error: { code: 'adhoc-label-required' } });
  });

  it('rejects a non positive quantity', () => {
    const result = validateAdHocItemDraft({
      draft: { label: 'Bulbs', quantity: { amount: 0, unit: 'piece' }, categoryId: 'grocery' },
      categories: [grocery],
    });

    expect(result).toMatchObject({ ok: false, error: { code: 'recipe-quantity-invalid' } });
  });

  it('falls back to uncategorized for an unknown category', () => {
    const result = validateAdHocItemDraft({
      draft: { label: ' Bulbs ', quantity: null, categoryId: 'ghost' },
      categories: [grocery],
    });

    expect(result).toEqual({
      ok: true,
      value: { label: 'Bulbs', quantity: null, categoryId: 'uncategorized' },
    });
  });

  it('keeps a known category', () => {
    const result = validateAdHocItemDraft({
      draft: { label: 'Bulbs', quantity: { amount: 4, unit: 'piece' }, categoryId: 'grocery' },
      categories: [grocery],
    });

    expect(result).toMatchObject({ ok: true, value: { categoryId: 'grocery' } });
  });
});

describe('BR-05 planned meal validation', () => {
  const soup = makeRecipe({ id: 'soup', name: 'Soup' });

  it('rejects an unknown recipe', () => {
    const result = validateMealPlannedDraft({
      draft: { scheduledDate: null, slot: null },
      recipeId: 'ghost',
      recipes: [soup],
    });

    expect(result).toMatchObject({ ok: false, error: { code: 'meal-recipe-unknown' } });
  });

  it('accepts a meal with neither date nor slot', () => {
    const result = validateMealPlannedDraft({
      draft: { scheduledDate: null, slot: null },
      recipeId: 'soup',
      recipes: [soup],
    });

    expect(result).toEqual({ ok: true, value: { scheduledDate: null, slot: null } });
  });

  it('accepts a date without a slot and a slot without a date', () => {
    expect(
      validateMealPlannedDraft({
        draft: { scheduledDate: '2026-09-01', slot: null },
        recipeId: 'soup',
        recipes: [soup],
      }).ok,
    ).toBe(true);
    expect(
      validateMealPlannedDraft({
        draft: { scheduledDate: null, slot: 'dinner' },
        recipeId: 'soup',
        recipes: [soup],
      }).ok,
    ).toBe(true);
  });

  it('rejects an impossible date', () => {
    const result = validateMealPlannedDraft({
      draft: { scheduledDate: '2026-02-30', slot: null },
      recipeId: 'soup',
      recipes: [soup],
    });

    expect(result).toMatchObject({ ok: false, error: { code: 'meal-date-invalid' } });
  });
});

describe('BR-11 recipe deletion guard', () => {
  it('lists planned meals that block deletion', () => {
    const blockers = findPlannedMealsBlockingRecipeDeletion('soup', [
      makeMealPlanned({ id: 'planned', recipeId: 'soup', status: 'planned' }),
      makeMealPlanned({ id: 'eaten', recipeId: 'soup', status: 'eaten' }),
      makeMealPlanned({ id: 'other', recipeId: 'salad', status: 'planned' }),
    ]);

    expect(blockers.map((meal) => meal.id)).toEqual(['planned']);
  });

  it('does not block when only eaten meals reference the recipe', () => {
    const blockers = findPlannedMealsBlockingRecipeDeletion('soup', [
      makeMealPlanned({ id: 'eaten', recipeId: 'soup', status: 'eaten' }),
    ]);

    expect(blockers).toEqual([]);
  });
});

describe('BR-12 ingredient deletion guard', () => {
  it('lists recipes and staples that reference the ingredient', () => {
    const referents = findIngredientReferents({
      ingredientId: 'flour',
      recipes: [
        makeRecipe({
          id: 'bread',
          name: 'Bread',
          ingredients: [{ ingredientId: 'flour', quantity: null }],
        }),
        makeRecipe({ id: 'salad', name: 'Salad', ingredients: [] }),
      ],
      staples: [makeStaple({ id: 'staple-flour', ingredientId: 'flour' })],
    });

    expect(referents.recipes.map((recipe) => recipe.id)).toEqual(['bread']);
    expect(referents.staples.map((staple) => staple.id)).toEqual(['staple-flour']);
    expect(hasIngredientReferents(referents)).toBe(true);
  });

  it('reports no referents for an unused ingredient', () => {
    const referents = findIngredientReferents({
      ingredientId: 'flour',
      recipes: [],
      staples: [],
    });

    expect(hasIngredientReferents(referents)).toBe(false);
  });

  it('reports referents when only a staple uses the ingredient', () => {
    const referents = findIngredientReferents({
      ingredientId: 'flour',
      recipes: [],
      staples: [makeStaple({ ingredientId: 'flour' })],
    });

    expect(hasIngredientReferents(referents)).toBe(true);
  });
});

describe('category deletion guard', () => {
  it('lists ingredients and ad hoc items that reference the category', () => {
    const referents = findCategoryReferents({
      categoryId: 'grocery',
      ingredients: [makeIngredient({ id: 'flour', categoryId: 'grocery' })],
      adHocItems: [makeAdHocItem({ id: 'bulbs', categoryId: 'grocery' })],
    });

    expect(referents.ingredients).toHaveLength(1);
    expect(referents.adHocItems).toHaveLength(1);
    expect(hasCategoryReferents(referents)).toBe(true);
  });

  it('reports no referents for an unused category', () => {
    expect(
      hasCategoryReferents(
        findCategoryReferents({ categoryId: 'grocery', ingredients: [], adHocItems: [] }),
      ),
    ).toBe(false);
  });

  it('reports referents when only an ad hoc item uses the category', () => {
    expect(
      hasCategoryReferents(
        findCategoryReferents({
          categoryId: 'grocery',
          ingredients: [],
          adHocItems: [makeAdHocItem({ categoryId: 'grocery' })],
        }),
      ),
    ).toBe(true);
  });
});
