# Architecture

Mealzy is a pure client-side artefact. There is no server component. The application is organised
into four layers whose dependencies point inwards only.

## The four layers

| Layer                | Location                                                           | May depend on                   | Must not depend on                      |
| -------------------- | ------------------------------------------------------------------ | ------------------------------- | --------------------------------------- |
| Domain               | `src/domain/`                                                      | `src/types/` only               | Vue, Pinia, storage, browser APIs       |
| Application services | `src/services/`                                                    | domain, types, repository ports | Vue components, Pinia, concrete storage |
| Infrastructure       | `src/infrastructure/`                                              | types, ports                    | domain internals, Vue components        |
| Presentation         | `src/components/`, `src/views/`, `src/composables/`, `src/stores/` | services, types                 | infrastructure concretions              |

The domain layer runs in a bare Node process with no DOM. It receives timestamps and identifiers as
arguments rather than reaching for `Date.now()` or `crypto.randomUUID()`, so every domain function is
deterministic and directly testable.

### Enforcement

`eslint.config.js` encodes the "must not depend on" column as `no-restricted-imports` rules scoped by
file glob. Importing `pinia` from `src/domain/` or reaching into `src/infrastructure/` from a Pinia
store fails the lint run rather than being caught in review.

Two clarifications on the table:

- **Presentation may import the domain layer.** Display normalisation (promoting 1200 g to 1.2 kg)
  and planned meal ordering are pure domain functions that the views need at render time. The
  dependency points inwards, and the forbidden column, which is what the lint rules encode, does not
  list the domain. The alternative, re-exporting formatting helpers through the service layer, would
  push display concerns into services for no benefit.
- **`src/app/` is the composition root and is exempt.** `container.ts` and `bootstrap.ts` exist
  precisely to wire concrete infrastructure into service interfaces, so they import from every layer.
  `main.ts` is part of that root.

## Dependency injection

`src/app/container.ts` holds a typed service container:

- `configureServices(services)` installs the container once, from the composition root.
- `useServices()` reads it, and throws a clear error if it was never configured.
- `resetServices()` exists for tests that need a clean slate.

`src/app/bootstrap.ts` builds the production container: it opens IndexedDB, constructs the
repositories with their zod schemas, assembles the platform adapters, creates the services, installs
them, seeds first-run data and requests persistent storage.

Tests never touch IndexedDB. `tests/support/test-harness.ts` builds the same service graph over
`createInMemoryRepository`, a fake clock and a sequential identifier generator, so service tests are
deterministic and fast.

Pinia stores and composables call `useServices()`. They never import a concrete repository.

## Seed content is data, not code

The BR-14 first-run content lives in two JSON files, `src/domain/seed/categories.json` and
`src/domain/seed/ingredients.json`. `seed-catalogue.ts` imports them and exposes them as the typed
`SEED_CATALOGUE`, which is the only place the shipped content is named.

`buildSeedData` takes the catalogue as an argument, exactly as it takes the clock and the identifier
generator, so it stays pure and every catalogue shape is testable. It generates the identifiers,
stamps the timestamps, prepends the reserved `uncategorized` category and joins each ingredient to
its category by the `key` its catalogue entry declares. An unknown key or a key declared twice throws:
a broken catalogue is a packaging defect, not a business failure. There is no zod schema over these
files, because they are bundled at build time and the assignment in `seed-catalogue.ts` is what
typechecks them. See [ADR 0014](adr/0014-seed-content-lives-in-json-data-files.md).

The seed writes categories and ingredients only. Staples are never seeded, so the shopping list is
empty until the user adds one.

Adding an aisle or an ingredient to the first-run data is an edit to a JSON file. No TypeScript
changes.

## State management

Pinia setup-style stores hold view state and delegate all logic to services. A store containing a
business rule is a defect: move it into `src/domain/` and call it from a service.

Stores follow a single shape: `load()` refreshes from the services, and every mutation calls a
service, surfaces a `DomainResult` failure through the snackbar, then reloads. Views reload the
stores they depend on in `onMounted`, so navigating to the shopping list always recomputes it from
the current data rather than relying on cross-store invalidation.

## Results instead of exceptions

Expected business failures are values, not exceptions. Services return
`DomainResult<T> = { ok: true; value: T } | { ok: false; error: DomainError }`. A `DomainError`
carries a stable `code`, a human message and a `details` array, which is how BR-11 and BR-12 list the
records that block a deletion.

Exceptions are reserved for genuine faults: storage being unavailable, the quota being exceeded, or
stored data failing schema validation. Those surface as `StorageError` and are described in
[persistence.md](persistence.md).

## Adding a feature end to end

Take "mark a recipe as a favourite" as a worked example.

1. **Types.** Add the field to `Recipe` in `src/types/recipe.ts`. Every type and interface in the
   project lives under `src/types/`, including ones that never cross a module boundary.
2. **Schema.** Add the field to `recipeSchema` in `src/infrastructure/schemas/entities.ts`. The
   compile-time assertion at the bottom of that file fails immediately if the schema and the
   hand-written type drift apart.
3. **Migration.** If existing records need backfilling, add a module under
   `src/infrastructure/persistence/migrations/`, register it in `ALL_MIGRATIONS` and bump
   `CURRENT_SCHEMA_VERSION`.
4. **Domain.** If a rule is involved, write it as a pure function under `src/domain/` and test it to
   full branch coverage before wiring anything up.
5. **Service.** Extend the service interface in `src/types/services.ts`, then the implementation in
   `src/services/`. Return a `DomainResult` for anything that can fail a business rule.
6. **Store.** Add the action to the relevant Pinia store: call the service, report failures through
   `useUiStore`, reload.
7. **View.** Compose the existing MD3 primitives. A primitive that knows about recipes is a defect;
   application-specific components belong in `src/components/app/`.
8. **Docs.** Record the rule in [domain-model.md](domain-model.md) and, if the decision was
   contested, add an ADR.

## Anticipated evolutions

These are deliberately out of scope for v1. No v1 decision blocks them.

- **Servings and portion scaling.** `RecipeIngredient.quantity` is already a value object, so a
  servings multiplier applies cleanly at aggregation time.
- **Multi-user and synchronisation.** Repositories are ports. A synchronising implementation slots in
  behind the same interface without touching the domain or the services.
- **Internationalisation.** The interface is English only with no i18n layer. All user-facing strings
  currently live in components and services; extracting them is mechanical.
- **Barcode scanning, price tracking, nutrition data, pantry stock levels.** All are additive
  entities alongside `Ingredient`.
- **Drag-and-drop reordering.** `manualOrder` and `planMealMove` already express ordering as data, so
  a drag implementation only needs to produce the same `MealOrderAdjustment` list.
- **Recipe import from URLs.** Would land as an infrastructure adapter producing a `RecipeDraft`,
  which the existing validation already covers.
- **End-to-end browser testing.** Not present in v1.
