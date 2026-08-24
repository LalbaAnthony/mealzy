# Continuous integration

GitHub Actions, under `.github/workflows/`. Reusable workflows are named `*.inc.yml` and are included
from caller workflows named `*.flow.yml`.

## Reusable workflows

Each is `workflow_call` only and never triggers on its own.

| Workflow            | What it runs                                                            |
| ------------------- | ----------------------------------------------------------------------- |
| `lint.inc.yml`      | ESLint, Stylelint and Prettier in check mode                            |
| `typecheck.inc.yml` | `vue-tsc --noEmit`                                                      |
| `tests.inc.yml`     | Vitest with coverage, enforcing the thresholds, and uploads the report  |
| `guards.inc.yml`    | The four repository guards, plus the icon font freshness check          |
| `build.inc.yml`     | The production Vite build and the production Docker image, and the push |
| `deploy.inc.yml`    | The SSH deployment to the production server                             |

`build.inc.yml` and `deploy.inc.yml` take inputs, the other four take none. `build.inc.yml` decides
whether to publish from its `publish` input, so a pull request and a release run the same code path
and differ only in that one boolean.

## Caller workflows

- **`ci.flow.yml`** triggers on every pull request. It calls the first five with `publish: false`.
  Lint, typecheck, guards and tests run in parallel; `build` waits for all four, because there is no
  point building an image from code that does not lint or pass its tests.
- **`deploy.flow.yml`** triggers on push to `main`, on a monthly schedule and on
  `workflow_dispatch`. It calls the same four checks, then `build.inc.yml` with `publish: true`, then
  `deploy.inc.yml`. See `docs/deployment.md`.
- **`tests.flow.yml`** calls `tests.inc.yml` on its own, on `workflow_dispatch` and on pushes that
  touch `src/`, `tests/`, the Vitest config or the manifests.

`ci.flow.yml` deliberately does **not** trigger on push to `main`. `deploy.flow.yml` runs the
identical checks on that branch, and having both would run every job twice on every merge.

Concurrency is grouped per ref. `ci.flow.yml` cancels an in-flight run, so a new push supersedes it.
`deploy.flow.yml` does not: interrupting a run halfway through leaves the registry or the server in a
state nobody chose, so deployments queue instead. `permissions` is narrowed to `contents: read`.

## What `build.inc.yml` proves

It does more than compile. After building the image it starts a container, polls until the
application answers, then asserts that:

- `/health` returns the plain body `ok`, proving the rendered nginx configuration is this project's
  and not a fallback that answers every path.
- `/sw.js` and `/manifest.webmanifest` are served, so the PWA is actually installable.
- `/shopping` returns the application shell, proving the SPA history fallback works.

The container is removed in an `always()` step.

Because no Docker configuration carries defaults, the workflow supplies every variable explicitly in
its `env` block and passes the `VITE_` ones through as `--build-arg`.

## Building once

The image is built a single time, into the local tag `mealzy:ci`, and the smoke tests run against
that image. When `publish` is true the same image is retagged and pushed afterwards, rather than
built a second time with `push: true`. A second build would be cache-served and almost free, but it
would still be a different invocation, and the point of the smoke test is to be able to say that the
digest running in production is the digest that answered.

Layer caching goes through `type=gha`, so an unchanged dependency tree does not reinstall.

## The icon font check

`guards.inc.yml` runs `npm run build:icons` and then `git diff --exit-code -- src/assets/icons`. The
generated subset font and stylesheet are committed, and this step fails if they no longer match
`src/types/icons.ts`. Generation is deterministic, so a clean tree is a reliable signal.

## Pinning and caching

Action versions are pinned to exact tags rather than floating majors, the Docker and SSH actions
included. npm downloads are cached
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
