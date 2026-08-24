# ADR 0007: An icon font instead of hand-written inline SVG

## Status

Accepted.

## Context

Icons could be hand-written inline SVG in each component, imported SVG files, an icon component
library, or an icon font.

Hand-written inline SVG spreads path data through the templates, makes visual consistency a matter of
discipline, and means every icon change is a diff full of coordinates.

## Decision

Use the Material Symbols Rounded icon font, self-hosted from the `@material-symbols/font-400` npm
package. `MdIcon` is the only component that touches it. `src/types/icons.ts` declares `IconName` as
a union of the names actually used, so a typo or an unused icon fails the build.

**Never load fonts from the Google Fonts CDN or any other external origin.** The application must
work fully offline from first launch, and the production build must have zero external network
dependencies.

## Consequences

- Icons are consistent by construction: one family, one weight, one optical size.
- Adding an icon is a one-line change to a union type, and using an icon that is not in the union is
  a compile error rather than an empty box at runtime.
- Icons inherit `color` and `font-size` from their context, so they theme automatically.
- Icons are decorative by default with `aria-hidden="true"`, and the accessible name always comes
  from the surrounding control, which is enforced by making `label` a required prop on `MdIconButton`.
- **The size problem is real and had to be solved.** The full font is 520,808 bytes, over the 500 KB
  budget, so `scripts/build-icon-font.ts` subsets it at build time down to 4,472 bytes for 32 icons.
- Subsetting had to be done by Private Use Area codepoint rather than by ligature text. Subsetting by
  the letters of the icon names keeps every glyph reachable through the ligature table and measured
  223,812 bytes for only ten icons. The consequence is that `MdIcon` renders a codepoint through a
  generated CSS class rather than an icon-name ligature.
- The generated font and stylesheet are committed, and CI regenerates them and fails on any diff, so
  they cannot drift from the icon name union.
