import type { ServiceDependencies } from '../types/services';
import { SEED_CATALOGUE } from '../domain/seed/seed-catalogue';
import { buildSeedData } from '../domain/seed/seed-data';

export async function writeSeedData(dependencies: ServiceDependencies): Promise<void> {
  const { categories, ingredients } = dependencies.repositories;

  const seed = buildSeedData({
    catalogue: SEED_CATALOGUE,
    generateId: () => dependencies.ids.next(),
    now: dependencies.clock.now(),
  });

  for (const category of seed.categories) {
    await categories.put(category);
  }
  for (const ingredient of seed.ingredients) {
    await ingredients.put(ingredient);
  }
}
