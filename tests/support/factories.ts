import type { Category, Ingredient } from '../../src/types/ingredient';
import type { MealPlanned } from '../../src/types/meal';
import type { Recipe } from '../../src/types/recipe';
import type { AdHocItem, Staple } from '../../src/types/shopping';

export function makeCategory(overrides: Partial<Category>): Category {
  return { id: 'category-1', name: 'Category', sortOrder: 1, ...overrides };
}

export function makeIngredient(overrides: Partial<Ingredient>): Ingredient {
  return {
    id: 'ingredient-1',
    name: 'Ingredient',
    categoryId: 'category-1',
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

export function makeRecipe(overrides: Partial<Recipe>): Recipe {
  return {
    id: 'recipe-1',
    name: 'Recipe',
    notes: '',
    ingredients: [],
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

export function makeMealPlanned(overrides: Partial<MealPlanned>): MealPlanned {
  return {
    id: 'meal-1',
    recipeId: 'recipe-1',
    recipeNameSnapshot: 'Recipe',
    scheduledDate: null,
    slot: null,
    manualOrder: 1,
    status: 'planned',
    eatenAt: null,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

export function makeStaple(overrides: Partial<Staple>): Staple {
  return {
    id: 'staple-1',
    ingredientId: 'ingredient-1',
    defaultQuantity: null,
    enabled: true,
    ...overrides,
  };
}

export function makeAdHocItem(overrides: Partial<AdHocItem>): AdHocItem {
  return {
    id: 'adhoc-1',
    label: 'Item',
    quantity: null,
    categoryId: 'category-1',
    createdAt: 0,
    ...overrides,
  };
}

export function makeSequentialIdGenerator(prefix: string): () => string {
  let counter = 0;
  return () => {
    counter += 1;
    return `${prefix}-${String(counter)}`;
  };
}
