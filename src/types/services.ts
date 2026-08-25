import type {
  AdHocItemId,
  CategoryId,
  IngredientId,
  IsoDate,
  MealPlannedId,
  RecipeId,
  ShoppingLineKey,
  StapleId,
} from './identifiers';
import type { Category, Ingredient } from './ingredient';
import type { MealPlanned, MealSlot } from './meal';
import type { Recipe } from './recipe';
import type { AdHocItem, ShoppingLine, ShoppingListGroup, Staple } from './shopping';
import type { Quantity } from './units';
import type { DomainResult } from './validation';
import type { BackupExport } from './backup';
import type { AppRepositories } from './persistence';
import type { BackupCodec, Clock, IdGenerator, StoragePersistencePort } from './ports';
import type {
  AppPreferences,
  StoragePersistenceState,
  StorageStatus,
  ThemePreference,
} from './settings';

export interface IngredientDraft {
  readonly name: string;
  readonly categoryId: CategoryId;
}

export interface RecipeIngredientDraft {
  readonly ingredientId: IngredientId;
  readonly quantity: Quantity | null;
}

export interface RecipeDraft {
  readonly name: string;
  readonly notes: string;
  readonly ingredients: readonly RecipeIngredientDraft[];
}

export interface MealPlannedDraft {
  readonly scheduledDate: IsoDate | null;
  readonly slot: MealSlot | null;
}

export interface StapleDraft {
  readonly ingredientId: IngredientId;
  readonly defaultQuantity: Quantity | null;
  readonly enabled: boolean;
}

export interface AdHocItemDraft {
  readonly label: string;
  readonly quantity: Quantity | null;
  readonly categoryId: CategoryId;
}

export interface ShoppingListSnapshot {
  readonly groups: readonly ShoppingListGroup[];
  readonly lines: readonly ShoppingLine[];
  readonly purchasedCount: number;
  readonly totalCount: number;
}

export interface CategoryService {
  list(): Promise<readonly Category[]>;
  create(name: string): Promise<DomainResult<Category>>;
  rename(id: CategoryId, name: string): Promise<DomainResult<Category>>;
  remove(id: CategoryId): Promise<DomainResult<void>>;
}

export interface IngredientService {
  list(): Promise<readonly Ingredient[]>;
  create(draft: IngredientDraft): Promise<DomainResult<Ingredient>>;
  update(id: IngredientId, draft: IngredientDraft): Promise<DomainResult<Ingredient>>;
  remove(id: IngredientId): Promise<DomainResult<void>>;
}

export interface RecipeService {
  list(): Promise<readonly Recipe[]>;
  getById(id: RecipeId): Promise<Recipe | null>;
  create(draft: RecipeDraft): Promise<DomainResult<Recipe>>;
  update(id: RecipeId, draft: RecipeDraft): Promise<DomainResult<Recipe>>;
  remove(id: RecipeId): Promise<DomainResult<void>>;
}

export interface MealPlanService {
  list(): Promise<readonly MealPlanned[]>;
  plan(recipeId: RecipeId, draft: MealPlannedDraft): Promise<DomainResult<MealPlanned>>;
  update(id: MealPlannedId, draft: MealPlannedDraft): Promise<DomainResult<MealPlanned>>;
  markEaten(id: MealPlannedId): Promise<DomainResult<MealPlanned>>;
  markPlanned(id: MealPlannedId): Promise<DomainResult<MealPlanned>>;
  moveUp(id: MealPlannedId): Promise<DomainResult<void>>;
  moveDown(id: MealPlannedId): Promise<DomainResult<void>>;
  remove(id: MealPlannedId): Promise<DomainResult<void>>;
}

export interface StapleService {
  list(): Promise<readonly Staple[]>;
  create(draft: StapleDraft): Promise<DomainResult<Staple>>;
  update(id: StapleId, draft: StapleDraft): Promise<DomainResult<Staple>>;
  remove(id: StapleId): Promise<DomainResult<void>>;
}

export interface AdHocItemService {
  list(): Promise<readonly AdHocItem[]>;
  create(draft: AdHocItemDraft): Promise<DomainResult<AdHocItem>>;
  update(id: AdHocItemId, draft: AdHocItemDraft): Promise<DomainResult<AdHocItem>>;
  remove(id: AdHocItemId): Promise<DomainResult<void>>;
}

export interface ShoppingListService {
  getSnapshot(): Promise<ShoppingListSnapshot>;
  setPurchased(key: ShoppingLineKey, purchased: boolean): Promise<void>;
  resetTrip(): Promise<void>;
  buildExportText(): Promise<string>;
}

export interface BackupService {
  exportDocument(): Promise<BackupExport>;
  importDocument(rawJson: string): Promise<DomainResult<void>>;
}

export interface LocalDataSummary {
  readonly recipes: number;
  readonly plannedMeals: number;
  readonly ingredients: number;
  readonly categories: number;
  readonly staples: number;
  readonly adHocItems: number;
  readonly purchasedTicks: number;
}

export interface DataResetService {
  summarise(): Promise<LocalDataSummary>;
  eraseEverything(): Promise<void>;
}

export interface SettingsService {
  getPreferences(): Promise<AppPreferences>;
  setThemePreference(preference: ThemePreference): Promise<AppPreferences>;
  getStorageStatus(): Promise<StorageStatus>;
  requestPersistence(): Promise<StoragePersistenceState>;
}

export interface SeedService {
  ensureSeeded(): Promise<void>;
}

export interface ServiceDependencies {
  readonly repositories: AppRepositories;
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly backupCodec: BackupCodec;
  readonly storagePersistence: StoragePersistencePort;
  readonly schemaVersion: number;
}
