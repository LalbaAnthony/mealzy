# ADR 0014: Seed content lives in JSON data files

## Status

Accepted.

## Context

BR-14 says what a first run contains: the reserved `uncategorized` category, six named aisles, and
fifteen ingredients filed under `Grocery`. The first implementation spelled that out in TypeScript.
Each aisle was its own `const` with a hand-written `sortOrder`, and the ingredient names were a
`readonly string[]` above them.

That worked, but it made content changes look like code changes. Adding an aisle meant declaring a
variable, renumbering the ones after it and adding it to the returned array, three edits for one
fact. That list is the most likely thing in the whole project to be edited by someone who is not
reading the surrounding code, and it was the one thing sitting inside a function that also generates
identifiers, stamps timestamps and assembles entities.

There is also a shape problem hiding in the old version. Every ingredient was pinned to `grocery.id`
directly, so "put pet food under Household" was not expressible without more code.

## Decision

The content moves out into two JSON files under `src/domain/seed/`, `categories.json` and
`ingredients.json`. A category entry is `{ key, name, sortOrder }`. An ingredient entry is
`{ name, categoryKey }` and joins to its category by that key. `seed-catalogue.ts` imports both and
exposes them as `SEED_CATALOGUE`, typed as `SeedCatalogue` from `src/types/seed.ts`.

`buildSeedData` receives the catalogue in `SeedDataInput`, alongside the identifier generator and the
timestamp it already received. It is the only place that knows how to turn the catalogue into
entities: it generates ids, stamps `now`, and prepends the reserved `uncategorized` category from
`src/domain/constants.ts`.

Two broken-catalogue cases throw rather than degrading quietly: an ingredient naming a category key
that no category declares, and the same key declared twice. Both are packaging defects, so they are
exceptions rather than a `DomainResult`, consistent with the rule that expected business failures are
values and genuine faults are not.

The files are not validated with zod at runtime.

## Consequences

- Editing first-run content is editing JSON. The builder stays a fixed piece of logic that no content
  change touches.
- Ingredients are filed by key, so a seeded ingredient can move to another aisle without code, and
  the catalogue can grow without the builder changing. It has since done both: the fifteen
  ingredients under `grocery` this ADR was written against are now 644 spread over sixteen aisles.
- The reserved category stays in `src/domain/constants.ts` rather than in the JSON. Its identity is
  referenced across the codebase and BR-15 falls back to it, so it is not content.
- No zod schema. These files are bundled at build time, not read from the network or from storage, so
  the boundary that ADR 0006 draws does not apply. The assignment in `seed-catalogue.ts` is what
  typechecks them, and a malformed file fails `npm run typecheck` rather than a user's first run.
  This is the one place where badly formed JSON in the repository is caught by the compiler instead
  of by a schema.
- The domain layer now imports a JSON file. That is data it owns, sitting in its own directory, not a
  dependency on another layer, so the layering rules in `eslint.config.js` are untouched.
- Storing the seed in IndexedDB and diffing it against the shipped catalogue on every start was
  rejected. Nothing in the product asks for a seed that updates itself, and it would make an edit to
  a JSON file capable of touching data the user has since changed by hand.
