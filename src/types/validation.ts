import type { CategoryId, IngredientId, RecipeId, StapleId } from './identifiers';
import type { Category, Ingredient } from './ingredient';
import type { Quantity } from './units';
import type { Recipe } from './recipe';
import type { AdHocItem, Staple } from './shopping';
import type {
  AdHocItemDraft,
  IngredientDraft,
  MealPlannedDraft,
  RecipeDraft,
  StapleDraft,
} from './services';

export type DomainErrorCode =
  | 'recipe-name-required'
  | 'recipe-name-duplicate'
  | 'recipe-ingredient-unknown'
  | 'recipe-ingredient-duplicate'
  | 'recipe-quantity-invalid'
  | 'recipe-referenced-by-planned-meals'
  | 'ingredient-name-required'
  | 'ingredient-name-duplicate'
  | 'ingredient-category-unknown'
  | 'ingredient-referenced'
  | 'category-name-required'
  | 'category-name-duplicate'
  | 'category-reserved'
  | 'category-referenced'
  | 'staple-ingredient-unknown'
  | 'staple-ingredient-duplicate'
  | 'adhoc-label-required'
  | 'meal-recipe-unknown'
  | 'meal-date-invalid'
  | 'entity-not-found'
  | 'backup-invalid';

export interface DomainError {
  readonly code: DomainErrorCode;
  readonly message: string;
  readonly details: readonly string[];
}

export type DomainResult<TValue> =
  | { readonly ok: true; readonly value: TValue }
  | { readonly ok: false; readonly error: DomainError };

export interface RecipeValidationInput {
  readonly draft: RecipeDraft;
  readonly existingRecipes: readonly Recipe[];
  readonly ingredients: readonly Ingredient[];
  readonly recipeIdInEdit: RecipeId | null;
}

export interface IngredientValidationInput {
  readonly draft: IngredientDraft;
  readonly existingIngredients: readonly Ingredient[];
  readonly categories: readonly Category[];
  readonly ingredientIdInEdit: IngredientId | null;
}

export interface CategoryValidationInput {
  readonly name: string;
  readonly existingCategories: readonly Category[];
  readonly categoryIdInEdit: CategoryId | null;
}

export interface StapleValidationInput {
  readonly draft: StapleDraft;
  readonly existingStaples: readonly Staple[];
  readonly ingredients: readonly Ingredient[];
  readonly stapleIdInEdit: StapleId | null;
}

export interface AdHocItemValidationInput {
  readonly draft: AdHocItemDraft;
  readonly categories: readonly Category[];
}

export interface MealPlanValidationInput {
  readonly draft: MealPlannedDraft;
  readonly recipeId: RecipeId;
  readonly recipes: readonly Recipe[];
}

export interface IngredientReferents {
  readonly recipes: readonly Recipe[];
  readonly staples: readonly Staple[];
}

export interface IngredientReferentsInput {
  readonly ingredientId: IngredientId;
  readonly recipes: readonly Recipe[];
  readonly staples: readonly Staple[];
}

export interface CategoryReferents {
  readonly ingredients: readonly Ingredient[];
  readonly adHocItems: readonly AdHocItem[];
}

export interface CategoryReferentsInput {
  readonly categoryId: CategoryId;
  readonly ingredients: readonly Ingredient[];
  readonly adHocItems: readonly AdHocItem[];
}

export interface ResolvedRecipeIngredient {
  readonly ingredient: Ingredient;
  readonly quantity: Quantity | null;
}
