import type { DataResetService, LocalDataSummary, ServiceDependencies } from '../types/services';
import type { Repository } from '../types/persistence';
import { DEFAULT_APP_PREFERENCES } from '../domain/constants';
import { writeSeedData } from './seed-writer';

async function removeEvery<TEntity extends { readonly id: string }>(
  repository: Repository<TEntity, string>,
): Promise<void> {
  for (const entity of await repository.getAll()) {
    await repository.remove(entity.id);
  }
}

export function createDataResetService(dependencies: ServiceDependencies): DataResetService {
  const { repositories } = dependencies;

  return {
    async summarise(): Promise<LocalDataSummary> {
      const [recipes, plannedMeals, ingredients, categories, staples, adHocItems, purchasedKeys] =
        await Promise.all([
          repositories.recipes.getAll(),
          repositories.mealsPlanned.getAll(),
          repositories.ingredients.getAll(),
          repositories.categories.getAll(),
          repositories.staples.getAll(),
          repositories.adHocItems.getAll(),
          repositories.meta.getPurchasedKeys(),
        ]);

      return {
        recipes: recipes.length,
        plannedMeals: plannedMeals.length,
        ingredients: ingredients.length,
        categories: categories.length,
        staples: staples.length,
        adHocItems: adHocItems.length,
        purchasedTicks: purchasedKeys.length,
      };
    },

    async eraseEverything(): Promise<void> {
      await removeEvery(repositories.mealsPlanned);
      await removeEvery(repositories.recipes);
      await removeEvery(repositories.staples);
      await removeEvery(repositories.adHocItems);
      await removeEvery(repositories.ingredients);
      await removeEvery(repositories.categories);
      await repositories.meta.setPurchasedKeys([]);
      await repositories.meta.setPreferences(DEFAULT_APP_PREFERENCES);

      await writeSeedData(dependencies);
      await repositories.meta.setSchemaVersion(dependencies.schemaVersion);
    },
  };
}
