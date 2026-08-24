import type { ClipboardPort, FileDownloadPort, SharePort } from './ports';
import type {
  AdHocItemService,
  BackupService,
  CategoryService,
  IngredientService,
  MealPlanService,
  RecipeService,
  SeedService,
  SettingsService,
  ShoppingListService,
  StapleService,
} from './services';

export interface PlatformServices {
  readonly clipboard: ClipboardPort;
  readonly share: SharePort;
  readonly download: FileDownloadPort;
}

export interface AppServices {
  readonly categories: CategoryService;
  readonly ingredients: IngredientService;
  readonly recipes: RecipeService;
  readonly meals: MealPlanService;
  readonly staples: StapleService;
  readonly adHocItems: AdHocItemService;
  readonly shoppingList: ShoppingListService;
  readonly backup: BackupService;
  readonly settings: SettingsService;
  readonly seed: SeedService;
  readonly platform: PlatformServices;
}
