# Persistence

All data lives in IndexedDB in the user's browser, accessed through the `idb` package. There is no
server, so there is no other copy of the data. The backup export in Settings is the only way to move
data off a device.

## Object stores

The database is named `mealzy`. Version 1 creates seven stores.

| Store          | Key path | Holds                                    |
| -------------- | -------- | ---------------------------------------- |
| `categories`   | `id`     | `Category`                               |
| `ingredients`  | `id`     | `Ingredient`                             |
| `recipes`      | `id`     | `Recipe`                                 |
| `mealsPlanned` | `id`     | `MealPlanned`                            |
| `staples`      | `id`     | `Staple`                                 |
| `adHocItems`   | `id`     | `AdHocItem`                              |
| `meta`         | `key`    | Schema version, purchased keys, settings |

The `meta` store holds `{ key, value }` records under three keys: `schemaVersion`, `purchasedKeys`
and `preferences`.

## Repository ports

Every repository implements a narrow port declared in `src/types/persistence.ts`:

```ts
interface Repository<TEntity, TId> {
  getAll(): Promise<readonly TEntity[]>;
  getById(id: TId): Promise<TEntity | null>;
  put(entity: TEntity): Promise<void>;
  remove(id: TId): Promise<void>;
}
```

Two implementations exist:

- `createIdbRepository` in `indexeddb-repository.ts`, used in production.
- `createInMemoryRepository` in `in-memory-repository.ts`, used by every test and available for any
  future preview mode.

Services depend on the port, never on either implementation. See
[ADR 0004](adr/0004-indexeddb-behind-repository-ports.md).

## The validation boundary

Every record read out of IndexedDB, and every imported JSON document, is parsed with a zod schema
from `src/infrastructure/schemas/`. These schemas are the only place in the codebase where a raw
`unknown` becomes a typed value, and the only directory where type assertions are permitted.

Schemas cannot drift from the hand-written types. Each one carries a compile-time assertion:

```ts
assertSchemaMatchesDeclaredType<IsExactly<z.output<typeof recipeSchema>, Recipe>>(true);
```

`IsExactly` is an exact type-identity check, so adding a field to the schema without adding it to the
interface, or vice versa, fails `npm run typecheck` with "Type 'false' does not satisfy the
constraint 'true'". This is verified: temporarily adding a field to one schema does fail the build.

## Migrations

`src/infrastructure/persistence/migrations/` holds one module per schema version step, each exposing
`from`, `to` and `migrate`. `migration-runner.ts` applies them in order when the database opens.

```ts
interface Migration {
  readonly from: number;
  readonly to: number;
  migrate(context: MigrationContext): void;
}
```

`MigrationContext` exposes `hasStore`, `createStore` and `deleteStore`. Migration modules never
import `idb`, so the runner is testable without IndexedDB, which is exactly what
`tests/unit/infrastructure/migration-runner.spec.ts` does.

The runner exists even though only version 1 does. Retrofitting migrations after a schema has shipped
is the classic source of data loss.

### Writing a migration

1. Add `src/infrastructure/persistence/migrations/00N-what-it-does.ts` exporting a `Migration` with
   `from` set to the current version and `to` set to the next.
2. Register it in `ALL_MIGRATIONS` in `migration-runner.ts`.
3. Bump `CURRENT_SCHEMA_VERSION`.
4. Update the zod schema and the hand-written type together, so the compile-time assertion passes.
5. Add a test proving the upgrade path.

`planMigrations` walks the chain from the stored version to the target, and throws if any step is
missing rather than opening a database it cannot upgrade.

### Data written by a newer version

If the stored schema version is **higher** than the version the running application understands, the
runner throws a `StorageError` with kind `corrupt-data` and a message telling the user to update the
application rather than downgrade the data. It never silently accepts it. This matters because a user
running an older cached service worker in one tab could otherwise write over data upgraded by a newer
one.

## Failure modes

`StorageError` carries a `kind` alongside its message, and `toStorageError` maps browser exceptions
onto it.

| Kind             | Cause                                                             | What the user sees                                                  |
| ---------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| `quota-exceeded` | `QuotaExceededError`                                              | A message to export a backup and remove data no longer needed       |
| `unavailable`    | `InvalidStateError`, `SecurityError`, or no `indexedDB` global    | The startup screen explaining private browsing often blocks storage |
| `corrupt-data`   | A record fails schema validation, or an impossible schema version | A message naming the store and telling the user to restore a backup |
| `unknown`        | Anything else                                                     | The underlying error message                                        |

If the database cannot be opened at all, `main.ts` never mounts the application. It mounts
`StorageUnavailableView` instead, which explains that all data is local and that without local
storage there is nowhere to keep it. The application never continues in a silently broken state where
edits appear to work but are never saved.

## Persistent storage

`navigator.storage.persist()` is requested once during bootstrap. Browsers may evict IndexedDB for
origins that have not been granted persistence when the device runs low on space, which for this
application would mean losing everything.

The result is surfaced in Settings alongside the current usage and quota, and the request can be
retried from there. Where the browser does not support the Storage API the state is reported as
`unsupported` rather than being hidden.

## Backup and restore

`BackupService.exportDocument` writes a single JSON document containing `schemaVersion`, `exportedAt`
and every entity collection, including the purchased keys and the theme preference.

It returns that document alongside the file name to download it under. The name is built by
`buildBackupFileName` from the same `exportedAt` the document carries, as
`mealzy-backup-YYYY-MM-DD-HHMMSS.json` in the local time zone, matching the local sense of "today"
the rest of the application uses. Backups therefore sort chronologically in a file manager, and two
exports taken in the same minute do not collide.

`importDocument` parses the document through `backupDocumentSchema` **before** touching the database.
An invalid document is rejected with an actionable message and a list of the specific schema
violations, and nothing is written, so a broken import is never partially applied. A valid document
replaces the entire dataset: every store is emptied and refilled. The Settings view puts this behind
a confirmation dialog that states plainly that current data will be destroyed.

## Deleting all local data

`DataResetService` is the counterpart to the import, for when there is no document to restore from.
`summarise` counts what is currently stored, which is what the dialog shows the user before anything
happens, and `eraseEverything` performs the deletion described by BR-20.

The order matters. Referencing records go first, so that no intermediate state has a planned meal
pointing at a deleted recipe or an ingredient pointing at a deleted category:

1. `mealsPlanned`, then `recipes`, then `staples`, then `adHocItems`, then `ingredients`, then
   `categories`.
2. Purchased keys cleared, preferences reset to `DEFAULT_APP_PREFERENCES`.
3. The BR-14 seed data written back, through the same `writeSeedData` helper `SeedService` uses.
4. The current schema version written again.

The schema version is deliberately never cleared, so an interrupted erase cannot be mistaken for a
first run by the next start. See
[ADR 0011](adr/0011-erasing-local-data-restores-the-first-run-state.md).

The Settings view gates the action behind `DeleteAllDataDialog`, which offers a backup export, then
requires an acknowledgement and a typed confirmation phrase. As with the import, other open tabs keep
their loaded stores and are told to reload.
