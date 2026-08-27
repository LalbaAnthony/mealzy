# ADR 0013: Creating a missing option from the select

## Status

Accepted.

## Context

`MdSelect` became a searchable combobox in
[ADR 0012](0012-mdselect-is-a-searchable-combobox-not-a-native-select.md). Searching a pantry of a
hundred ingredients is now cheap, but searching for one that is not there still ends in a dead end:
the list reports `No matches`, and the user has to leave the recipe or the staple dialog they are in,
go to the Pantry tab, add the ingredient with an aisle, and come back to a row they had already
started editing.

The ingredient picker is where a missing ingredient is discovered, so it is where it should be
creatable. The same gap will appear elsewhere: an aisle missing from the aisle picker, a recipe
missing from the meal picker. Whatever is built for ingredients has to survive being pointed at
those.

Three shapes were considered.

- **An application component wrapping the primitive**, an `IngredientPicker` in
  `src/components/app/` composing `MdSelect` and owning the creation. It reads well for ingredients
  and does nothing for aisles or recipes: the next picker gets its own wrapper, and the keyboard and
  ARIA handling of a create row is duplicated or hoisted anyway.
- **A separate "add" control next to the field**, a button that opens the existing Pantry dialog
  prefilled with the typed text. It keeps `MdSelect` untouched, at the cost of a second control per
  picker, a second dialog stacked on the staple dialog, and a flow that no longer starts and ends
  inside the field the user was typing in.
- **A generic create row inside the primitive**, driven by props and reported as an event.

## Decision

`MdSelect` grows an optional create affordance. `allowCreate` turns it on, `createPrefix` supplies
the verb, and the row reads `Add "Basil"`. It is a real `role="option"` at the end of the list, so
Up, Down and Enter reach it exactly as they reach any other option, and it replaces the
`noMatchesText` row rather than sitting alongside it. Committing it emits `create` with the trimmed
search text and closes the list. The component never emits `update:modelValue` for it: the primitive
does not know what creating means, and the value does not exist yet.

The row is hidden when the typed text already matches an option label case-insensitively, so the
offer never competes with an exact match that is one keystroke from being selected.

The ingredient-specific half lives in two places. `IngredientService.createFromSearch(name)` holds
the rule, which is the choice of `uncategorized` (BR-21), and runs the same validation as any other
creation. `useIngredientQuickCreate` is the presentation-side wiring: it calls the store, reports
where the ingredient went through the snackbar, and returns the new identifier for the caller to
select. `RecipeEditView` and `StaplesView` each hand that identifier to the row or form they own.

## Consequences

- Every call site opts in. `QuantityField`, the slot picker and the aisle pickers pass nothing and
  behave exactly as before.
- Pointing this at aisles or recipes is a prop, an event handler and a service method. No part of the
  keyboard, ARIA or filtering behaviour is rewritten, which is the whole point of putting the row in
  the primitive.
- `MdSelect` stays free of application concepts. It knows there may be one extra row and what text to
  put in it; it does not know that the row creates an ingredient, nor that ingredients have aisles.
- Creation is asynchronous while the list closes synchronously. The field shows the placeholder for
  the instant between the emit and the store reload, then the new name. A failure, a duplicate for
  instance, surfaces as an error snackbar and leaves the previous selection in place.
- The success snackbar names the aisle, because an ingredient silently filed under `uncategorized` is
  the one part of the flow a user cannot see happening.
- `RecipeEditView` still hides its `Add ingredient` button when the catalogue is empty, so an empty
  pantry cannot be filled from the recipe editor. That state is only reachable by deleting every
  ingredient by hand, since BR-14 seeds a catalogue and BR-20 rewrites it, and lifting the gate would
  mean a row that references no ingredient at all.
