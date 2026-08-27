import type { Category, Ingredient } from '../../types/ingredient';
import type { SeedCatalogue, SeedData, SeedDataInput } from '../../types/seed';
import {
  UNCATEGORIZED_CATEGORY_ID,
  UNCATEGORIZED_CATEGORY_NAME,
  UNCATEGORIZED_CATEGORY_SORT_ORDER,
} from '../constants';

function buildCategoriesByKey(
  catalogue: SeedCatalogue,
  generateId: () => string,
): ReadonlyMap<string, Category> {
  const categoriesByKey = new Map<string, Category>();

  for (const seedCategory of catalogue.categories) {
    if (categoriesByKey.has(seedCategory.key)) {
      throw new Error(`The seed catalogue declares the category key "${seedCategory.key}" twice.`);
    }
    categoriesByKey.set(seedCategory.key, {
      id: generateId(),
      name: seedCategory.name,
      sortOrder: seedCategory.sortOrder,
    });
  }

  return categoriesByKey;
}

export function buildSeedData(input: SeedDataInput): SeedData {
  const uncategorized: Category = {
    id: UNCATEGORIZED_CATEGORY_ID,
    name: UNCATEGORIZED_CATEGORY_NAME,
    sortOrder: UNCATEGORIZED_CATEGORY_SORT_ORDER,
  };

  const categoriesByKey = buildCategoriesByKey(input.catalogue, input.generateId);

  const ingredients: readonly Ingredient[] = input.catalogue.ingredients.map((seedIngredient) => {
    const category = categoriesByKey.get(seedIngredient.categoryKey);
    if (category === undefined) {
      throw new Error(
        `The seed ingredient "${seedIngredient.name}" refers to the unknown category key "${seedIngredient.categoryKey}".`,
      );
    }

    return {
      id: input.generateId(),
      name: seedIngredient.name,
      categoryId: category.id,
      createdAt: input.now,
      updatedAt: input.now,
    };
  });

  return {
    categories: [uncategorized, ...categoriesByKey.values()],
    ingredients,
  };
}
