import type { EpochMillis } from './identifiers';
import type { Category, Ingredient } from './ingredient';
import type { Staple } from './shopping';

export interface SeedDataInput {
  readonly generateId: () => string;
  readonly now: EpochMillis;
}

export interface SeedData {
  readonly categories: readonly Category[];
  readonly ingredients: readonly Ingredient[];
  readonly staples: readonly Staple[];
}
