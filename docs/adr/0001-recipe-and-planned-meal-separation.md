# ADR 0001: Recipe and planned meal are separate entities

## Status

Accepted.

## Context

A user schedules "Tomato soup" for Tuesday and again for Friday. The naive model stores a date on the
recipe, which immediately breaks: a recipe can be cooked many times, on many dates, and its eaten
status belongs to an occasion rather than to the template.

## Decision

`Recipe` and `MealPlanned` are distinct entities. `Recipe` is a reusable template holding name, notes,
instructions and ingredients. `MealPlanned` is an instance holding `recipeId`, schedule, `manualOrder`, `status`
and `eatenAt`.

`MealPlanned` also carries `recipeNameSnapshot`, a copy of the recipe name at the time of planning.

## Consequences

- Planning the same recipe twice is natural rather than a special case.
- Eaten history survives the deletion of a recipe, because the snapshot keeps the row readable. This
  is what lets BR-11 allow deleting a recipe referenced only by eaten meals.
- The snapshot must be kept fresh while a meal is still planned, which is BR-04. `RecipeService`
  refreshes the snapshot of planned meals when a recipe is renamed, and leaves eaten ones alone.
- Servings and portion scaling, deliberately out of scope for v1, land cleanly later: the multiplier
  belongs on `MealPlanned`, not on `Recipe`.
