import type { RecipeId } from '../../types/identifiers';
import type { MealPlanned } from '../../types/meal';
import type {
  CategoryReferents,
  CategoryReferentsInput,
  IngredientReferents,
  IngredientReferentsInput,
} from '../../types/validation';

export function findPlannedMealsBlockingRecipeDeletion(
  recipeId: RecipeId,
  meals: readonly MealPlanned[],
): readonly MealPlanned[] {
  return meals.filter((meal) => meal.recipeId === recipeId && meal.status === 'planned');
}

export function findIngredientReferents(input: IngredientReferentsInput): IngredientReferents {
  return {
    recipes: input.recipes.filter((recipe) =>
      recipe.ingredients.some(
        (recipeIngredient) => recipeIngredient.ingredientId === input.ingredientId,
      ),
    ),
    staples: input.staples.filter((staple) => staple.ingredientId === input.ingredientId),
  };
}

export function hasIngredientReferents(referents: IngredientReferents): boolean {
  return referents.recipes.length > 0 || referents.staples.length > 0;
}

export function findCategoryReferents(input: CategoryReferentsInput): CategoryReferents {
  return {
    ingredients: input.ingredients.filter(
      (ingredient) => ingredient.categoryId === input.categoryId,
    ),
    adHocItems: input.adHocItems.filter((item) => item.categoryId === input.categoryId),
  };
}

export function hasCategoryReferents(referents: CategoryReferents): boolean {
  return referents.ingredients.length > 0 || referents.adHocItems.length > 0;
}
