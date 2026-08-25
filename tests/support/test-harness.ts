import type { AppRepositories } from '../../src/types/persistence';
import type { ServiceDependencies } from '../../src/types/services';
import type { Clock, IdGenerator } from '../../src/types/ports';
import type { PlatformServices } from '../../src/types/container';
import {
  createInMemoryMetaRepository,
  createInMemoryRepository,
} from '../../src/infrastructure/persistence/in-memory-repository';
import { createBackupCodec } from '../../src/infrastructure/schemas/backup';
import { createServices } from '../../src/services/create-services';
import { buildSeedData } from '../../src/domain/seed/seed-data';

const SCHEMA_VERSION = 1;

const seedNameIds = createTestIdGenerator('seed-name');

export const SEEDED_STAPLE_NAMES: readonly string[] = buildSeedData({
  generateId: () => seedNameIds.next(),
  now: 0,
}).ingredients.map((ingredient) => ingredient.name);

export const SEEDED_STAPLE_LABELS: readonly string[] = [...SEEDED_STAPLE_NAMES].sort(
  (left, right) => left.localeCompare(right, 'en', { sensitivity: 'base' }),
);

export function createTestClock(startAt: number, today: string) {
  let current = startAt;
  const clock: Clock = {
    now: () => current,
    today: () => today,
  };
  return {
    clock,
    advanceTo: (next: number): void => {
      current = next;
    },
  };
}

export function createTestIdGenerator(prefix: string): IdGenerator {
  let counter = 0;
  return {
    next(): string {
      counter += 1;
      return `${prefix}-${String(counter)}`;
    },
  };
}

export function createTestRepositories(): AppRepositories {
  return {
    categories: createInMemoryRepository([]),
    ingredients: createInMemoryRepository([]),
    recipes: createInMemoryRepository([]),
    mealsPlanned: createInMemoryRepository([]),
    staples: createInMemoryRepository([]),
    adHocItems: createInMemoryRepository([]),
    meta: createInMemoryMetaRepository({ themePreference: 'system' }),
  };
}

function createTestPlatform(): PlatformServices {
  return {
    clipboard: {
      isSupported: () => true,
      write: () => Promise.resolve(),
    },
    share: {
      isSupported: () => false,
      share: () => Promise.resolve(),
    },
    download: {
      download: () => undefined,
    },
  };
}

export function createTestHarness(existingRepositories: AppRepositories | null = null) {
  const repositories = existingRepositories ?? createTestRepositories();
  const { clock, advanceTo } = createTestClock(1000, '2026-08-24');
  const ids = createTestIdGenerator('id');

  const dependencies: ServiceDependencies = {
    repositories,
    clock,
    ids,
    backupCodec: createBackupCodec(),
    storagePersistence: {
      requestPersistence: () => Promise.resolve('persisted'),
      getStatus: () =>
        Promise.resolve({
          persistence: 'persisted',
          usageBytes: 1024,
          quotaBytes: 4096,
        }),
    },
    schemaVersion: SCHEMA_VERSION,
  };

  const services = createServices(dependencies, createTestPlatform());

  return { services, repositories, advanceTo, schemaVersion: SCHEMA_VERSION };
}

export async function seedCatalogue(harness: ReturnType<typeof createTestHarness>) {
  await harness.services.seed.ensureSeeded();
  const categories = await harness.services.categories.list();
  const grocery = categories.find((category) => category.name === 'Grocery');
  const produce = categories.find((category) => category.name === 'Produce');
  if (grocery === undefined || produce === undefined) {
    throw new Error('Seed data is missing the expected categories.');
  }
  return { grocery, produce };
}
