# ADR 0003: Hand-built MD3 rather than Vuetify or another component framework

## Status

Accepted.

## Context

The product is expected to evolve substantially, and the brief is explicit that a feature which is
easy to write but hard to change is a defect. A component framework such as Vuetify would deliver a
Material-looking interface quickly.

## Decision

Implement Material Design 3 as design tokens plus hand-built components under `src/components/md/`.
Do not use Vuetify or any other component framework.

## Consequences

- **Control.** Every primitive is roughly a hundred lines that the team owns outright. Changing how a
  text field reports an error means editing one small file, not fighting a framework's opinion or
  writing override CSS that a minor release will break.
- **No framework upgrade treadmill.** A framework major version can force a rewrite of every view.
  Tokens in CSS custom properties do not.
- **Bundle size.** Only the primitives actually used exist at all.
- **Accessibility is explicit.** The focus trap, the ARIA roles and the 48px touch targets are visible
  in the code and tested directly, rather than assumed from a dependency.
- **The cost is real.** Roughly 19 primitives had to be written and tested before the first view
  existed, and the framework's edge cases, such as focus restoration on dialog close, are now the
  team's problem. This is accepted deliberately: the alternative trades a week now for recurring
  friction over the product's life.
- Tokens are enforced by Stylelint, so the design system cannot be bypassed with a stray hex value.
