# Progressive Web App behaviour

Mealzy is offline-first. Since there is no backend, every asset is precached and the application is
fully functional with the network disabled.

## Configuration

`vite-plugin-pwa` in `generateSW` mode with `registerType: 'prompt'`.

- `globPatterns` precaches every `js`, `css`, `html`, `svg`, `png`, `ico` and `woff2` file in the
  build, which is the entire application including the subset icon font.
- `navigateFallback: '/index.html'` serves the shell for any route.
- `cleanupOutdatedCaches` removes superseded precaches on activation.
- `clientsClaim` and `skipWaiting` are both **false**, so a new service worker never takes over a
  running page without the user agreeing.
- `runtimeCaching` is empty. There is nothing to cache at runtime because there are no network
  requests.

The current build precaches 36 entries totalling about 440 KiB.

## Update flow

Because `registerType` is `prompt`, an updated service worker installs and then waits.
`usePwaUpdate` wraps `useRegisterSW` and exposes `needRefresh`, which `PwaUpdatePrompt` renders as an
in-application prompt offering **Reload** or **Later**.

The page is never reloaded without asking. Choosing Later dismisses the prompt and leaves the waiting
worker in place until the next visit.

The same component reports `offlineReady` once on first successful precache, so the user knows the
application will work without a connection.

## Manifest

The Web App Manifest is generated from the `VITE_APP_*` variables and the MD3 tokens:

- `name`, `short_name` and `description` from the environment.
- `display: standalone`, `orientation: portrait`, `start_url` and `scope` at `/`.
- `theme_color` `#8f4c38` and `background_color` `#fff8f6`, matching the light palette.
- Three icons: 192x192, 512x512, and a 512x512 maskable variant.

`index.html` additionally carries `theme-color` meta tags for both colour schemes, so the browser
chrome follows the active theme.

`zlib`, with no image library dependency.

## No external network dependencies

The production build loads nothing from any external origin. The Material Symbols font is subset and
self-hosted, and the Content Security Policy served by nginx restricts `default-src`, `script-src`,
`style-src`, `font-src`, `img-src` and `connect-src` to `'self'`. This is what makes the application
work offline from first launch rather than only after a font has been fetched.

## Testing the offline path manually

Playwright is out of scope for v1, so the offline path is verified by hand. This procedure is the
acceptance check.

1. Build and serve the production image:

   ```bash
   docker compose --profile prod up --build
   ```

2. Open `http://127.0.0.1:${PROD_PORT}` in Chrome. Complete a first load.
3. Open DevTools, go to **Application, Service workers**, and confirm a worker is **activated and
   running**. Confirm **Application, Storage, Cache storage** holds a `workbox-precache` entry.
4. Confirm installability: the address bar shows an install control, and **Application, Manifest**
   reports no errors and lists all three icons.
5. Create a recipe and plan a meal, so there is data in IndexedDB.
6. In **Network**, set throttling to **Offline**.
7. Reload the page. The application must load fully, and the recipe and meal must still be there.
8. Navigate to every route while offline. Each must render, proving the history fallback and the
   precached route chunks.
9. Add another recipe while offline, then reload. It must persist, because every write goes to
   IndexedDB and nothing depends on the network.
10. Return to **Online**. The application must continue working without a reload.

To test the update prompt, run a second `docker compose --profile prod up --build` after changing a
source file, then reload the tab once. The prompt must appear and the page must not reload until
**Reload** is pressed.

## Known limitation

A hard reload with **Empty cache and hard reload** while offline bypasses the service worker and will
fail, as it does for any PWA. A normal reload is the correct test.
