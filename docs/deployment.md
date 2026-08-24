# Deployment

Mealzy is deployed as a single container: the nginx runtime image produced by `Dockerfile.prod`,
serving the static bundle. There is no backend and no database, so a deployment is nothing more than
replacing that container with a newer one.

The pipeline never builds on the server. GitHub Actions builds the image, starts it, proves it
answers, pushes it to Docker Hub, and the server only pulls a tag that has already been verified.

## The two caller workflows

| Workflow          | Trigger                                               | What it does                            |
| ----------------- | ----------------------------------------------------- | --------------------------------------- |
| `ci.flow.yml`     | every pull request                                    | checks, then builds the image, no push  |
| `deploy.flow.yml` | push to `main`, monthly schedule, `workflow_dispatch` | the same checks, then push, then deploy |

`ci.flow.yml` no longer triggers on push to `main`, because `deploy.flow.yml` runs the identical set
of reusable workflows on that branch. Keeping both would double every job on every merge.

## The pipeline, in order

1. **`metadata`** computes the values the rest of the run depends on: the image name, the immutable
   image reference `IMAGE:sha-<commit>`, and the application version.
2. **`lint`, `typecheck`, `guards`, `tests`** run in parallel, exactly as on a pull request.
3. **`build`** waits for all four, builds the production image, starts it, and asserts that it
   answers before anything reaches the registry. Only then does it push.
4. **`deploy`** copies `docker-compose.yml` and a generated `.env` to the server, pulls the image,
   restarts the service, and polls the health endpoint until it answers.

A failure at any step stops the run. A broken commit cannot reach the registry, and an image that
does not start cannot reach the server.

## The published image is the image that was tested

`build.inc.yml` builds **once**, into a local tag, runs the smoke tests against that exact image, and
publishes it afterwards with `docker tag` and `docker push`. It does not rebuild for the push. The
digest that runs in production is the digest that answered the assertions in CI, not a second build
that happens to come from the same source.

Two tags are pushed:

| Tag            | Meaning                                                 |
| -------------- | ------------------------------------------------------- |
| `main`         | a moving pointer to the newest verified build of `main` |
| `sha-<commit>` | immutable, one specific commit                          |

The server is always pointed at the `sha-` tag, never at `main`. The deployed reference is written
into the `.env` on the server, so the machine records exactly which commit it is running.

## The scheduled redeploy

The `schedule` trigger fires at 03:00 on the 10th of each month. It rebuilds the same commit from
scratch, which pulls current `node:24-alpine` and `nginx:alpine` base layers, so operating system and
nginx security patches reach production without anyone having to push a commit. The rebuilt image has
a different digest, so Compose recreates the container.

## Server requirements

- Docker and the Docker Compose plugin.
- An SSH account whose public key is authorised on the server, and which can run `docker`.
- A reverse proxy terminating TLS in front of the container. See the note on `HOST_BIND` below.

Nothing else. No Node, no npm and no checkout on the server: only `docker-compose.yml` and `.env` are
copied there.

## Repository secrets

Six are consumed by `deploy.inc.yml`, two by `build.inc.yml`. All are required.

| Secret               | What it is                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------- |
| `DOCKERHUB_USERNAME` | Docker Hub account that owns the image repository                                        |
| `DOCKERHUB_TOKEN`    | Docker Hub access token with write scope                                                 |
| `SSH_HOST`           | Server hostname or address                                                               |
| `SSH_USER`           | Account to connect as                                                                    |
| `SSH_PORT`           | SSH port                                                                                 |
| `SSH_PRIVATE_KEY`    | Private key for that account, the whole PEM block                                        |
| `DEPLOY_DIRECTORY`   | Absolute path on the server, for example `/home/deploy/mealzy`                           |
| `PROD_PORT`          | Host port the container publishes on. Must match `ProxyPass` in `apache.conf`, so `4555` |

The `deploy` job runs in the `production` GitHub environment, so an approval rule or a branch
restriction can be attached there without touching the workflow.

## Values that are not secrets

Everything else sits in the `env` block at the top of the workflow that uses it, in plain sight: the
image name in `deploy.flow.yml`, the application metadata and `NGINX_PORT` in `build.inc.yml` and
`deploy.inc.yml`. A port number and an application description are not credentials, and hiding them
in the secret store only makes the pipeline harder to read and harder to reproduce by hand.

## The generated environment file

The server never receives the repository's `.env`. The `deploy` job writes a fresh one and copies it
next to `docker-compose.yml`.

It contains **every** variable the Compose file mentions, including the `DEV_` ones, even though the
`dev` profile is never activated on the server. Compose interpolates the whole file before it filters
by profile, and an unset variable would silently become an empty string. That is exactly the
defaulting this project refuses, so the generated file is complete rather than minimal. See
`docs/adr/0008-no-default-values-in-docker-configuration.md`.

