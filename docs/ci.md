# Continuous integration

GitHub Actions, under `.github/workflows/`. Reusable workflows are named `*.inc.yml` and are included
from caller workflows named `*.flow.yml`.

## Reusable workflows

Each is `workflow_call` only and never triggers on its own.

| Workflow            | What it runs                                                           |
| ------------------- | ---------------------------------------------------------------------- |
| `lint.inc.yml`      | ESLint, Stylelint and Prettier in check mode                           |
| `typecheck.inc.yml` | `vue-tsc --noEmit`                                                     |
| `tests.inc.yml`     | Vitest with coverage, enforcing the thresholds, and uploads the report |
| `guards.inc.yml`    | The four repository guards, plus the icon font freshness check         |
| `build.inc.yml`     | The production Vite build and the production Docker image              |

## Caller workflows

- **`ci.flow.yml`** triggers on push to `main` and on every pull request. It calls all five. Lint,
  typecheck, guards and tests run in parallel; `build` waits for all four, because there is no point
  building an image from code that does not lint or pass its tests.
- **`tests.flow.yml`** calls `tests.inc.yml` on its own, on `workflow_dispatch` and on pushes that
  touch `src/`, `tests/`, the Vitest config or the manifests.

Concurrency is grouped per ref with `cancel-in-progress`, so a new push supersedes an in-flight run.
`permissions` is narrowed to `contents: read`.

## What `build.inc.yml` proves

It does more than compile. After building the image it starts a container, polls until the
application answers, then asserts that:

- `/` returns successfully.
- `/sw.js` and `/manifest.webmanifest` are served, so the PWA is actually installable.
- `/shopping` returns the application shell, proving the SPA history fallback works.

The container is removed in an `always()` step.

Because no Docker configuration carries defaults, the workflow supplies every variable explicitly in
its `env` block and passes the `VITE_` ones through as `--build-arg`.

## The icon font check

`guards.inc.yml` runs `npm run build:icons` and then `git diff --exit-code -- src/assets/icons`. The
generated subset font and stylesheet are committed, and this step fails if they no longer match
`src/types/icons.ts`. Generation is deterministic, so a clean tree is a reliable signal.

## Pinning and caching

Action versions are pinned to exact tags rather than floating majors. npm downloads are cached
between runs through `actions/setup-node` with `cache: npm`, keyed off `package-lock.json`. Every job
installs with `npm ci` so the lockfile is authoritative.

## Local equivalent

`npm run verify` runs the typecheck, lint, Stylelint, format check, guards and coverage in one pass.
A `simple-git-hooks` pre-commit hook runs `lint-staged` and the guards, and a `commit-msg` hook runs
`commitlint` against Conventional Commits with a lower-case subject and no emoji.

## Prettier and the em dash

Prettier is configured with `proseWrap: "preserve"` and performs no punctuation substitution, so it
cannot introduce an em dash into a file that does not already contain one. `check-no-em-dash.ts`
enforces the rule regardless of how a character arrives, and it scans the whole repository rather
than only source directories.
