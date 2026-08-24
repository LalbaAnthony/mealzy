import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';
import type { MigrationContext } from '../../types/persistence';
import {
  ALL_MIGRATIONS,
  CURRENT_SCHEMA_VERSION,
  runMigrations,
} from './migrations/migration-runner';
import { StorageError, toStorageError } from './storage-error';

const DATABASE_NAME = 'mealzy';

function createMigrationContext(database: IDBPDatabase): MigrationContext {
  return {
    hasStore(name: string): boolean {
      return database.objectStoreNames.contains(name);
    },
    createStore(name: string, keyPath: string): void {
      database.createObjectStore(name, { keyPath });
    },
    deleteStore(name: string): void {
      database.deleteObjectStore(name);
    },
  };
}

export async function openApplicationDatabase(): Promise<IDBPDatabase> {
  if (typeof indexedDB === 'undefined') {
    throw new StorageError(
      'unavailable',
      'This browser does not expose IndexedDB. Private browsing windows often disable it, and this application cannot store data without it.',
    );
  }

  try {
    return await openDB(DATABASE_NAME, CURRENT_SCHEMA_VERSION, {
      upgrade(database, oldVersion, newVersion): void {
        runMigrations(
          ALL_MIGRATIONS,
          oldVersion,
          newVersion ?? CURRENT_SCHEMA_VERSION,
          createMigrationContext(database),
        );
      },
    });
  } catch (error) {
    throw toStorageError(error);
  }
}
