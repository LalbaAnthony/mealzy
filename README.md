# Mealzy

Mealzy is an offline-first Progressive Web App that helps a household plan meals and derive a
shopping list from them.

**All data is local to your browser.** There is no backend, no API and no database server. Recipes,
planned meals, staples and shopping ticks live in IndexedDB on the device you are using. Nothing is
uploaded anywhere. Clearing site data deletes everything, so use the backup export in Settings
before you do.

## The core loop

1. Keep a catalogue of **recipes**, each one a reusable template built from referenced ingredients.
2. Schedule **planned meals**, each one an instance of a recipe.
3. The **shopping list** is derived automatically from meals that have not been eaten yet, plus your
   **staples**, plus any one-off **ad hoc items**.
4. Export or share the list, shop, tick items off, and mark meals as eaten.
5. Eaten meals leave the active list but are never lost. A filter brings them back.

## Prerequisites

- Node.js 22 or newer (the toolchain is developed and tested on Node 24).
- npm 10 or newer.
- Docker and the Docker Compose plugin, if you want to run the containerised environments.

## Getting started

Every environment variable is required and none has a default anywhere in the Docker configuration.
Copy the example file and fill it in before doing anything else.

```bash
cp .env.example .env
```

A working local set of values:

```
HOST_BIND=127.0.0.1
DEV_PORT=5173
PROD_PORT=8080
NGINX_PORT=8080
VITE_APP_NAME=Mealzy
VITE_APP_SHORT_NAME=Mealzy
VITE_APP_DESCRIPTION=Offline-first meal planning and shopping list
VITE_APP_VERSION=1.0.0
```

Then install and run:

```bash
npm ci
npm run dev
```

## Docker

```bash
docker compose --profile dev up
docker compose --profile prod up --build
```

The development profile serves Vite with hot module replacement and a bind mount of the source tree.
The production profile builds the application and serves the static output from nginx as a non-root
user. Full details, including the variable list, are in [docs/docker.md](docs/docker.md).

## npm scripts

| Script                         | What it does                                                   |
| ------------------------------ | -------------------------------------------------------------- |
| `npm run dev`                  | Vite development server                                        |
| `npm run build`                | Production bundle into `dist/`                                 |
| `npm run preview`              | Serve the production bundle locally                            |
| `npm run typecheck`            | `vue-tsc --noEmit`                                             |
| `npm run lint`                 | ESLint, including the layering rules                           |
| `npm run lint:style`           | Stylelint, including the design token rules                    |
| `npm run format:check`         | Prettier in check mode                                         |
| `npm test`                     | Vitest once                                                    |
| `npm run test:watch`           | Vitest in watch mode                                           |
| `npm run test:coverage`        | Vitest with the coverage thresholds enforced                   |
| `npm run guards`               | All four repository guards                                     |
| `npm run guard:emoji`          | Fail on any emoji anywhere in the repository                   |
| `npm run guard:em-dash`        | Fail on any em dash anywhere in the repository                 |
| `npm run guard:type-locations` | Fail on a type or interface declared outside `src/types/`      |
| `npm run build:icons`          | Regenerate the subset icon font from `src/types/icons.ts`      |
| `npm run verify`               | Typecheck, lint, format check, guards and coverage in one pass |

## Documentation

Every explanation lives in `docs/`.

- [docs/architecture.md](docs/architecture.md) - the four layers and how to add a feature
- [docs/domain-model.md](docs/domain-model.md) - every entity and every business rule
- [docs/shopping-list-aggregation.md](docs/shopping-list-aggregation.md) - the aggregation algorithm
- [docs/persistence.md](docs/persistence.md) - object stores, migrations and failure modes
- [docs/design-system.md](docs/design-system.md) - tokens, primitives, icons and accessibility
- [docs/docker.md](docs/docker.md) - images, Compose profiles and variables
- [docs/ci.md](docs/ci.md) - the workflow layout
- [docs/pwa.md](docs/pwa.md) - offline behaviour and the manual test procedure
- [docs/testing.md](docs/testing.md) - test layout and coverage policy
- [docs/adr/](docs/adr/) - the architecture decision records
