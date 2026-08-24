# Testing

Vitest for unit and component tests, `@vue/test-utils` for components, `happy-dom` as the
environment.

## Layout

| Directory                    | What lives there                                               |
| ---------------------------- | -------------------------------------------------------------- |
| `tests/unit/domain/`         | Pure domain functions, exhaustively                            |
| `tests/unit/services/`       | Application services over in-memory repositories               |
| `tests/unit/infrastructure/` | The migration runner, repositories and storage failure mapping |
| `tests/component/`           | MD3 primitives and application components                      |
| `tests/support/`             | Factories and the test harness, not test files themselves      |

## Coverage policy

Thresholds are enforced by `vitest.config.ts` per glob, so a shortfall fails the run.

| Area            | Threshold                                             |
| --------------- | ----------------------------------------------------- |
| `src/domain/`   | 100 percent statements, branches, functions and lines |
| `src/services/` | 80 percent                                            |

The domain threshold is deliberately absolute. Two defensive branches that could never be reached
were found while chasing it, one in the recipe validator and one in the seed builder, and both were
restructured away rather than being excluded. An unreachable branch is dead code, and the coverage
gate is what surfaced them.

## No test touches IndexedDB

`tests/support/test-harness.ts` builds the real service graph over `createInMemoryRepository`, a fake
clock frozen at a known timestamp with an `advanceTo` helper, a sequential identifier generator and
the real backup codec. Services are therefore tested against their real implementations with
deterministic time and identifiers, and the suite runs in about a second.

## What the aggregation tests cover

`tests/unit/domain/aggregate-shopping-list.spec.ts` covers, at minimum:

- the empty state
- one meal, and two meals sharing an ingredient
- mixed units in the same family, and mixed units across families
- unquantified plus quantified for the same ingredient
- a staple that is also a meal ingredient, and a disabled staple
- ad hoc items with identical labels
- purchased state surviving the addition and the removal of a meal
- display normalisation at exactly 1000 and just above

## Business rule coverage

Every business rule has at least one test naming it. Searching for `BR-` across `tests/` lists them.
Rules are tested at the layer that owns them: BR-01 through BR-06 and BR-14 through BR-19 largely in
the domain, BR-04, BR-07 through BR-13 in the services, and the user-facing halves of BR-06, BR-07,
BR-09 and BR-16 in the component tests.

## Migrations

`tests/unit/infrastructure/migration-runner.spec.ts` proves that version 1 opens cleanly and creates
all seven stores, that a second run is idempotent, that a chain of steps applies in order, that a
missing step is refused, and that a database written by a **newer** schema version is rejected rather
than silently accepted.

## Running

```bash
npm test
npm run test:watch
npm run test:coverage
```
