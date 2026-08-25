# Domain model

Every type in this document is declared under `src/types/`. Identifiers are plain string aliases; see
[ADR 0005](adr/0005-string-identifiers-instead-of-branded-types.md) for why they are not branded.
Identifiers are generated with `crypto.randomUUID()`, behind the `IdGenerator` port.

## Entities

### Category

A shopping aisle, used to group the shopping list.

| Field       | Type         | Notes                                        |
| ----------- | ------------ | -------------------------------------------- |
| `id`        | `CategoryId` | `uncategorized` for the reserved category    |
| `name`      | `string`     | Non-empty, unique case-insensitively         |
| `sortOrder` | `number`     | Ascending. `uncategorized` always sorts last |

### Ingredient

A global, referenced entity. Recipes point at ingredients by identifier; free-text ingredient names
on recipes are forbidden because they make aggregation unreliable. See
[ADR 0002](adr/0002-ingredients-as-referenced-entities.md).

| Field        | Type           | Notes                                |
| ------------ | -------------- | ------------------------------------ |
| `id`         | `IngredientId` |                                      |
| `name`       | `string`       | Non-empty, unique case-insensitively |
| `categoryId` | `CategoryId`   | Must reference an existing category  |
| `createdAt`  | `EpochMillis`  |                                      |
| `updatedAt`  | `EpochMillis`  |                                      |

### Recipe

A reusable template.

| Field         | Type                          | Notes                                |
| ------------- | ----------------------------- | ------------------------------------ |
| `id`          | `RecipeId`                    |                                      |
| `name`        | `string`                      | Non-empty, unique case-insensitively |
| `notes`       | `string`                      | May be empty                         |
| `ingredients` | `readonly RecipeIngredient[]` | Each ingredient at most once         |
| `createdAt`   | `EpochMillis`                 |                                      |
| `updatedAt`   | `EpochMillis`                 |                                      |

A `RecipeIngredient` is `{ ingredientId, quantity }` where `quantity` is `Quantity | null`. A null
quantity is valid and means "some, unspecified".

### MealPlanned

An instance of a recipe placed in the plan. Recipe and MealPlanned are deliberately distinct
concepts; see [ADR 0001](adr/0001-recipe-and-planned-meal-separation.md).

| Field                | Type                  | Notes                                         |
| -------------------- | --------------------- | --------------------------------------------- |
| `id`                 | `MealPlannedId`       |                                               |
| `recipeId`           | `RecipeId`            |                                               |
| `recipeNameSnapshot` | `string`              | Keeps history readable after a recipe is gone |
| `scheduledDate`      | `IsoDate \| null`     | `YYYY-MM-DD`, optional                        |
| `slot`               | `MealSlot \| null`    | `lunch` or `dinner`, optional                 |
| `manualOrder`        | `number`              | Tie-breaker within an ordering group          |
| `status`             | `MealPlannedStatus`   | `planned` or `eaten`                          |
| `eatenAt`            | `EpochMillis \| null` | Set when eaten, cleared when un-marked        |
| `createdAt`          | `EpochMillis`         |                                               |
| `updatedAt`          | `EpochMillis`         |                                               |

### Staple

An ingredient that is always on the shopping list, even when no planned meal requires it.

| Field             | Type               | Notes                                    |
| ----------------- | ------------------ | ---------------------------------------- |
| `id`              | `StapleId`         |                                          |
| `ingredientId`    | `IngredientId`     | At most one staple per ingredient        |
| `defaultQuantity` | `Quantity \| null` | Null means an unspecified amount         |
| `enabled`         | `boolean`          | Disabled staples are kept but not listed |

### AdHocItem

A one-off shopping list entry that comes from neither a recipe nor the staples, for example toilet
paper or light bulbs.

