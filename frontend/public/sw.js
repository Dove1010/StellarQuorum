/*
 * Service worker for offline detection and fallback.
 *
 * This worker uses a network-first strategy for navigation requests:
 * - When online, it fetches from the network (ensuring fresh governance data)
 * - When offline, it serves the /offline fallback page
 *
 * Static assets are cached to improve performance and enable some offline
 * capability for the shell, but live data always requires connectivity.
 */

const CACHE_NAME = "quorum-v1";
const OFFLINE_URL = "/offline";

// Assets to cache for performance (not full offline capability)
const STATIC_ASSETS = [
  "/",
  "/offline",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
});

self.addEventListener("fetch", (event) => {
  // Only handle navigation requests
  if (event.request.mode !== "navigate") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Network failed: try cache, then fallback to offline page
        return caches.match(event.request).then((cached) => {
          return cached || caches.match(OFFLINE_URL);
        });
      })
  );
});
