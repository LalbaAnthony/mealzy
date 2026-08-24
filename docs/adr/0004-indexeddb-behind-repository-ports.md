# ADR 0004: IndexedDB behind narrow repository ports

## Status

Accepted.

## Context

All data is local to the browser. IndexedDB is the only storage with enough capacity and structure
for the dataset, but its API is awkward, asynchronous and impossible to use in a plain Node test
process.

Calling it directly from services would make every service test require a fake IndexedDB, and would
weld the application to a storage choice that a future synchronising version would need to replace.

## Decision

Every repository implements a narrow port declared in `src/types/persistence.ts`:

```ts
interface Repository<TEntity, TId> {
  getAll(): Promise<readonly TEntity[]>;
  getById(id: TId): Promise<TEntity | null>;
  put(entity: TEntity): Promise<void>;
  remove(id: TId): Promise<void>;
}
```

`createIdbRepository` implements it over `idb`. `createInMemoryRepository` implements it over a `Map`.
The composition root in `src/app/` chooses which. ESLint forbids services and stores from importing
`src/infrastructure/` at all.

## Consequences

- No test touches IndexedDB. The whole suite runs in about a second against in-memory repositories,
  and tests the real service implementations rather than mocks.
- The port surface is four methods, so a future implementation, whether synchronising, remote or a
  preview mode, is a small, well-defined piece of work.
- The narrowness costs something: there is no query API, so services load collections and filter in
  memory. At household scale, a few hundred records at most, this is irrelevant, and it keeps
  filtering logic in the domain where it can be tested.
- Metadata does not fit the entity shape, so `AppMetaRepository` is a separate, equally narrow port
  with named accessors rather than a generic key-value bag.
