# ADR 0008: No default values in Docker configuration

## Status

Accepted. This constraint comes from the project owner.

## Context

Compose supports `${PORT:-3000}`, and Dockerfiles support `ARG PORT=3000`. Both are convenient and
both hide misconfiguration.

A default turns a missing variable into a silent, plausible-looking success. The container starts on
a port nobody chose, or the production build ships with a placeholder application name in its
manifest, and the mistake is found much later by someone who cannot see where the value came from.

## Decision

There is no default value anywhere in the Docker configuration. `docker-compose.yml` writes
`${PORT}`, never `${PORT:-3000}`. Neither Dockerfile supplies a fallback in an `ARG` or an `ENV`.

`.env.example` lists every required variable with an empty value, and the full list is documented in
`docs/docker.md`.

## Consequences

- A missing variable fails immediately and visibly, at the moment and place it is missing.
- The environment is documented in exactly one place, `.env.example`, rather than being scattered
  across fallbacks in Compose and two Dockerfiles.
- The first run of a new checkout requires `cp .env.example .env` and filling it in. This is a small,
  one-time cost, and it is the point: the values are a deliberate choice rather than an inheritance.
- The principle was extended into the application, because a default in Vite would defeat the
  discipline at the last step. `vite.config.ts` calls `requireEnv` for every `VITE_` variable and
  throws a named error listing the missing key rather than emitting `undefined` into the manifest.
- `EXPOSE` in the Dockerfiles uses a build argument with no default, so the port must be passed
  explicitly by Compose or by the CI build command.
