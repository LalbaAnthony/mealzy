import type {
  AdHocItemId,
  CategoryId,
  IngredientId,
  MealPlannedId,
  RecipeId,
  ShoppingLineKey,
  StapleId,
} from './identifiers';
import type { Category, Ingredient } from './ingredient';
import type { MealPlanned } from './meal';
import type { Recipe } from './recipe';
import type { AdHocItem, Staple } from './shopping';
import type { AppPreferences } from './settings';

export interface Repository<TEntity, TId> {
  getAll(): Promise<readonly TEntity[]>;
  getById(id: TId): Promise<TEntity | null>;
  put(entity: TEntity): Promise<void>;
  remove(id: TId): Promise<void>;
}

export type CategoryRepository = Repository<Category, CategoryId>;
export type IngredientRepository = Repository<Ingredient, IngredientId>;
export type RecipeRepository = Repository<Recipe, RecipeId>;
export type MealPlannedRepository = Repository<MealPlanned, MealPlannedId>;
export type StapleRepository = Repository<Staple, StapleId>;
export type AdHocItemRepository = Repository<AdHocItem, AdHocItemId>;

export interface AppMetaRepository {
  getSchemaVersion(): Promise<number | null>;
  setSchemaVersion(version: number): Promise<void>;
  getPurchasedKeys(): Promise<readonly ShoppingLineKey[]>;
  setPurchasedKeys(keys: readonly ShoppingLineKey[]): Promise<void>;
  getPreferences(): Promise<AppPreferences>;
  setPreferences(preferences: AppPreferences): Promise<void>;
}

export interface AppRepositories {
  readonly categories: CategoryRepository;
  readonly ingredients: IngredientRepository;
  readonly recipes: RecipeRepository;
  readonly mealsPlanned: MealPlannedRepository;
  readonly staples: StapleRepository;
  readonly adHocItems: AdHocItemRepository;
  readonly meta: AppMetaRepository;
}

export type StorageFailureKind = 'quota-exceeded' | 'unavailable' | 'corrupt-data' | 'unknown';

export interface StorageFailure {
  readonly kind: StorageFailureKind;
  readonly message: string;
}

export interface MigrationContext {
  hasStore(name: string): boolean;
  createStore(name: string, keyPath: string): void;
  deleteStore(name: string): void;
}

export interface Migration {
  readonly from: number;
  readonly to: number;
  migrate(context: MigrationContext): void;
}
