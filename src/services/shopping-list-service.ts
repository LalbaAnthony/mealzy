import type { ShoppingLineKey } from '../types/identifiers';
import type {
  ServiceDependencies,
  ShoppingListService,
  ShoppingListSnapshot,
} from '../types/services';
import { aggregateShoppingList } from '../domain/aggregation/aggregate-shopping-list';
import { groupShoppingList } from '../domain/aggregation/group-shopping-list';
import { shoppingLineKeyForAdHocItem } from '../domain/aggregation/shopping-line-key';
import { buildShoppingListText } from '../domain/export/shopping-list-text';

export function createShoppingListService(dependencies: ServiceDependencies): ShoppingListService {
  const { mealsPlanned, recipes, ingredients, staples, adHocItems, categories, meta } =
    dependencies.repositories;

  async function buildSnapshot(): Promise<ShoppingListSnapshot> {
    const [
      allMeals,
      allRecipes,
      allIngredients,
      allStaples,
      allAdHocItems,
      allCategories,
      purchasedKeys,
    ] = await Promise.all([
      mealsPlanned.getAll(),
      recipes.getAll(),
      ingredients.getAll(),
      staples.getAll(),
      adHocItems.getAll(),
      categories.getAll(),
      meta.getPurchasedKeys(),
    ]);

    const lines = aggregateShoppingList({
      plannedMeals: allMeals,
      recipes: allRecipes,
      ingredients: allIngredients,
      staples: allStaples,
      adHocItems: allAdHocItems,
      purchasedKeys,
    });

    const groups = groupShoppingList({ lines, categories: allCategories });

    return {
      groups,
      lines,
      purchasedCount: lines.filter((line) => line.purchased).length,
      totalCount: lines.length,
    };
  }

  return {
    getSnapshot(): Promise<ShoppingListSnapshot> {
      return buildSnapshot();
    },

    async setPurchased(key: ShoppingLineKey, purchased: boolean): Promise<void> {
      const current = new Set(await meta.getPurchasedKeys());
      if (purchased) {
        current.add(key);
      } else {
        current.delete(key);
      }
      await meta.setPurchasedKeys([...current]);
    },

    async resetTrip(): Promise<void> {
      const purchasedKeys = new Set(await meta.getPurchasedKeys());
      const allAdHocItems = await adHocItems.getAll();

      for (const item of allAdHocItems) {
        if (purchasedKeys.has(shoppingLineKeyForAdHocItem(item.id))) {
          await adHocItems.remove(item.id);
        }
      }

      await meta.setPurchasedKeys([]);
    },

    async buildExportText(): Promise<string> {
      const snapshot = await buildSnapshot();
      return buildShoppingListText({
        groups: snapshot.groups,
        generatedOn: dependencies.clock.today(),
      });
    },
  };
}
