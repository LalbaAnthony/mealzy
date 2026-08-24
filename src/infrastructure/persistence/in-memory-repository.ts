import type { AppPreferences } from '../../types/settings';
import type { ShoppingLineKey } from '../../types/identifiers';
import type { AppMetaRepository, Repository } from '../../types/persistence';

export function createInMemoryRepository<TEntity extends { readonly id: TId }, TId>(
  seed: readonly TEntity[],
): Repository<TEntity, TId> {
  const entities = new Map<TId, TEntity>(seed.map((entity) => [entity.id, entity]));

  return {
    getAll(): Promise<readonly TEntity[]> {
      return Promise.resolve([...entities.values()]);
    },
    getById(id: TId): Promise<TEntity | null> {
      return Promise.resolve(entities.get(id) ?? null);
    },
    put(entity: TEntity): Promise<void> {
      entities.set(entity.id, entity);
      return Promise.resolve();
    },
    remove(id: TId): Promise<void> {
      entities.delete(id);
      return Promise.resolve();
    },
  };
}

export function createInMemoryMetaRepository(
  initialPreferences: AppPreferences,
): AppMetaRepository {
  let schemaVersion: number | null = null;
  let purchasedKeys: readonly ShoppingLineKey[] = [];
  let preferences: AppPreferences = initialPreferences;

  return {
    getSchemaVersion(): Promise<number | null> {
      return Promise.resolve(schemaVersion);
    },
    setSchemaVersion(version: number): Promise<void> {
      schemaVersion = version;
      return Promise.resolve();
    },
    getPurchasedKeys(): Promise<readonly ShoppingLineKey[]> {
      return Promise.resolve(purchasedKeys);
    },
    setPurchasedKeys(keys: readonly ShoppingLineKey[]): Promise<void> {
      purchasedKeys = [...keys];
      return Promise.resolve();
    },
    getPreferences(): Promise<AppPreferences> {
      return Promise.resolve(preferences);
    },
    setPreferences(next: AppPreferences): Promise<void> {
      preferences = next;
      return Promise.resolve();
    },
  };
}
