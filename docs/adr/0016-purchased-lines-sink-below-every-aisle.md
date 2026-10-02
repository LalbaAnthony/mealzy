# ADR 0016: Purchased lines sink below every aisle

## Status

Accepted. Adds BR-22. BR-18 and BR-19 are unchanged.

## Context

BR-18 orders the shopping list by aisle and, inside an aisle, alphabetically by label. Ticking a line (BR-16) only struck it through, so a ticked line kept its place, and halfway through a trip the next thing to buy sat among lines that were already in the cart. The owner asked for ticked lines to go to the bottom of the list.

The list is grouped by aisle, so "the bottom" has two readings: the bottom of the line's own aisle, or the bottom of the whole list, below every aisle.

## Decision

A purchased line leaves its aisle and is listed in one `In the cart` section after every aisle, `uncategorized` included. Inside that section the lines keep the BR-18 order, by aisle and then by label. An aisle whose lines are all purchased is not shown.

The split is a pure domain function, `layoutShoppingList`, applied to the output of `groupShoppingList`. `groupShoppingList` does not change, and the snapshot keeps carrying its output as `groups` next to the new `layout`, so the export and every existing consumer of `groups` are unaffected.

## Alternatives considered

**Sink inside each aisle.** Every aisle keeps its lines, unpurchased first and purchased after. It is the smaller change, a purchased key in front of the label in the BR-18 comparator, and every aisle heading stays on screen. It was rejected because a finished aisle keeps taking up the screen, and in a long list the lines still to buy stay spread between blocks of struck-through ones.

**Hide purchased lines.** This clears the screen completely, but a mis-tap would take the line out of sight with no way back short of resetting the trip. BR-16 makes a tick reversible, and the line has to stay reachable for that to mean anything.

## Consequences

- The top of the list is always what is left to buy, and an aisle disappears once it is done.
- A line in `In the cart` no longer shows which aisle it came from. The sources panel still says why it is on the list.
- Ticking moves the line into a different list element, so Vue unmounts it and mounts a new one in the cart section. Its sources panel closes, and keyboard focus on its checkbox is lost instead of following the line.
- The export is unchanged. It already left purchased lines out (BR-19) and it still reads `groups`.
