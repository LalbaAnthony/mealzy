import type { EpochMillis } from './identifiers';
import type { Category, Ingredient } from './ingredient';

export interface SeedCategory {
  readonly key: string;
  readonly name: string;
  readonly sortOrder: number;
}

export interface SeedIngredient {
  readonly name: string;
  readonly categoryKey: string;
}

export interface SeedCatalogue {
  readonly categories: readonly SeedCategory[];
  readonly ingredients: readonly SeedIngredient[];
}

export interface SeedDataInput {
  readonly catalogue: SeedCatalogue;
  readonly generateId: () => string;
  readonly now: EpochMillis;
}

export interface SeedData {
  readonly categories: readonly Category[];
  readonly ingredients: readonly Ingredient[];
}
