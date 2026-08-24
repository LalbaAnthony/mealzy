import type { Migration, MigrationContext } from '../../../types/persistence';
import { ENTITY_STORE_NAMES, STORE_META } from '../store-names';

export const initialSchemaMigration: Migration = {
  from: 0,
  to: 1,
  migrate(context: MigrationContext): void {
    for (const storeName of ENTITY_STORE_NAMES) {
      if (!context.hasStore(storeName)) {
        context.createStore(storeName, 'id');
      }
    }
    if (!context.hasStore(STORE_META)) {
      context.createStore(STORE_META, 'key');
    }
  },
};
