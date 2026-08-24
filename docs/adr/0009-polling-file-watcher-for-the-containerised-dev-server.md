# ADR 0009: Polling file watcher for the containerised dev server

## Status

Accepted.

## Context

`docker compose --profile dev up` bind-mounts the source tree at `/app` and runs Vite inside the
container. On Docker Desktop for Windows and macOS the host tree is exposed through a translation
layer, and that layer does not forward `inotify` events into the Linux container.

The result is a failure that looks like a broken feature rather than a missing event. Editing a file
on the host updates the file inside the container immediately, so nothing appears wrong, but Vite's
watcher is never woken and no hot module replacement message is ever sent. The browser shows the
build from container start until it is reloaded by hand. On Linux, and inside the WSL2 file system,
the same setup works because the events cross the mount natively.

Three options were on the table.

- **Poll instead of waiting for events.** Chokidar's `usePolling` stats the watched files on an
  interval. It works on every host and costs CPU proportional to the file count divided by the
  interval.
- **Require the checkout to live inside the WSL2 file system.** Native events, and faster on every
  file operation. It is a change to how each developer sets up their machine, and it does nothing for
  macOS.
- **Drop the container for development and run `npm run dev` on the host.** The dev container then
  exists only to be unused, and the production profile stops being the only environment anybody
  actually exercises.

## Decision

The watcher strategy is a required environment variable rather than a fixed setting.
`DEV_WATCH_POLLING` is `true` or `false` and `DEV_WATCH_INTERVAL` is the period in milliseconds.
`vite.config.ts` reads both, applies them to `server.watch`, and rejects a missing or malformed value
with a named error, in line with ADR 0008.

The variables are read only when the Vite command is `serve`, so `npm run build` and the production
image, which pass no `DEV_` variable, are unaffected.

Moving the checkout into WSL2 remains the better answer where the workflow allows it. Encoding
polling as a constant would have hidden that choice and taxed the hosts that never needed it.

## Consequences

- Hot module replacement works on every supported host, at a cost the developer chooses rather than
  one imposed by the repository.
- The cost is real on the hosts that opt in. Polling at 300 ms keeps a save under the time it takes
  to switch windows while leaving idle CPU use low, and both ends of that tradeoff are tunable.
- Two more variables must be filled in `.env` before anything runs. A checkout that predates this
  change fails on the first `npm run dev` with a message naming the missing key, which is the
  intended behaviour of ADR 0008 rather than a regression.
- `vite.config.ts` now carries two typed environment readers next to `requireEnv`. They exist because
  a boolean and an interval have shapes that an empty-string check does not cover.