`COMPOSE_PROJECT_NAME` is written into that file too, rather than exported inside the SSH command, so
the deployment directory fully describes the running stack. A human on the server can reproduce the
deployment with a bare `docker compose --profile prod up -d` and get the same result the workflow
gets.

The values are injected through the step's `env` block rather than interpolated into the shell
script, so a value containing a shell metacharacter is written literally instead of being executed.
For the same reason nothing on the server ever sources that file: `VITE_APP_DESCRIPTION` contains
spaces, which Compose parses correctly but `sh` would not.

## `HOST_BIND` is `127.0.0.1`

The deployment publishes the container on the loopback interface only. The application is reachable
through a reverse proxy on the same machine and is not exposed directly.

This matters more than usual here. `Dockerfile.prod` serves a strict Content Security Policy and a
set of security headers, but it does not terminate TLS, and a PWA needs a secure context before the
browser will register its service worker. Without HTTPS in front, the offline behaviour this whole
application is built around does not start. Set `HOST_BIND` to `0.0.0.0` in `deploy.inc.yml` only if
you accept both consequences.

The proxy that satisfies this is documented below and reproduced in `apache.conf`.

## The reverse proxy

`apache.conf` at the repository root is the Apache virtual host that sits in front of the container.
Its own header states the contract: it is **not generated and not deployed by anything**. The
pipeline never reads it, never copies it and never reloads Apache. It is a reference copy that has to
be kept identical to what is actually installed on the server, by hand, or it is worse than having no
copy at all.

The request path is:

```
browser --> Apache :443 (TLS, HTTP/2) --> 127.0.0.1:4555 --> container nginx :8080
```

Apache terminates TLS and proxies cleartext to the loopback address. It serves no files of its own
apart from the ACME challenge directory.

### The port contract

`ProxyPass / http://127.0.0.1:4555/` is the single point where the two halves of this document meet.
The `PROD_PORT` secret **must be `4555`**, because that is the host port `docker-compose.yml`
publishes the container on. Change one and the other has to follow, or the proxy will answer 503
while a perfectly healthy container listens on a port nobody is asking about.

`HOST_BIND` being `127.0.0.1` is what makes the loopback target valid, and what keeps the container
off the public interface. The two settings are consistent as they stand.

### Required Apache modules

`http2`, `ssl`, `rewrite`, `proxy`, `proxy_http`, `headers`. The file lists them in its own header.
`a2enmod` them before the first `apachectl configtest`, or the vhost will not load.

### TLS and certificates

Certificates come from Let's Encrypt at `/etc/letsencrypt/live/mealzy.dev-it.app/`. The `:80` vhost
exists only to serve the ACME challenge from `/var/www/certbot/` and to redirect everything else to
HTTPS. The `RewriteCond` excludes `/.well-known/acme-challenge/` from that redirect, which is what
keeps unattended renewals working: certbot's webroot check must reach a real file over plain HTTP,
and a blanket redirect would break it.

`Protocols h2 http/1.1` is on the TLS vhost only. `h2c`, the cleartext variant, is deliberately not
enabled. `SSLProtocol` floors the negotiation at TLS 1.2, which HTTP/2 requires for ALPN anyway.

This is also what makes the PWA work at all. A service worker is only registered in a secure context,
so without this vhost the offline behaviour the application is built around never starts.

### Two layers of security headers

Both Apache and the container's nginx set security headers, and they do not agree everywhere.

| Header                       | nginx (`default.conf.template`)    | Apache (`apache.conf`)                         |
| ---------------------------- | ---------------------------------- | ---------------------------------------------- |
| `X-Content-Type-Options`     | `nosniff`                          | `nosniff`                                      |
| `X-Frame-Options`            | `DENY`                             | `SAMEORIGIN`                                   |
| `Referrer-Policy`            | `no-referrer`                      | `strict-origin-when-cross-origin`              |
| `Content-Security-Policy`    | `'self'`, `frame-ancestors 'none'` | not set                                        |
| `Cross-Origin-Opener-Policy` | `same-origin`                      | not set                                        |
| `Strict-Transport-Security`  | not set                            | `max-age=63072000; includeSubDomains; preload` |
| `Permissions-Policy`         | not set                            | `camera=(), microphone=(), geolocation=(self)` |

The additions are unambiguous: HSTS and `Permissions-Policy` belong at the TLS terminator, and nginx
inside the container has no business setting HSTS on a connection it does not terminate.

The two overlaps are worth checking after the first deployment. Apache uses `Header always set`,
which writes to `err_headers_out` rather than replacing the value the backend already sent in
`headers_out`, so a proxied 200 can carry **both** headers rather than only Apache's. Browsers
resolve the duplicates differently: conflicting `X-Frame-Options` values are treated as `DENY`, while
`Referrer-Policy` is parsed as a token list where the last valid token wins.

