# Design system

Material Design 3, implemented as design tokens plus hand-built components. Vuetify and every other
component framework were rejected; see
[ADR 0003](adr/0003-hand-built-md3-over-a-component-framework.md).

## Tokens

`src/styles/tokens.css` defines the MD3 system tokens as CSS custom properties. Nothing else in the
codebase may contain a hard-coded colour, spacing value, radius, font size or shadow.

| Group      | Prefix                                                   | Notes                                                    |
| ---------- | -------------------------------------------------------- | -------------------------------------------------------- |
| Colour     | `--md-sys-color-*`                                       | The full MD3 role set, light and dark                    |
| State      | `--md-sys-state-*-opacity`                               | Hover, focus, pressed, disabled                          |
| Typography | `--md-sys-typescale-*`                                   | Size, line height, weight and tracking per role          |
| Shape      | `--md-sys-shape-corner-*`                                | `none` through `extra-large` and `full`                  |
| Elevation  | `--md-sys-elevation-level0-5`                            | Ready-made `box-shadow` values                           |
| Motion     | `--md-sys-motion-duration-*`, `--md-sys-motion-easing-*` | Includes `duration-instant` for reduced motion           |
| Spacing    | `--md-sys-spacing-0` to `-16`                            | A 4px scale                                              |
| Size       | `--md-sys-size-*`                                        | Touch target, icon size, navigation sizes, content width |
| Z index    | `--md-sys-z-index-*`                                     | Named layers rather than scattered magic numbers         |

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

| Component           | Notes                                                                    |
| ------------------- | ------------------------------------------------------------------------ |
| `MdButton`          | filled, tonal, elevated, outlined and text variants                      |
| `MdIconButton`      | standard, filled and tonal; requires an accessible `label`               |
| `MdFab`             | regular and extended                                                     |
| `MdTextField`       | label bound by `for`/`id`, `aria-invalid` and `aria-describedby`         |
| `MdSelect`          | same labelling and error contract as the text field                      |
| `MdCheckbox`        | `hideLabel` moves the label to `aria-label` for dense list rows          |
| `MdSwitch`          | `role="switch"` with `aria-checked`, optional visible label              |
| `MdChip`            | assist, filter and input variants, optionally removable                  |
| `MdSegmentedButton` | `role="group"` with `aria-pressed` per option                            |
| `MdCard`            | elevated, filled and outlined                                            |
| `MdList`            | list container with an optional accessible name                          |
| `MdListItem`        | leading, content, details and trailing slots                             |
| `MdDialog`          | `role="dialog"`, `aria-modal`, focus trap, Escape and scrim close        |
| `MdSnackbar`        | inverse surface in both tones, error marked by an icon, live region host |
| `MdTopAppBar`       | sticky, with leading and action slots                                    |
| `MdNavigationBar`   | bottom bar on compact viewports, rail on expanded                        |
| `MdMenu`            | `role="menu"` with a backdrop and Escape close                           |
| `MdMenuItem`        | `role="menuitem"`, with a destructive variant                            |
| `MdIcon`            | the only component that touches the icon font                            |

Application-specific components live in `src/components/app/` and compose these primitives:
`MealListItem`, `ShoppingLineItem`, `ConfirmDialog`, `EmptyState`, `SnackbarHost`, `QuantityField`
and `PwaUpdatePrompt`.

### Snackbar colour

`MdSnackbar` sits on `inverse-surface` with `inverse-on-surface` text, in both tones. That is the
MD3 snackbar role pair and it deliberately carries the opposite luminance of the surrounding
surface: a dark bar in the light theme, a light bar in the dark theme. It is not a theming bug.

Because the bar is inverted, foreground roles from the ambient theme do not contrast against it. Two
consequences:

- The action label uses `inverse-primary`, not `primary`. `primary` shares the polarity of the
  surface it normally sits on, so on the inverted bar it drops to roughly 2:1 in light and 1.3:1 in
  dark, which made the only Dismiss control practically invisible.
- The error tone keeps the same inverted background rather than switching to `error-container`.
  Doing otherwise gave the two tones opposite polarities, so a neutral and an error snackbar stacked
  together read as if the theme had flipped between them. Error is signalled by a leading `error`
  icon in `error-container`, which is the one error role that always opposes `inverse-surface` and
  so clears contrast in both themes.

MD3 defines no error snackbar. Deviating from the inverted background for one tone is therefore a
local invention, and this is the reasoning against it.

### Overlay placement

Two overlays float above the shell and must not collide with each other or with the navigation.
`PwaUpdatePrompt` is pinned to the top inset, so `SnackbarHost` stays at the bottom. On compact and
medium viewports the bottom navigation bar occupies that edge, so the host is offset by
`--md-sys-size-navigation-bar` plus one spacing step plus `env(safe-area-inset-bottom)`, which keeps
the snackbar clear of both the bar and any content docked just above it. From 840px the navigation
becomes a rail and the offset falls back to a single spacing step.

`--md-sys-size-navigation-bar` is also the `min-block-size` of `.md-navigation--bar`, so the bar
height and the snackbar offset cannot drift apart.

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
