import type { BackupContents, BackupDocument } from '../types/backup';
import type { AppRepositories, Repository } from '../types/persistence';
import type { BackupService, ServiceDependencies } from '../types/services';
import type { DomainResult } from '../types/validation';
import { ok } from '../domain/validation/result';

async function replaceAll<TEntity extends { readonly id: string }>(
  repository: Repository<TEntity, string>,
  entities: readonly TEntity[],
): Promise<void> {
  for (const existing of await repository.getAll()) {
    await repository.remove(existing.id);
  }
  for (const entity of entities) {
    await repository.put(entity);
  }
}

async function readEverything(repositories: AppRepositories): Promise<BackupContents> {
  const [
    categories,
    ingredients,
    recipes,
    mealsPlanned,
    staples,
    adHocItems,
    purchasedKeys,
    preferences,
  ] = await Promise.all([
    repositories.categories.getAll(),
    repositories.ingredients.getAll(),
    repositories.recipes.getAll(),
    repositories.mealsPlanned.getAll(),
    repositories.staples.getAll(),
    repositories.adHocItems.getAll(),
    repositories.meta.getPurchasedKeys(),
    repositories.meta.getPreferences(),
  ]);

  return {
    categories,
    ingredients,
    recipes,
    mealsPlanned,
    staples,
    adHocItems,
    purchasedKeys,
    preferences,
  };
}

export function createBackupService(dependencies: ServiceDependencies): BackupService {
  const { repositories, backupCodec, clock, schemaVersion } = dependencies;

  return {
    async exportDocument(): Promise<string> {
      const contents = await readEverything(repositories);
      const document: BackupDocument = {
        schemaVersion,
        exportedAt: clock.now(),
        ...contents,
      };
      return backupCodec.serialise(document);
    },

    async importDocument(rawJson: string): Promise<DomainResult<void>> {
      const parsed = backupCodec.parse(rawJson);
      if (!parsed.ok) {
        return parsed;
      }

      const document = parsed.value;
      await replaceAll(repositories.categories, document.categories);
      await replaceAll(repositories.ingredients, document.ingredients);
      await replaceAll(repositories.recipes, document.recipes);
      await replaceAll(repositories.mealsPlanned, document.mealsPlanned);
      await replaceAll(repositories.staples, document.staples);
      await replaceAll(repositories.adHocItems, document.adHocItems);
      await repositories.meta.setPurchasedKeys(document.purchasedKeys);
      await repositories.meta.setPreferences(document.preferences);
      await repositories.meta.setSchemaVersion(schemaVersion);

      return ok(undefined);
    },
  };
}
