import type { AppRepositories } from '../types/persistence';
import type { AppServices, PlatformServices } from '../types/container';
import type { ServiceDependencies } from '../types/services';
import {
  adHocItemSchema,
  categorySchema,
  ingredientSchema,
  mealPlannedSchema,
  recipeSchema,
  stapleSchema,
} from '../infrastructure/schemas/entities';
import { createBackupCodec } from '../infrastructure/schemas/backup';
import { openApplicationDatabase } from '../infrastructure/persistence/indexeddb-database';
import {
  createIdbMetaRepository,
  createIdbRepository,
} from '../infrastructure/persistence/indexeddb-repository';
import { CURRENT_SCHEMA_VERSION } from '../infrastructure/persistence/migrations/migration-runner';
import {
  STORE_ADHOC_ITEMS,
  STORE_CATEGORIES,
  STORE_INGREDIENTS,
  STORE_MEALS_PLANNED,
  STORE_RECIPES,
  STORE_STAPLES,
} from '../infrastructure/persistence/store-names';
import { createSystemClock } from '../infrastructure/platform/clock';
import { createCryptoIdGenerator } from '../infrastructure/platform/id-generator';
import {
  createClipboardPort,
  createFileDownloadPort,
  createSharePort,
  createStoragePersistencePort,
} from '../infrastructure/platform/web-capabilities';
import { createServices } from '../services/create-services';
import { configureServices } from './container';

export async function bootstrapApplication(): Promise<AppServices> {
  const database = await openApplicationDatabase();

  const repositories: AppRepositories = {
    categories: createIdbRepository(database, STORE_CATEGORIES, categorySchema),
    ingredients: createIdbRepository(database, STORE_INGREDIENTS, ingredientSchema),
    recipes: createIdbRepository(database, STORE_RECIPES, recipeSchema),
    mealsPlanned: createIdbRepository(database, STORE_MEALS_PLANNED, mealPlannedSchema),
    staples: createIdbRepository(database, STORE_STAPLES, stapleSchema),
    adHocItems: createIdbRepository(database, STORE_ADHOC_ITEMS, adHocItemSchema),
    meta: createIdbMetaRepository(database),
  };

  const dependencies: ServiceDependencies = {
    repositories,
    clock: createSystemClock(),
    ids: createCryptoIdGenerator(),
    backupCodec: createBackupCodec(),
    storagePersistence: createStoragePersistencePort(),
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };

  const platform: PlatformServices = {
    clipboard: createClipboardPort(),
    share: createSharePort(),
    download: createFileDownloadPort(),
  };

  const services = createServices(dependencies, platform);
  configureServices(services);
  await services.seed.ensureSeeded();
  await services.settings.requestPersistence();

  return services;
}
