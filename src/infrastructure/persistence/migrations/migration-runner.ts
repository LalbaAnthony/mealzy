import type { Migration, MigrationContext } from '../../../types/persistence';
import { StorageError } from '../storage-error';
import { initialSchemaMigration } from './001-initial-schema';

export const ALL_MIGRATIONS: readonly Migration[] = [initialSchemaMigration];

export const CURRENT_SCHEMA_VERSION = 1;

export function planMigrations(
  migrations: readonly Migration[],
  fromVersion: number,
  toVersion: number,
): readonly Migration[] {
  if (fromVersion > toVersion) {
    throw new StorageError(
      'corrupt-data',
      `The stored data uses schema version ${String(fromVersion)}, which is newer than the version ${String(toVersion)} this application understands. Update the application instead of downgrading the data.`,
    );
  }

  const planned: Migration[] = [];
  let currentVersion = fromVersion;
  while (currentVersion < toVersion) {
    const step = migrations.find((migration) => migration.from === currentVersion);
    if (step === undefined) {
      throw new StorageError(
        'corrupt-data',
        `No migration is registered from schema version ${String(currentVersion)}. The stored data cannot be upgraded safely.`,
      );
    }
    planned.push(step);
    currentVersion = step.to;
  }

  return planned;
}

export function runMigrations(
  migrations: readonly Migration[],
  fromVersion: number,
  toVersion: number,
  context: MigrationContext,
): void {
  for (const migration of planMigrations(migrations, fromVersion, toVersion)) {
    migration.migrate(context);
  }
}
