# Design system

Material Design 3, implemented as design tokens plus hand-built components. Vuetify and every other
component framework were rejected; see
[ADR 0003](adr/0003-hand-built-md3-over-a-component-framework.md).

## Tokens

`src/styles/tokens.css` defines the MD3 system tokens as CSS custom properties. Nothing else in the
codebase may contain a hard-coded colour, spacing value, radius, font size or shadow.

| Group      | Prefix                                                   | Notes                                              |
| ---------- | -------------------------------------------------------- | -------------------------------------------------- |
| Colour     | `--md-sys-color-*`                                       | The full MD3 role set, light and dark              |
| State      | `--md-sys-state-*-opacity`                               | Hover, focus, pressed, disabled                    |
| Typography | `--md-sys-typescale-*`                                   | Size, line height, weight and tracking per role    |
| Shape      | `--md-sys-shape-corner-*`                                | `none` through `extra-large` and `full`            |
| Elevation  | `--md-sys-elevation-level0-5`                            | Ready-made `box-shadow` values                     |
| Motion     | `--md-sys-motion-duration-*`, `--md-sys-motion-easing-*` | Includes `duration-instant` for reduced motion     |
| Spacing    | `--md-sys-spacing-0` to `-16`                            | A 4px scale                                        |
| Size       | `--md-sys-size-*`                                        | Touch target, icon size, rail width, content width |
| Z index    | `--md-sys-z-index-*`                                     | Named layers rather than scattered magic numbers   |

The colour scheme is generated from the source colour `#8f4c38`.

### Enforcement

Stylelint runs `scale-unlimited/declaration-strict-value` over colour, fill, stroke, radius, padding,
margin, gap, font size, font weight, line height, letter spacing, box shadow, z-index and transition
properties. A literal value in any of those fails the lint run. This is not theoretical: it caught a
hard-coded `-1px` margin and a `0.01ms` transition duration in `base.css` during the build, both of
which became tokens.

## Theming

Three states, in this order of precedence:

1. `:root[data-theme='dark']` and `:root[data-theme='light']`, set by the manual override in
   Settings and persisted in the `meta` store.
2. `@media (prefers-color-scheme: dark)` scoped as `:root:not([data-theme='light'])`, so the system
   preference applies unless the user has explicitly chosen light.
3. The bare `:root` light palette as the default.

`useTheme` writes or removes the `data-theme` attribute on the document element in response to the
stored preference.

`prefers-reduced-motion: reduce` collapses every animation and transition to
`--md-sys-motion-duration-instant`.

## Primitives

`src/components/md/` holds framework-level primitives. They know about tokens and accessibility and
nothing else. A primitive that knows what a recipe is would be a defect.

| Component           | Notes                                                             |
| ------------------- | ----------------------------------------------------------------- |
| `MdButton`          | filled, tonal, elevated, outlined and text variants               |
| `MdIconButton`      | standard, filled and tonal; requires an accessible `label`        |
| `MdFab`             | regular and extended                                              |
| `MdTextField`       | label bound by `for`/`id`, `aria-invalid` and `aria-describedby`  |
| `MdSelect`          | same labelling and error contract as the text field               |
| `MdCheckbox`        | `hideLabel` moves the label to `aria-label` for dense list rows   |
| `MdSwitch`          | `role="switch"` with `aria-checked`, optional visible label       |
| `MdChip`            | assist, filter and input variants, optionally removable           |
| `MdSegmentedButton` | `role="group"` with `aria-pressed` per option                     |
| `MdCard`            | elevated, filled and outlined                                     |
| `MdList`            | list container with an optional accessible name                   |
| `MdListItem`        | leading, content, details and trailing slots                      |
| `MdDialog`          | `role="dialog"`, `aria-modal`, focus trap, Escape and scrim close |
| `MdSnackbar`        | rendered inside a live region host                                |
| `MdTopAppBar`       | sticky, with leading and action slots                             |
| `MdNavigationBar`   | bottom bar on compact viewports, rail on expanded                 |
| `MdMenu`            | `role="menu"` with a backdrop and Escape close                    |
| `MdMenuItem`        | `role="menuitem"`, with a destructive variant                     |
| `MdIcon`            | the only component that touches the icon font                     |

Application-specific components live in `src/components/app/` and compose these primitives:
`MealListItem`, `ShoppingLineItem`, `ConfirmDialog`, `EmptyState`, `SnackbarHost`, `QuantityField`
and `PwaUpdatePrompt`.

## Icons

In-application icons come from the Material Symbols Rounded font, self-hosted from the
`@material-symbols/font-400` npm package. Nothing is loaded from the Google Fonts CDN or any other
external origin, because the application must work fully offline from first launch and the production
build must have zero external network dependencies. See
[ADR 0007](adr/0007-icon-font-instead-of-inline-svg.md).

`src/types/icons.ts` declares `IconName` as a union of the icon names actually used. `MdIcon` takes a
`name` of that type and applies the matching class, so an unused icon cannot creep in and a typo
fails the build.

Icons are decorative by default: `aria-hidden="true"`, with the accessible name carried by the
surrounding control.

### Font weight budget

The full Material Symbols Rounded static font is **520,808 bytes**, which is over the 500 KB budget.
A build-time subsetting step is therefore in place.

`npm run build:icons` runs `scripts/build-icon-font.ts`, which:

1. Parses `src/types/icons.ts` with the TypeScript compiler API and extracts the `IconName` members.
2. Resolves each name to its Private Use Area codepoint by running the font's own ligature layout
   through fontkit, then reverse-mapping the resulting glyph through the character map.
3. Subsets the font to exactly those codepoints with `subset-font`.
4. Writes `src/assets/icons/material-symbols-subset.woff2` and a matching stylesheet with one
   `content` rule per icon.

The current result is **4,472 bytes for 32 icons**, about 0.86 percent of the source font. The script
fails the build if the subset ever exceeds the 500 KB budget, or if an icon name does not resolve to
exactly one glyph.

Subsetting is done by codepoint rather than by ligature text on purpose. Subsetting by the letters of
the icon names keeps every glyph reachable through the ligature table, which measured at 223,812
bytes for only ten icons. The generated files are committed, and CI regenerates them and fails on any
diff, so the font can never drift from the icon name union.

## Accessibility requirements

- Minimum touch target of 48 by 48 CSS pixels, enforced through `--md-sys-size-touch-target` on every
  interactive primitive.
- Full keyboard operability. The dialog traps Tab and Shift-Tab, closes on Escape, moves focus to the
  first focusable element on open and restores it to the previously focused element on close.
- Visible focus rings from a single `:focus-visible` rule, never removed.
- Correct ARIA roles on dialogs, menus and lists.
- Snackbar messages render inside `role="status"` with `aria-live="polite"`.
- Every icon-only control carries an accessible name through its required `label` prop.
- Colour is never the only signal. Eaten meals and purchased lines also carry a line-through.
