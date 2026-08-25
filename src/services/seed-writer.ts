import type { ServiceDependencies } from '../types/services';
import { buildSeedData } from '../domain/seed/seed-data';

export async function writeSeedData(dependencies: ServiceDependencies): Promise<void> {
  const { categories, ingredients, staples } = dependencies.repositories;

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
}
