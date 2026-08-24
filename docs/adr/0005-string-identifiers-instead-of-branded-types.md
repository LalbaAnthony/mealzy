# ADR 0005: Plain string identifiers instead of branded types

## Status

Accepted.

## Context

The model has six identifier kinds: `IngredientId`, `CategoryId`, `RecipeId`, `MealPlannedId`,
`StapleId` and `AdHocItemId`. Declared as plain aliases of `string`, they are mutually assignable, so
passing a `RecipeId` where an `IngredientId` is expected compiles.

Branded types would prevent that:

```ts
type RecipeId = string & { readonly __brand: 'RecipeId' };
```

## Decision

Use plain string aliases.

## Consequences

- **The deciding constraint is that branded types cannot be constructed without a type assertion.**
  Every `crypto.randomUUID()` result, every identifier read from a route parameter and every value
  coming out of a zod schema would need `as RecipeId`. The project forbids `as` outside
  `src/infrastructure/schemas/`, so branding would either gut that rule or push an assertion into
  every service that creates an entity.
- The type safety given up is narrower than it looks. Identifiers are almost always read off an
  entity and passed straight to a repository for the same entity, so the mismatch branding prevents
  is rare in practice.
- What remains is caught elsewhere: passing the wrong identifier makes a repository lookup return
  `null`, and every service already handles that with an `entity-not-found` result rather than
  crashing.
- The aliases still document intent at every call site, which is most of their value.
- If this proves wrong, the migration is mechanical: change the aliases and add constructor functions
  in the schemas directory, which is already the sanctioned home for assertions.
