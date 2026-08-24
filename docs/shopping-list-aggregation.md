# Shopping list aggregation

The shopping list is never stored. It is derived on demand from the planned meals, the recipes they
reference, the enabled staples, the ad hoc items and the set of purchased line keys.

The algorithm lives in `src/domain/aggregation/` as pure functions with no Vue, no storage and no
browser API dependency. It is covered to 100 percent branch coverage.

- `aggregateShoppingList(input)` produces the lines.
- `groupShoppingList(input)` groups and orders them for display (BR-18).
- `buildShoppingListText(input)` renders the plain text export (BR-19).

## Inputs

```ts
interface ShoppingListAggregationInput {
  readonly plannedMeals: readonly MealPlanned[];
  readonly recipes: readonly Recipe[];
  readonly ingredients: readonly Ingredient[];
  readonly staples: readonly Staple[];
  readonly adHocItems: readonly AdHocItem[];
  readonly purchasedKeys: readonly ShoppingLineKey[];
}
```

The function filters defensively rather than trusting the caller. Meals whose `status` is not
`planned` are skipped, staples whose `enabled` is false are skipped, and contributions whose meal,
recipe or ingredient no longer exists are dropped.

## Algorithm

1. **Collect contributions.** Each planned meal contributes one entry per recipe ingredient. Each
   enabled staple contributes one entry for its ingredient with its default quantity. Each ad hoc
   item contributes one standalone entry.
2. **Group.** Ingredient contributions are grouped by `ingredientId`. Ad hoc contributions are never
   grouped with anything, including with each other.
3. **Normalise within a measurement family.** `kg` becomes `g` and `l` becomes `ml`. `tsp` and
   `tbsp` are their own family and are not converted to volume, because the real volume of a spoon
   varies. `piece` is its own family. Contributions with no quantity fall into a single
   `unquantified` bucket.
4. **One line per ingredient and bucket.** An ingredient contributing `200 g`, `1 kg`, `2 tbsp` and
   one unquantified entry produces three lines under the same ingredient name.
5. **Deterministic keys.** `ingredient:<ingredientId>:<bucket>` for ingredient lines and
   `adhoc:<adHocItemId>` for ad hoc lines. The bucket identifier is the normalised unit, or the
   literal `none` for the unquantified bucket.
6. **Display normalisation at render time only.** Stored amounts stay in the normalised unit.
7. **Attach sources.** Every line carries the full list of the meals, staples or ad hoc items that
   put it there, so the interface can show why an item is on the list.
8. **Resolve purchased.** Each key is looked up in the persisted purchased set.

### Note on spoons

Step 3 converts only `kg` to `g` and `l` to `ml`. `tsp` and `tbsp` are a distinct family from volume,
and they are also **not converted into one another**: the bucket identifier is the normalised unit,
and both normalise to themselves. A recipe asking for `2 tbsp` and another asking for `1 tsp`
therefore produce two adjacent lines rather than one line of `7 tsp`. Introducing a
`1 tbsp = 3 tsp` conversion would be inventing a precision the ingredient does not have, which is the
same reason spoons are kept out of volume in the first place.

## Why the keys are stable

The list is recomputed on every change. If purchased state were held against a line's position or
identity, ticking "Tomato 500 g" and then planning another meal would clear the tick.

Because the key is derived only from the ingredient identifier and the bucket, adding a meal that
also needs tomatoes changes the line's **amount** but not its **key**, so the tick survives. Removing
the last meal that needed an ingredient removes the line, and its key simply stops matching anything;
the key stays in the purchased set harmlessly until the next `Reset shopping trip`.

## Display normalisation

Applied by `promoteQuantityForDisplay` at render time, never in stored data:

- `g` above 1000 becomes `kg`.
- `ml` above 1000 becomes `l`.
- Amounts are rounded to at most two decimals.

The threshold is strict. Exactly `1000 g` renders as `1000 g`; `1001 g` renders as `1 kg` after
rounding, and `1500 g` renders as `1.5 kg`. Spoons and pieces are never promoted.

## Worked example

Given these recipes:

- **Tomato soup**: Tomato `500 g`, Onion `2 piece`
- **Tomato stew**: Tomato `1 kg`, Onion `1 piece`, Olive oil `2 tbsp`
- **Herb salad**: Tomato, no quantity

Three meals are planned, one for each recipe. Butter is an enabled staple with no default quantity.
Salt is an enabled staple with a default of `500 g`. One ad hoc item, "Light bulbs, 4 piece", sits in
Household.

Contributions collapse into these lines:

| Key                         | Label       | Quantity  | Sources              |
| --------------------------- | ----------- | --------- | -------------------- |
| `ingredient:tomato:g`       | Tomato      | `1500 g`  | soup meal, stew meal |
| `ingredient:tomato:none`    | Tomato      | none      | salad meal           |
| `ingredient:onion:piece`    | Onion       | `3 piece` | soup meal, stew meal |
| `ingredient:olive-oil:tbsp` | Olive oil   | `2 tbsp`  | stew meal            |
| `ingredient:butter:none`    | Butter      | none      | butter staple        |
| `ingredient:salt:g`         | Salt        | `500 g`   | salt staple          |
| `adhoc:light-bulbs`         | Light bulbs | `4 piece` | ad hoc item          |

Tomato produces two lines: `500 g` and `1 kg` normalise to the same `g` bucket and sum to `1500 g`,
while the unquantified entry from the salad stays separate. Grouped and rendered, that becomes:

```
Shopping list - 2026-08-24

PRODUCE
- Onion 3 piece
- Tomato 1.5 kg
- Tomato

DAIRY
- Butter

GROCERY
- Olive oil 2 tbsp
- Salt 500 g

HOUSEHOLD
- Light bulbs 4 piece
```

The two Tomato lines are adjacent because BR-18 sorts by label within a group, and `1500 g` is
promoted to `1.5 kg` for display only.

### Staples merge rather than duplicate

If Salt were also an ingredient of a planned meal at `10 g`, the staple and the meal would land in
the same `ingredient:salt:g` bucket and produce **one** line of `510 g` carrying both a `staple`
source and a `meal` source. A staple only produces its own separate line when its bucket differs, for
example an unquantified staple alongside a quantified meal ingredient.

## Grouping and ordering

`groupShoppingList` places each line in its ingredient's category, falling back to `uncategorized`
when the category no longer exists. Groups are ordered by `Category.sortOrder`, with `uncategorized`
forced last regardless of its sort order, and ties broken by category name. Within a group, lines are
ordered alphabetically by label using a case-insensitive English collation, with the line key as a
deterministic tie-breaker.