| Field        | Type               | Notes                         |
| ------------ | ------------------ | ----------------------------- |
| `id`         | `AdHocItemId`      |                               |
| `label`      | `string`           | Free text, non-empty          |
| `quantity`   | `Quantity \| null` |                               |
| `categoryId` | `CategoryId`       | Falls back to `uncategorized` |
| `createdAt`  | `EpochMillis`      |                               |

### Quantity and units

`Quantity` is `{ amount, unit }`. Units are grouped into measurement families:

| Family   | Units         | Normalised unit            |
| -------- | ------------- | -------------------------- |
| `mass`   | `g`, `kg`     | `g`                        |
| `volume` | `ml`, `l`     | `ml`                       |
| `spoon`  | `tsp`, `tbsp` | `tsp` and `tbsp` unchanged |
| `count`  | `piece`       | `piece`                    |

## Business rules

**BR-01 A recipe has a non-empty name, unique case-insensitively after trimming.**
Rationale: the recipe name is the primary way a user identifies a recipe, and duplicates make the
meal planner ambiguous. Implemented in `validateRecipeDraft`; names are trimmed and internal runs of
whitespace collapsed before comparison.

**BR-02 A recipe ingredient references an existing ingredient. Quantity and unit are optional.**
Rationale: referenced ingredients are what make aggregation reliable. An optional quantity supports
the common "some parsley" case without forcing a fake number.

**BR-03 The same ingredient appears at most once per recipe.**
Rationale: two rows for the same ingredient would silently double-count at aggregation time. The
editor should force the user to combine them.

**BR-04 Creating a planned meal copies the current recipe name into `recipeNameSnapshot`. The
snapshot is refreshed whenever the recipe is renamed and the meal is still `planned`. Eaten meals
keep the snapshot they had.**
Rationale: history should read as it did when the meal was eaten, while the active plan should track
the current name. `RecipeService.update` refreshes the snapshot of planned meals only. As a
consequence of BR-08, un-marking an eaten meal also refreshes its snapshot if the recipe still
exists; if the recipe has since been deleted, the existing snapshot is kept.

**BR-05 `scheduledDate` and `slot` are both optional and independent.**
Rationale: users plan at different levels of precision. "Lasagne, some time this week" and "lunch,
whenever" are both legitimate.

**BR-06 Planned meal ordering: meals with a date come first, ascending by date, then `lunch` before
`dinner`, then by `manualOrder`. Meals without a date come last, ordered by `manualOrder` alone.**
Rationale: a plan reads chronologically, with the unscheduled backlog at the bottom. A dated meal
with no slot sorts after both lunch and dinner on that day, because it is the least specific.
Move up and move down swap `manualOrder` with the neighbour **inside the same date and slot group**.
A move that would cross into another group is a no-op, because date and slot dominate the ordering
and swapping `manualOrder` across groups would visibly do nothing. There is no drag-and-drop in v1.

**BR-07 Marking a meal as eaten sets `status` to `eaten` and `eatenAt` to the current time. The meal
disappears from the default meals view and stops contributing to the shopping list. It is not
deleted.**
Rationale: the shopping list should reflect what still needs buying, while the plan remains a record
of what was actually eaten.

**BR-08 Marking a meal as eaten is reversible.**
Rationale: mis-taps happen. Un-marking sets `status` back to `planned` and `eatenAt` to `null`, and
the meal starts contributing to the shopping list again.

**BR-09 Permanent deletion of a planned meal exists, is explicit, and requires a confirmation
dialog.**
Rationale: deletion is irreversible and there is no server-side backup to fall back on.

**BR-10 The meals view has a filter with three states: `Planned` (default), `Eaten`, `All`.**
Rationale: eaten meals are never lost, so there must be a way back to them.

**BR-11 Deleting a recipe is blocked while at least one planned meal with status `planned`
references it. The block message lists the blocking meals.**
Rationale: deleting a recipe out from under an active plan would leave the plan referring to
something that no longer exists. Recipes referenced only by eaten meals can be deleted, because
`recipeNameSnapshot` keeps that history readable.

