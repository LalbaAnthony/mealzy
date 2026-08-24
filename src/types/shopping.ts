import type {
  AdHocItemId,
  CategoryId,
  IngredientId,
  MealPlannedId,
  ShoppingLineKey,
  StapleId,
  EpochMillis,
  IsoDate,
} from './identifiers';
import type { Quantity, QuantityBucket } from './units';
import type { Category, Ingredient } from './ingredient';
import type { MealPlanned } from './meal';
import type { Recipe } from './recipe';

export interface Staple {
  readonly id: StapleId;
  readonly ingredientId: IngredientId;
  readonly defaultQuantity: Quantity | null;
  readonly enabled: boolean;
}

export interface AdHocItem {
  readonly id: AdHocItemId;
  readonly label: string;
  readonly quantity: Quantity | null;
  readonly categoryId: CategoryId;
  readonly createdAt: EpochMillis;
}

export type ShoppingLineSource =
  | { readonly kind: 'meal'; readonly mealPlannedId: MealPlannedId }
  | { readonly kind: 'staple'; readonly stapleId: StapleId }
  | { readonly kind: 'adhoc'; readonly adHocItemId: AdHocItemId };

export interface ShoppingLine {
  readonly key: ShoppingLineKey;
  readonly label: string;
  readonly categoryId: CategoryId;
  readonly quantity: Quantity | null;
  readonly sources: readonly ShoppingLineSource[];
  readonly purchased: boolean;
}

export interface ShoppingListAggregationInput {
  readonly plannedMeals: readonly MealPlanned[];
  readonly recipes: readonly Recipe[];
  readonly ingredients: readonly Ingredient[];
  readonly staples: readonly Staple[];
  readonly adHocItems: readonly AdHocItem[];
  readonly purchasedKeys: readonly ShoppingLineKey[];
}

export interface ShoppingContribution {
  readonly ingredientId: IngredientId;
  readonly bucket: QuantityBucket;
  readonly amount: number;
  readonly source: ShoppingLineSource;
}

export interface ShoppingListGroup {
  readonly categoryId: CategoryId;
  readonly categoryName: string;
  readonly lines: readonly ShoppingLine[];
}

export interface ShoppingListGroupingInput {
  readonly lines: readonly ShoppingLine[];
  readonly categories: readonly Category[];
}

export interface ShoppingListExportInput {
  readonly groups: readonly ShoppingListGroup[];
  readonly generatedOn: IsoDate;
}

export interface ShoppingLineAccumulator {
  readonly key: ShoppingLineKey;
  readonly ingredient: Ingredient;
  readonly bucket: QuantityBucket;
  amount: number;
  readonly sources: ShoppingLineSource[];
}

export interface ShoppingListGroupAccumulator {
  readonly categoryId: CategoryId;
  readonly categoryName: string;
  readonly sortOrder: number;
  readonly lines: ShoppingLine[];
}
