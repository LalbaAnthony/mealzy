# Docker

All Dockerfiles live at the repository root and use the `Dockerfile.` prefix. A single
`docker-compose.yml` orchestrates the one logical application as two services gated by mutually
exclusive profiles, so only one is ever running at a time.

## No default values

There is **no default value anywhere** in the Docker configuration. Compose uses `${PORT}`, never
`${PORT:-3000}`. No `ARG` or `ENV` in either Dockerfile supplies a fallback. A missing variable fails
loudly instead of silently starting on a port nobody expected.

The same principle reaches into the application: `vite.config.ts` calls `requireEnv` for each
`VITE_`-prefixed variable and throws a named error if one is missing or empty.

## Required variables

Copy `.env.example` to `.env` and fill in every value. All of them are required.

| Variable               | Used by                    | What it is                                            |
| ---------------------- | -------------------------- | ----------------------------------------------------- |
| `HOST_BIND`            | Compose                    | Host interface to publish on, for example `127.0.0.1` |
| `DEV_PORT`             | Compose, `Dockerfile.dev`  | Vite port, inside the container and on the host       |
| `PROD_PORT`            | Compose                    | Host port for the production service                  |
| `NGINX_PORT`           | Compose, `Dockerfile.prod` | Port nginx listens on inside the container            |
| `VITE_APP_NAME`        | Vite build                 | Application name, used in the manifest and page title |
| `VITE_APP_SHORT_NAME`  | Vite build                 | Manifest short name                                   |
| `VITE_APP_DESCRIPTION` | Vite build                 | Manifest and meta description                         |
| `VITE_APP_VERSION`     | Vite build                 | Shown in Settings                                     |

## Commands

```bash
docker compose --profile dev up
docker compose --profile prod up --build
```

Bring an environment down with `docker compose --profile dev down` or
`docker compose --profile prod down`.

## `Dockerfile.dev`

Based on `node:24-alpine`. Installs all dependencies including development tooling, and runs Vite in
development mode bound to `0.0.0.0`. There is no build step, no minification, and sourcemaps stay on.

The compose service bind-mounts the source tree at `/app` and keeps `node_modules` in a named volume,
so the container's Linux-native dependencies are not overwritten by the host's. `tini` is the
entrypoint so that Ctrl-C reaches Vite rather than being swallowed by PID 1.

Hot module replacement works over the published port because Vite is bound to `0.0.0.0` and the host
port matches the container port.

## `Dockerfile.prod`

Multi-stage.

The **builder** stage runs on `node:24-alpine`: `npm ci`, then `npm run typecheck` with `vue-tsc`,
then `npm run build`. The `VITE_` variables arrive as build arguments and are promoted to environment
variables, because Vite's `loadEnv` reads `process.env` and `.env` is excluded by `.dockerignore`.
Type checking runs before the build so a type error fails the image build rather than shipping.

The **runtime** stage runs on `nginx:alpine` and copies only `dist`. There is no Node, no npm and no
development dependency in the final image.

### Non-root runtime

The image runs as the `nginx` user, not root. That requires:

- A custom `/etc/nginx/nginx.conf` with `pid /tmp/nginx.pid` and every temp path under `/tmp`, since
  an unprivileged user cannot write the default locations.
- `chown` on `/usr/share/nginx/html`, `/etc/nginx/conf.d` and `/var/cache/nginx`, so the image's own
  `envsubst` entrypoint step can write the rendered configuration.
- Listening on `${NGINX_PORT}`, which must be above 1024.

`nginx/default.conf.template` is rendered by the base image's entrypoint. Only variables that are
actually defined in the environment are substituted, so nginx's own `$uri` is left intact.

### Nginx behaviour

- **SPA history fallback.** `try_files $uri $uri/ /index.html`, so `/shopping` serves the shell.
- **`index.html` and `sw.js` are `no-cache`.** A stale service worker or shell would strand users on
  an old build.
- **Hashed assets are immutable.** Everything under `/assets/` gets
  `public, max-age=31536000, immutable`, keyed off the response content type.
- **`manifest.webmanifest` is `no-cache`.**
- **gzip** is on for text, JavaScript, CSS, JSON, the manifest and SVG.
- **Security headers** on every response: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: no-referrer`, `Cross-Origin-Opener-Policy: same-origin`, and a Content Security
  Policy restricted to `'self'` with `frame-ancestors 'none'`. Because `add_header` in a nested
  location replaces inherited headers rather than adding to them, the headers are repeated in the
  locations that set their own `Cache-Control`.

The `web-prod` service carries a health check that fetches `/` with `wget` every 30 seconds.

## `.dockerignore`

Excludes `node_modules`, `dist`, `.git`, `tests`, `docs` and local environment files, so the build
context stays small and no `.env` can leak into an image.

## Verification status

`docker compose --profile prod config` validates and confirms that every variable interpolates. The
images themselves were **not built or run** during development, because no Docker daemon was
available in that environment. The CI `build.inc.yml` job builds the production image, starts it,
and asserts that `/`, `/sw.js`, `/manifest.webmanifest` and the history fallback all answer.