**BR-12 Deleting an ingredient is blocked while it is referenced by any recipe or by any staple. The
block message lists the referents.**
Rationale: dangling ingredient references would silently drop lines from the shopping list.

**BR-13 The staples list supports full create, read, update and delete. A staple points at an
ingredient, carries an optional default quantity, and can be temporarily disabled.**
Rationale: "I already have plenty of flour this month" should not require deleting and recreating the
staple. A second staple for the same ingredient is rejected, because two staples would each
contribute to the same line and double the amount.

**BR-14 Seed data on first run: the `uncategorized` category, the categories `Produce`, `Dairy`,
`Meat and fish`, `Grocery`, `Frozen`, `Household`, and one enabled staple for each of coffee, sugar,
olive oil, parchment paper, grated cheese, salt, sunflower oil, pepper, butter, flour, milk, honey,
eggs, pet food, razors and balsamic vinegar, each with its ingredient created and categorised under
`Grocery`.**
Rationale: an empty application is hard to evaluate. First run is detected by the absence of a stored
schema version, so seeding never runs twice and never runs after a backup import. Deleting all local
data (BR-20) is the one other moment the seed is written, and it writes it explicitly rather than by
clearing the schema version. The `uncategorized` category cannot be deleted or renamed.

**BR-15 An ad hoc item is a free-text label with an optional quantity and a category. Ad hoc items
never merge with ingredient lines, even when the labels match.**
Rationale: an ad hoc item is explicitly outside the ingredient catalogue. Merging by label would
resurrect the free-text matching problem that referenced ingredients exist to avoid. Two ad hoc items
both labelled "Light bulbs" stay as two lines.

**BR-16 Every shopping line can be ticked as purchased. The purchased state is persisted and survives
page reloads and recomputation of the list.**
Rationale: the list is derived, so it is recomputed constantly. Purchased state is stored against the
deterministic line key rather than against a line object, so adding or removing a meal mid-shop does
not clear the ticks.

**BR-17 A `Reset shopping trip` action clears all purchased flags and permanently deletes every ad
hoc item that was ticked as purchased. It requires a confirmation dialog. It is the only way
purchased state is cleared in bulk.**
Rationale: one deliberate action ends a shopping trip. Ad hoc items are one-off by definition, so a
purchased one has served its purpose; an unpurchased one carries over to the next trip.

**BR-18 The shopping list is grouped by category, ordered by `Category.sortOrder`, with
`uncategorized` last. Within a group, lines are ordered alphabetically by label.**
Rationale: the list should follow the walk through the shop. Alphabetical ordering within a group
keeps mixed-unit lines for the same ingredient adjacent, since they share a label.

**BR-19 Export excludes purchased lines.**
Rationale: the export is for shopping with. A group whose lines are all purchased is omitted
entirely.

**BR-20 Settings offers a permanent deletion of all local data. It removes every recipe, planned
meal, ingredient, category, staple and ad hoc item, clears the purchased ticks, resets the
preferences to their defaults and rewrites the BR-14 seed data, leaving the browser exactly as it is
on a first run. The action is gated behind an acknowledgement of the loss and a typed confirmation,
and it offers a backup export inside the flow.**
Rationale: uninstalling the PWA or clearing site data from browser settings is neither discoverable
nor precise, so the application owes the user a way to hand a device on, or start over, without
leaving their data behind. There is no server copy, so the erase is unrecoverable and the friction is
the feature: a backup export, an explicit acknowledgement and a typed phrase are three separate
deliberate acts, and none of them is a stray tap. The seed data is rewritten rather than left empty
because an ingredient must reference a category, so an application with no categories would strand
the user rather than merely empty their data. Preferences are reset with the rest because a stored
theme is local data too, and a first-run state that quietly keeps one setting is not a first-run
state. See [ADR 0011](adr/0011-erasing-local-data-restores-the-first-run-state.md).
