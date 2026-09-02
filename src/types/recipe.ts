import type { EpochMillis, IngredientId, RecipeId } from './identifiers';
import type { Quantity } from './units';

export interface RecipeIngredient {
  readonly ingredientId: IngredientId;
  readonly quantity: Quantity | null;
}

export interface Recipe {
  readonly id: RecipeId;
  readonly name: string;
  readonly notes: string;
  readonly instructions: string;
  readonly ingredients: readonly RecipeIngredient[];
  readonly createdAt: EpochMillis;
  readonly updatedAt: EpochMillis;
}
