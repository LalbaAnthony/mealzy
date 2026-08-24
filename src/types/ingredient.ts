import type { CategoryId, EpochMillis, IngredientId } from './identifiers';

export interface Category {
  readonly id: CategoryId;
  readonly name: string;
  readonly sortOrder: number;
}

export interface Ingredient {
  readonly id: IngredientId;
  readonly name: string;
  readonly categoryId: CategoryId;
  readonly createdAt: EpochMillis;
  readonly updatedAt: EpochMillis;
}
