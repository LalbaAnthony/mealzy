# ADR 0015: First run seeds a catalogue, not a shopping list

## Status

Accepted. Amends BR-14, which previously also created one enabled staple per seeded ingredient.

## Context

BR-14 seeded fifteen ingredients under `Grocery` and, for each one, an enabled staple. Because every
enabled staple contributes a line to the shopping list, a brand new install opened its shopping list
on fifteen lines: coffee, sugar, olive oil, parchment paper, grated cheese, salt, sunflower oil,
pepper, butter, flour, milk, honey, eggs, pet food and balsamic vinegar.

Those fifteen were one household's weekly shop, written down while the seed was being written. As
seeded staples they are a claim about what the user buys every week, made before the user has typed
anything. Nobody buys parchment paper every week, and the first thing a new user has to do about it
is delete fourteen staples one at a time.

The ingredients themselves are a different kind of guess. They are a starting vocabulary for writing
recipes, they cost nothing if they go unused, and BR-12 already stops one being deleted while it is
referenced. An ingredient that is never used sits in a catalogue the user only sees when they go
looking. A staple that is never used sits in the shopping list every single week.

## Decision

The seed writes categories and ingredients. It writes no staples. `SeedData` no longer carries a
`staples` collection and `writeSeedData` no longer touches the `staples` store.

The staples list starts empty and stays the user's to build through BR-13, which already supports the
full create, read, update and delete. Nothing else about BR-14 changes: the aisles, the reserved
`uncategorized` category and the fifteen ingredients are as they were, and BR-20 rewrites exactly
this seed after an erase.

## Consequences

- A first run opens the shopping list empty. The list fills as the user plans meals and adds their
  own staples, and every line in it is there because the user put it there.
- The catalogue still gives an immediate starting point, so the first recipe can be written without
  inventing ingredients or categories first. The failure mode ADR 0011 rejected, an empty database
  the user cannot add to, is unaffected: the categories are what made empty unusable, not the
  staples.
- Erasing local data now leaves the staples list empty as well, which is what "restores the first-run
  state" means after this change.
- Service tests that relied on the seeded staples to produce shopping list lines now create the
  staples they need. They are longer, and they say out loud which staples the assertion depends on
  instead of importing a list from the harness.
- Shipping a default set of staples as a suggestion the user opts into, rather than as data written
  on their behalf, was left out of scope. It needs a UI affordance, and nothing in v1 asks for one.
