# ADR 0002: Ingredients are referenced entities, not free text

## Status

Accepted.

## Context

The shopping list exists to aggregate quantities across meals. Aggregation needs a reliable identity
for "the same ingredient".

With free-text ingredient names on recipes, "Tomato", "tomato", "Tomatoes" and "tomato " are four
different strings that a human reads as one thing. Any aggregation is then a guess: fuzzy matching,
stemming or normalisation heuristics that are wrong often enough to be untrustworthy, and wrong
silently.

## Decision

`Ingredient` is a global entity with an identifier, a canonical name and a category. Recipes
reference ingredients by `ingredientId`. Free-text ingredient names on recipes are forbidden.

Ad hoc shopping items are the deliberate exception: they are free-text by design and never merge with
anything, which is BR-15.

## Consequences

- Aggregation groups by identifier and is exactly correct, with no heuristics.
- An ingredient's category is defined once, so every recipe using it lands in the right shopping
  aisle automatically.
- Renaming an ingredient updates it everywhere at once.
- The cost is friction: adding a recipe ingredient that does not exist yet requires creating the
  ingredient first. The Pantry view exists to make that cheap, and the recipe editor tells the user
  when the catalogue is empty.
- Deleting an ingredient has to be guarded, which is BR-12, because a dangling reference would
  silently drop a line from the shopping list.
