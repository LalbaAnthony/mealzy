# ADR 0011: Erasing local data restores the first-run state

## Status

Accepted.

## Context

Settings needs a way to delete everything the application has stored, for handing a device on, for
starting a plan over, and because a local-only application that offers no way out of its own data is
asking the user to go and find the browser's site settings instead.

Two questions had to be answered before writing it.

**What is left behind?** The obvious reading of "delete everything" is an empty database. That is not
a state this application can work in: an `Ingredient` must reference a `Category`, and BR-15 falls
back to the reserved `uncategorized` category, so an empty catalogue leaves the user unable to add
anything until they have invented their own aisles. Empty is not neutral here, it is stuck.

**Is a stored preference data?** The theme preference lives in the `meta` store next to the purchased
keys. It is as local, and as much the previous owner's, as any recipe.

BR-14 also says seeding is detected by the absence of a stored schema version, so that it "never runs
twice". An erase that wants seed data back has to either clear the schema version and let the next
start seed, or write the seed itself.

## Decision

Erasing puts the browser into the state it is in on a first run: every entity removed, purchased
ticks cleared, preferences reset to their defaults, and the BR-14 seed data rewritten in place.

`DataResetService` writes that seed itself, through the `writeSeedData` helper that `SeedService`
also uses, and then rewrites the current schema version. The schema version is never absent, not even
momentarily.

The action is gated by three separate deliberate acts: a backup export offered inside the flow, an
explicit acknowledgement that the data is going, and a typed confirmation phrase.

## Consequences

- After an erase the application is immediately usable, with the default aisles and staples, rather
  than needing a category invented before the first ingredient.
- Clearing the schema version to trigger the seed on the next start was rejected. It would leave a
  window in which the database holds data with no version, which the migration runner reads as a
  first run, and an erase interrupted inside that window is indistinguishable from a fresh install
  that already has records in it.
- The erase and the backup import stay different operations on purpose. Import replaces the data set
  with a document and deliberately does not seed; erase has no document and deliberately does.
- The three gates are friction by design. There is no undo, no server copy, and no second chance, so
  the cost of an accidental tap is the whole data set.
- Other open tabs keep stale stores in memory after an erase, exactly as they do after an import. The
  snackbar says so rather than the application forcing a reload.
