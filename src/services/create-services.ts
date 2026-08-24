import type { AppServices, PlatformServices } from '../types/container';
import type { ServiceDependencies } from '../types/services';
import { createAdHocItemService } from './adhoc-item-service';
import { createBackupService } from './backup-service';
import { createCategoryService } from './category-service';
import { createIngredientService } from './ingredient-service';
import { createMealPlanService } from './meal-plan-service';
import { createRecipeService } from './recipe-service';
import { createSeedService } from './seed-service';
import { createSettingsService } from './settings-service';
import { createShoppingListService } from './shopping-list-service';
import { createStapleService } from './staple-service';

export function createServices(
  dependencies: ServiceDependencies,
  platform: PlatformServices,
): AppServices {
  return {
    categories: createCategoryService(dependencies),
    ingredients: createIngredientService(dependencies),
    recipes: createRecipeService(dependencies),
    meals: createMealPlanService(dependencies),
    staples: createStapleService(dependencies),
    adHocItems: createAdHocItemService(dependencies),
    shoppingList: createShoppingListService(dependencies),
    backup: createBackupService(dependencies),
    settings: createSettingsService(dependencies),
    seed: createSeedService(dependencies),
    platform,
  };
}
