import type { EpochMillis, ShoppingLineKey } from './identifiers';
import type { Category, Ingredient } from './ingredient';
import type { MealPlanned } from './meal';
import type { Recipe } from './recipe';
import type { AdHocItem, Staple } from './shopping';
import type { AppPreferences } from './settings';

export interface BackupDocument {
  readonly schemaVersion: number;
  readonly exportedAt: EpochMillis;
  readonly categories: readonly Category[];
  readonly ingredients: readonly Ingredient[];
  readonly recipes: readonly Recipe[];
  readonly mealsPlanned: readonly MealPlanned[];
  readonly staples: readonly Staple[];
  readonly adHocItems: readonly AdHocItem[];
  readonly purchasedKeys: readonly ShoppingLineKey[];
  readonly preferences: AppPreferences;
}

export interface BackupExport {
  readonly fileName: string;
  readonly json: string;
}

export interface BackupContents {
  readonly categories: readonly Category[];
  readonly ingredients: readonly Ingredient[];
  readonly recipes: readonly Recipe[];
  readonly mealsPlanned: readonly MealPlanned[];
  readonly staples: readonly Staple[];
  readonly adHocItems: readonly AdHocItem[];
  readonly purchasedKeys: readonly ShoppingLineKey[];
  readonly preferences: AppPreferences;
}
