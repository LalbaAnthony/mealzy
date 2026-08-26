# ADR 0012: MdSelect is a searchable combobox, not a native select

## Status

Accepted.

## Context

`MdSelect` wrapped a native `<select>`. It is used for the aisle on `IngredientsView` and
`ShoppingListView`, the ingredient on `RecipeEditView` and `StaplesView`, the recipe and the slot on
`MealsView`, and the unit on `QuantityField`.

Two of those lists are unbounded. A pantry of a hundred ingredients turns the ingredient picker of
`RecipeEditView` into a scroll through a hundred entries, once per ingredient row, and a native
`<select>` offers nothing better than type-ahead on the first letters of the label. The recipe list
grows the same way.

The alternatives were a native `<select>` kept as is with the scrolling problem accepted, a separate
`MdCombobox` primitive used only for the long lists, or one searchable primitive everywhere.

A separate primitive would mean two labelling and error contracts to keep in step, and a per-call-site
judgement about which list counts as long. The lists that are short today, units and slots, are
exactly the ones where the difference does not matter: three options fit on screen either way, and
typing is never required to reach one.

## Decision

`MdSelect` is a single searchable combobox, built to the WAI-ARIA combobox pattern with list
autocomplete. There is no `searchable` prop and no option-count threshold. Every call site gets the
same control.

The public contract is unchanged: `modelValue`, `label`, `options`, `disabled`, `supportingText` and
`errorText`, with `update:modelValue` carrying the option value. Two optional props were added,
`placeholder` and `noMatchesText`. No call site had to change.

## Consequences

- The native mobile picker is gone. On a phone the control is now a text field over a scrollable
  list, and the on-screen keyboard opens with it. This is the real cost of the decision, and it is
  accepted because the alternative is scrolling a hundred-entry native list with a thumb.
- Accessibility is now the component's responsibility rather than the platform's, which is why the
  contract is pinned by tests: `role="combobox"` with `aria-expanded`, `aria-controls` and
  `aria-activedescendant` on the input, `role="listbox"` labelled by the field label, and
  `aria-selected` per option.
- Escape stops propagating while the list is open. Without that, closing the list inside an
  `MdDialog` would close the dialog as well, because `MdDialog` listens for Escape on its surface and
  the event bubbles out of the input.
- Enter is intercepted only while the list is open. `RecipeEditView` is a `<form>`, so Enter on a
  closed field still submits it, which is what the native `<select>` did.
- The list is teleported to `body` and positioned against the field's bounding rectangle. Keeping it
  inside the field does not work: `.md-dialog` sets `overflow-y: auto`, which makes it a scroll
  container that clips its descendants at its padding box, so the list was cut off at the bottom of
  the dialog. That is clipping rather than stacking, so no z-index alone could have fixed it.
- Teleporting costs a new layer and a positioning loop. `--md-sys-z-index-popover` sits at 55,
  between the dialog at 50 and the snackbar at 60. The list is repositioned on capture-phase scroll
  and on resize while it is open, and the listeners are removed on close and before unmount.
- Nothing leaves the focus trap. The options are `<li>` elements with no `tabindex`, so they were
  never in `MdDialog`'s focusable set, and the input that owns them stays inside the dialog.
- Matching is a case-insensitive substring over the option label. Diacritics are not folded, so
  `creme` does not find `Creme fraiche`. Folding is a one-line change if it becomes a complaint.
