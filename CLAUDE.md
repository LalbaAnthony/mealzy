# Mealzy

Offline-first meal planning and shopping list PWA. Vue 3 + TypeScript, no backend, all data in
IndexedDB in the browser.

## `docs/` is the source of truth

**The source code carries zero comments by design. Every explanation lives in `docs/`.** Before
changing anything non-trivial, read the relevant document. When behaviour and documentation
disagree, the documentation is what the project owner agreed to: fix the code, or change the
document deliberately and say so.

Keeping `docs/` current is part of the work, not a follow-up. A change to a business rule that does
not update `docs/domain-model.md` is incomplete.

| Question                                                 | Document                            |
| -------------------------------------------------------- | ----------------------------------- |
| Which layer does this belong in? How do I add a feature? | `docs/architecture.md`              |
| What is the rule? What does BR-nn mean?                  | `docs/domain-model.md`              |
| How is the shopping list derived?                        | `docs/shopping-list-aggregation.md` |
| Stores, migrations, failure modes                        | `docs/persistence.md`               |
| Tokens, primitives, icons, accessibility                 | `docs/design-system.md`             |
| Images, Compose profiles, variables                      | `docs/docker.md`                    |
| Workflow layout                                          | `docs/ci.md`                        |
| Offline behaviour, manual test procedure                 | `docs/pwa.md`                       |
| Test layout and coverage policy                          | `docs/testing.md`                   |
| Why was this decided?                                    | `docs/adr/`                         |

Contested or non-obvious decisions get an ADR in `docs/adr/`, numbered, one file each.

## Non-negotiable constraints

These are enforced by guards and lint. Do not work around them.

- **No emoji and no em dash anywhere in the repository.** Use a hyphen or a comma.
- **Every type and interface is declared under `src/types/`**, every time, even when it never crosses
  a module boundary. Logic modules import them with `import type`.
- **No `any`, no `@ts-expect-error`, no `as`** outside `src/infrastructure/schemas/`. There are
  currently zero assertions in the codebase, including there. Keep it that way.
- **No default values in Docker configuration.** `${PORT}`, never `${PORT:-3000}`. No defaulting
  `ARG` or `ENV`. See `docs/adr/0008-no-default-values-in-docker-configuration.md`.

## Layering

Dependencies point inwards only. `eslint.config.js` enforces this with `no-restricted-imports`.

| Layer          | Location                                                           | Must not depend on                      |
| -------------- | ------------------------------------------------------------------ | --------------------------------------- |
| Domain         | `src/domain/`                                                      | Vue, Pinia, storage, browser APIs       |
| Services       | `src/services/`                                                    | Vue components, Pinia, concrete storage |
| Infrastructure | `src/infrastructure/`                                              | domain internals, Vue components        |
| Presentation   | `src/components/`, `src/views/`, `src/composables/`, `src/stores/` | infrastructure concretions              |

`src/app/` is the composition root and is exempt. Presentation may import pure domain helpers for
render-time formatting.

A Pinia store containing a business rule is a defect: move it to `src/domain/`. An MD3 primitive in
`src/components/md/` that knows what a recipe is, is a defect: it belongs in `src/components/app/`.

Expected business failures are values, not exceptions: services return `DomainResult<T>`. Exceptions
are for genuine faults such as storage being unavailable.

## Commands

```bash
npm run verify        # typecheck, lint, stylelint, format check, guards, coverage
npm run dev
npm run build
npm run test:watch
npm run guards        # the four repository guards
npm run build:icons   # regenerate the subset icon font from src/types/icons.ts
```

`npm run verify` is what CI runs. Run it before declaring anything done.

Requires a `.env`. Copy `.env.example` and fill in every value; nothing has a default.

## Testing

- Domain is held at **100 percent** statements, branches, functions and lines. Services at 80
  percent. Thresholds are enforced per glob in `vitest.config.ts`.
- If a branch cannot be covered, it is dead code. Restructure it away rather than excluding it. Two
  such branches were already found and removed this way.
- No test touches IndexedDB. Build services over `tests/support/test-harness.ts`, which uses
  in-memory repositories, a fake clock and a sequential id generator.
- Every business rule has at least one test naming it. Keep `BR-nn` in the test name.
- Tests contain no comments either. The test name carries the intent.

## Generated files

`src/assets/icons/` is generated by `npm run build:icons` from the `IconName` union in
`src/types/icons.ts`, and committed. CI regenerates it and fails on any diff. Add an icon by adding
it to the union and re-running the script, never by editing the generated files.

## Working method

Start with `src/types/` and `src/domain/`, with tests, before any Vue code. Then infrastructure and
services, then components, then views.

If a requirement is ambiguous or contradictory, **stop and ask the project owner** rather than
choosing silently. Do not invent business behaviour.
