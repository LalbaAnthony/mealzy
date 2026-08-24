import type { SeedService, ServiceDependencies } from '../types/services';
import { buildSeedData } from '../domain/seed/seed-data';

export function createSeedService(dependencies: ServiceDependencies): SeedService {
  const { categories, ingredients, staples, meta } = dependencies.repositories;

  return {
    async ensureSeeded(): Promise<void> {
      const storedVersion = await meta.getSchemaVersion();
      if (storedVersion !== null) {
        return;
      }

      const seed = buildSeedData({
        generateId: () => dependencies.ids.next(),
        now: dependencies.clock.now(),
      });

      for (const category of seed.categories) {
        await categories.put(category);
      }
      for (const ingredient of seed.ingredients) {
        await ingredients.put(ingredient);
      }
      for (const staple of seed.staples) {
        await staples.put(staple);
      }

      await meta.setSchemaVersion(dependencies.schemaVersion);
    },
  };
}
