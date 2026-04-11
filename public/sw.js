/**
 * World Emotion Map — Service Worker
 * Strategy:
 *   - App shell (HTML/JS/CSS): Cache-first, fallback to network
 *   - Emotion API (/api/emotions/*): Network-first, fallback to cache
 *   - Everything else: Network-only (map tiles, external CDN)
 */

const CACHE_VERSION = "v1";
const SHELL_CACHE = `wem-shell-${CACHE_VERSION}`;
const DATA_CACHE = `wem-data-${CACHE_VERSION}`;

const SHELL_URLS = ["/", "/en", "/ja", "/offline"];

// Install: pre-cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== SHELL_CACHE && k !== DATA_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests (skip Mapbox tiles, external resources)
  if (url.origin !== self.location.origin) return;

  // Emotion API: network-first, fallback to cache
  if (url.pathname.startsWith("/api/emotions")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(DATA_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // App shell: cache-first, fallback to network, fallback to offline page
  if (
    request.mode === "navigate" ||
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font"
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request)
            .then((response) => {
              if (response.ok && request.mode === "navigate") {
                const clone = response.clone();
                caches
                  .open(SHELL_CACHE)
                  .then((cache) => cache.put(request, clone));
              }
              return response;
            })
            .catch(() => caches.match("/offline") || new Response("Offline"))
      )
    );
  }
});
