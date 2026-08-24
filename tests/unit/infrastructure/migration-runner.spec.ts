import { describe, expect, it } from 'vitest';
import type { Migration, MigrationContext } from '../../../src/types/persistence';
import {
  ALL_MIGRATIONS,
  CURRENT_SCHEMA_VERSION,
  planMigrations,
  runMigrations,
} from '../../../src/infrastructure/persistence/migrations/migration-runner';
import { StorageError } from '../../../src/infrastructure/persistence/storage-error';

function createRecordingContext() {
  const stores = new Map<string, string>();
  const context: MigrationContext = {
    hasStore: (name) => stores.has(name),
    createStore: (name, keyPath) => {
      stores.set(name, keyPath);
    },
    deleteStore: (name) => {
      stores.delete(name);
    },
  };
  return { context, stores };
}

describe('migration runner', () => {
  it('creates every object store when opening version 1 from scratch', () => {
    const { context, stores } = createRecordingContext();

    runMigrations(ALL_MIGRATIONS, 0, CURRENT_SCHEMA_VERSION, context);

    expect([...stores.keys()].sort()).toEqual([
      'adHocItems',
      'categories',
      'ingredients',
      'mealsPlanned',
      'meta',
      'recipes',
      'staples',
    ]);
    expect(stores.get('categories')).toBe('id');
    expect(stores.get('meta')).toBe('key');
  });

  it('is idempotent when the stores already exist', () => {
    const { context, stores } = createRecordingContext();

    runMigrations(ALL_MIGRATIONS, 0, CURRENT_SCHEMA_VERSION, context);
    runMigrations(ALL_MIGRATIONS, 0, CURRENT_SCHEMA_VERSION, context);

    expect(stores.size).toBe(7);
  });

  it('plans nothing when the stored version already matches', () => {
    expect(planMigrations(ALL_MIGRATIONS, 1, 1)).toEqual([]);
  });

  it('rejects data written by a newer schema version instead of accepting it', () => {
    expect(() => planMigrations(ALL_MIGRATIONS, 2, 1)).toThrow(StorageError);
    expect(() => planMigrations(ALL_MIGRATIONS, 2, 1)).toThrow(/newer than the version/);
  });

  it('rejects an upgrade with no registered step', () => {
    const orphan: readonly Migration[] = [];

    expect(() => planMigrations(orphan, 0, 1)).toThrow(/No migration is registered/);
  });

  it('chains multiple steps in order', () => {
    const applied: string[] = [];
    const chain: readonly Migration[] = [
      { from: 0, to: 1, migrate: () => applied.push('first') },
      { from: 1, to: 2, migrate: () => applied.push('second') },
    ];
    const { context } = createRecordingContext();

    runMigrations(chain, 0, 2, context);

    expect(applied).toEqual(['first', 'second']);
  });
});
