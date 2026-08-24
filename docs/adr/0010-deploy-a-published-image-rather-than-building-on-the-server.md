# 0010. Deploy a published image rather than building on the server

## Status

Accepted.

## Context

The application had no deployment at all. It needed one, and the shape of that deployment was open.
Mealzy is a static bundle behind nginx with no backend, no database and no migrations, so the
mechanism could have been almost anything: rsync the `dist/` directory to a web root, pull the
repository on the server and run `docker compose up --build`, or publish an image and have the server
pull it.

Building on the server is the cheapest to set up. It needs no registry account, no image tags and no
credentials beyond SSH. It is also what a Compose file with only a `build:` section invites, which is
what this repository had.

## Decision

GitHub Actions builds the image, verifies it by running it, pushes it to Docker Hub, and the server
only ever pulls a tag. The server holds `docker-compose.yml` and a generated `.env`, and nothing else.

The image is built **once** per pipeline run. The smoke tests run against that build, and the push is
a retag of the same local image rather than a second build with `push: true`.

The server is pointed at the immutable `sha-<commit>` tag, not at the moving `main` tag.

## Consequences

The server needs no source tree, no Node and no build toolchain, and a deployment cannot fail halfway
through `npm ci` on a machine nobody is watching. A build failure happens in CI, on a pull request,
in front of someone.

The digest running in production is the digest CI asserted against. Retagging rather than rebuilding
is what buys this: a second build would almost certainly be identical, and cache-served, but
"almost certainly" is not a property worth relying on when the alternative costs one `docker tag`.

Pinning the server to a commit tag makes the deployed version answerable. `docker compose config` on
the server names the exact commit, and a rollback is an edit to one line of `.env`.

The cost is setup: a registry account, an access token, and eight repository secrets. That is a
one-time cost paid by whoever sets up the server, against a per-deployment cost paid forever.

`docker-compose.yml` now carries `image: ${IMAGE}` alongside `build:`, and `IMAGE` joins the required
variables. Local production runs need one more value in `.env`, which is consistent with
`0008-no-default-values-in-docker-configuration.md`: the alternative was defaulting the image name,
and a wrong default here means deploying something other than what was asked for.

## Alternatives considered

**Build on the server with `docker compose up --build`.** Rejected. It puts the toolchain, the source
tree and the build failure modes on the production machine, and it means the artefact that runs was
never verified anywhere before it started serving traffic.

**Deploy the `main` tag.** Rejected. It works, because Compose recreates a container whose digest
changed, but the server can then only answer "the newest `main`" when asked what it runs. The `sha-`
tag costs nothing extra and answers precisely.

**Push first, then verify.** Rejected. It is the common shape and it is the wrong order: it puts an
unverified artefact in the registry, where the next deployment can pick it up.