In practice framing is settled regardless, because nginx's `frame-ancestors 'none'` takes precedence
over `X-Frame-Options` in every browser that supports CSP Level 2. `Referrer-Policy` is the one that
genuinely resolves to whichever value arrives last. Confirm what is actually on the wire rather than
reasoning about it:

```bash
curl -sSI https://mealzy.dev-it.app/ | grep -i -E 'x-frame|referrer|strict-transport|content-security'
```

If the duplicates are unwanted, the fix belongs in one layer or the other, deliberately, and the
decision belongs in this document.

### A stale comment in the file

The `# Node` comment above the `ProxyPass` pair does not describe this deployment. There is no Node
process on the server: the proxy target is nginx serving a static bundle, and the only Node in the
project runs inside the builder stage of `Dockerfile.prod`, in CI. The comment is harmless, and the
file is reproduced here exactly as it is installed, so it has been left alone.

### It is in the build context

`.dockerignore` does not exclude `apache.conf`, so it is copied into the builder stage by `COPY . .`.
It does not reach the runtime image, which takes only `dist` from the builder, so nothing is served
or shipped. The file holds a domain name and certificate paths rather than credentials, and the cost
is 2 KB of build context. Excluding it would be tidier and changes nothing about the result.

## Restart rather than down and up

The remote step runs `pull` and then `up --detach --remove-orphans`. It does not bring the stack down
first. Compose recreates a container whose image ID changed, which is a short replacement rather than
a window during which the site returns nothing at all. The container holds no state, so there is
nothing to drain and nothing to migrate: all user data lives in IndexedDB in the browser.

`docker image prune --force` afterwards reclaims the layers of the image that was just replaced. It
removes dangling images only, so it will not touch other projects sharing the host.

## The health endpoint

`nginx/default.conf.template` serves `GET /health` as `200 ok`, with `Cache-Control: no-store` and
its access log turned off.

It exists because the SPA history fallback makes every other path a useless probe. `try_files` falls
back to `/index.html`, so `/health`, `/anything` and a typo all return `200` with the application
shell. A check against `/` therefore proves only that nginx is running, not that it was configured
with this project's rules. An explicit `location = /health` is matched before the fallback and
returns a body the shell cannot produce, so a passing probe proves the rendered configuration is the
intended one.

The same endpoint is used in three places: the Compose health check, the CI smoke test in
`build.inc.yml`, and the post-deployment verification in `deploy.inc.yml`.

## Rolling back

Re-run the deploy workflow from the commit you want, through `workflow_dispatch` on that ref.

To roll back without a workflow run, edit `IMAGE` in the `.env` on the server to an older
`sha-<commit>` tag and run `docker compose --profile prod up -d`. The `sha-` tags are immutable, so an
old one still resolves to the image that was verified at the time. The next successful pipeline run
overwrites that file and moves the server forward again, so a manual rollback is a stopgap, not a
state the repository knows about.

## The first deployment

Required, in this order:

1. Create a Docker Hub access token with write scope, and add the eight secrets listed above.
2. Generate the deployment key pair. The public half goes in the deployment account's
   `authorized_keys` on the server, the private half in `SSH_PRIVATE_KEY`. The first connection uses
   `StrictHostKeyChecking=accept-new`, so no `known_hosts` entry has to be prepared.
3. Install Docker and the Compose plugin on the server, and allow the deployment account to run
   `docker` without `sudo`.
4. Install the reverse proxy. `apache.conf` is the vhost, reproduced from the server; copy it into
   `/etc/apache2/sites-available/`, `a2enmod http2 ssl rewrite proxy proxy_http headers`, issue the
   certificate with certbot, then `a2ensite` and reload. Nothing in the pipeline does this, and
   nothing in the pipeline will notice if it drifts. This step is not cosmetic: without a secure
   context the browser refuses to register the service worker, and the offline behaviour the
   application exists for never starts.
5. Ensure `.github/workflows/deploy.flow.yml` is **on `main`**. A workflow only responds to
   `push: main` once the file itself is on that branch, so the first merge that carries it into
   `main` is also the first deployment.

Two steps that are commonly listed and are **not** needed here:

- The Docker Hub repository does not have to exist. The first `docker push` creates it under the
  account's namespace. It is created **public**, so create it by hand beforehand if it should be
  private.
- The `production` environment does not have to exist. GitHub creates an environment referenced by a
  workflow on first use. Create it by hand only to attach an approval rule or a branch restriction.

The deployment directory is created by the workflow, so nothing needs to exist on the server
beforehand.

`schedule` triggers only ever run from the default branch, so the monthly redeploy starts working
once `main` is the default branch and carries `deploy.flow.yml`.
