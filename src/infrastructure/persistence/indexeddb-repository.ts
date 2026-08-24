import type { IDBPDatabase } from 'idb';
import type { ZodType } from 'zod';
import type { ShoppingLineKey } from '../../types/identifiers';
import type { AppMetaRepository, Repository } from '../../types/persistence';
import type { AppPreferences } from '../../types/settings';
import { appPreferencesSchema, purchasedKeysSchema } from '../schemas/entities';
import {
  META_KEY_PREFERENCES,
  META_KEY_PURCHASED_KEYS,
  META_KEY_SCHEMA_VERSION,
  STORE_META,
} from './store-names';
import { StorageError, toStorageError } from './storage-error';

function describeIssues(issues: readonly { path: PropertyKey[]; message: string }[]): string {
  return issues
    .map((issue) => {
      const path = issue.path.map((segment) => String(segment)).join('.');
      return path.length === 0 ? issue.message : `${path}: ${issue.message}`;
    })
    .join('; ');
}

function parseRecord<TValue>(schema: ZodType<TValue>, raw: unknown, location: string): TValue {
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new StorageError(
      'corrupt-data',
      `Stored data in "${location}" is not valid and was not loaded (${describeIssues(result.error.issues)}). Restore a backup from Settings to recover.`,
    );
  }
  return result.data;
}

export function createIdbRepository<TEntity extends { readonly id: TId }, TId extends IDBValidKey>(
  database: IDBPDatabase,
  storeName: string,
  schema: ZodType<TEntity>,
): Repository<TEntity, TId> {
  return {
    async getAll(): Promise<readonly TEntity[]> {
      try {
        const raw: unknown = await database.getAll(storeName);
        if (!Array.isArray(raw)) {
          throw new StorageError('corrupt-data', `Store "${storeName}" did not return a list.`);
        }
        return raw.map((record: unknown) => parseRecord(schema, record, storeName));
      } catch (error) {
        throw toStorageError(error);
      }
    },

    async getById(id: TId): Promise<TEntity | null> {
      try {
        const raw: unknown = await database.get(storeName, id);
        if (raw === undefined) {
          return null;
        }
        return parseRecord(schema, raw, storeName);
      } catch (error) {
        throw toStorageError(error);
      }
    },

    async put(entity: TEntity): Promise<void> {
      try {
        await database.put(storeName, entity);
      } catch (error) {
        throw toStorageError(error);
      }
    },

    async remove(id: TId): Promise<void> {
      try {
        await database.delete(storeName, id);
      } catch (error) {
        throw toStorageError(error);
      }
    },
  };
}

export function createIdbMetaRepository(database: IDBPDatabase): AppMetaRepository {
  async function readValue(key: string): Promise<unknown> {
    try {
      const raw: unknown = await database.get(STORE_META, key);
      if (raw === undefined || raw === null) {
        return undefined;
      }
      if (typeof raw !== 'object' || !('value' in raw)) {
        throw new StorageError('corrupt-data', `Metadata entry "${key}" is malformed.`);
      }
      const container: { value: unknown } = { value: Reflect.get(raw, 'value') };
      return container.value;
    } catch (error) {
      throw toStorageError(error);
    }
  }

  async function writeValue(key: string, value: unknown): Promise<void> {
    try {
      await database.put(STORE_META, { key, value });
    } catch (error) {
      throw toStorageError(error);
    }
  }

  return {
    async getSchemaVersion(): Promise<number | null> {
      const value = await readValue(META_KEY_SCHEMA_VERSION);
      return typeof value === 'number' ? value : null;
    },

    setSchemaVersion(version: number): Promise<void> {
      return writeValue(META_KEY_SCHEMA_VERSION, version);
    },

    async getPurchasedKeys(): Promise<readonly ShoppingLineKey[]> {
      const value = await readValue(META_KEY_PURCHASED_KEYS);
      if (value === undefined) {
        return [];
      }
      return parseRecord(purchasedKeysSchema, value, META_KEY_PURCHASED_KEYS);
    },

    setPurchasedKeys(keys: readonly ShoppingLineKey[]): Promise<void> {
      return writeValue(META_KEY_PURCHASED_KEYS, [...keys]);
    },

    async getPreferences(): Promise<AppPreferences> {
      const value = await readValue(META_KEY_PREFERENCES);
      if (value === undefined) {
        return { themePreference: 'system' };
      }
      return parseRecord(appPreferencesSchema, value, META_KEY_PREFERENCES);
    },

    setPreferences(preferences: AppPreferences): Promise<void> {
      return writeValue(META_KEY_PREFERENCES, preferences);
    },
  };
}
