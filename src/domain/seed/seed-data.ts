import type { Category, Ingredient } from '../../types/ingredient';
import type { SeedData, SeedDataInput } from '../../types/seed';
import type { Staple } from '../../types/shopping';
import {
  UNCATEGORIZED_CATEGORY_ID,
  UNCATEGORIZED_CATEGORY_NAME,
  UNCATEGORIZED_CATEGORY_SORT_ORDER,
} from '../constants';

const STAPLE_INGREDIENT_NAMES: readonly string[] = [
  'Coffee',
  'Sugar',
  'Olive oil',
  'Parchment paper',
  'Grated cheese',
  'Salt',
  'Sunflower oil',
  'Pepper',
  'Butter',
  'Flour',
  'Milk',
  'Honey',
  'Eggs',
  'Pet food',
  'Razors',
  'Balsamic vinegar',
];

export function buildSeedData(input: SeedDataInput): SeedData {
  const uncategorized: Category = {
    id: UNCATEGORIZED_CATEGORY_ID,
    name: UNCATEGORIZED_CATEGORY_NAME,
    sortOrder: UNCATEGORIZED_CATEGORY_SORT_ORDER,
  };
  const produce: Category = { id: input.generateId(), name: 'Produce', sortOrder: 1 };
  const dairy: Category = { id: input.generateId(), name: 'Dairy', sortOrder: 2 };
  const meatAndFish: Category = { id: input.generateId(), name: 'Meat and fish', sortOrder: 3 };
  const grocery: Category = { id: input.generateId(), name: 'Grocery', sortOrder: 4 };
  const frozen: Category = { id: input.generateId(), name: 'Frozen', sortOrder: 5 };
  const household: Category = { id: input.generateId(), name: 'Household', sortOrder: 6 };

  const ingredients: readonly Ingredient[] = STAPLE_INGREDIENT_NAMES.map((name) => ({
    id: input.generateId(),
    name,
    categoryId: grocery.id,
    createdAt: input.now,
    updatedAt: input.now,
  }));

  const staples: readonly Staple[] = ingredients.map((ingredient) => ({
    id: input.generateId(),
    ingredientId: ingredient.id,
    defaultQuantity: null,
    enabled: true,
  }));

  return {
    categories: [uncategorized, produce, dairy, meatAndFish, grocery, frozen, household],
    ingredients,
    staples,
  };
}
