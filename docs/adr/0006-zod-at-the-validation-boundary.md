# ADR 0006: zod at the validation boundary

## Status

Accepted.

## Context

Two sources of data are outside the type system's control: records read back from IndexedDB, and JSON
documents chosen by the user for import.

IndexedDB is not as safe as it looks. Records may have been written by an older version of the
application, corrupted, or edited by hand through DevTools. Trusting them means `unknown` silently
becoming a typed value, and a malformed record surfacing later as an unexplained crash far from its
cause.

## Decision

Every record read from IndexedDB and every imported document is parsed with a zod schema in
`src/infrastructure/schemas/`. These schemas are the only place where `unknown` becomes typed, and
that directory is the only place where type assertions are permitted.

Each schema carries a compile-time proof that it matches the hand-written type:

```ts
assertSchemaMatchesDeclaredType<IsExactly<z.output<typeof recipeSchema>, Recipe>>(true);
```

## Consequences

- Schema and type cannot drift. `IsExactly` is an exact identity check, so adding a field to one and
  not the other fails `npm run typecheck`. This was verified by deliberately introducing drift and
  confirming the build fails.
- Import failures are actionable. `backupDocumentSchema` reports the specific violations, so the user
  gets "categories: expected array" rather than "invalid file".
- Import is safe. Validation completes before any write, so a broken document is never partially
  applied.
- Corrupt stored data produces a `StorageError` naming the store and pointing at the backup restore,
  instead of a `TypeError` somewhere in a component.
- The costs are a runtime dependency in the bundle and the duplication of writing shapes twice. The
  compile-time assertion is what makes the duplication safe, and the schemas are also the natural
  place to express constraints the type system cannot, such as non-empty strings and integral
  timestamps.
- Zod 4 rejects `NaN` and `Infinity` for `z.number()` by default, which covers a real corruption case
  for nothing.
