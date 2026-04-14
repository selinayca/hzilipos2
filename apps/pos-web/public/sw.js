/**
 * HizliPOS Service Worker
 *
 * Strategy:
 *   - App shell (HTML, JS, CSS): Cache-first with network fallback.
 *     On first load everything is cached. Subsequent loads serve from cache
 *     and update in background (stale-while-revalidate).
 *
 *   - API calls (/api/*): Network-first with no caching.
 *     The offline layer lives in IndexedDB (Dexie), not the service worker cache.
 *     This avoids stale response issues and keeps the SW simple.
 *
 *   - Static assets (images, fonts): Cache-first, long TTL.
 *
 * The SW is registered manually in the POS layout to give us full control
 * over the update lifecycle (important for POS — don't silently break a
 * cashier mid-shift with an auto-update).
 */

const CACHE_NAME = 'hizlipos-v1';

// App shell resources to precache on install
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
];

// ── Install ───────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

// ── Activate — clean up old caches ────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. API calls → network only (offline handled by Dexie sync engine)
  if (url.pathname.startsWith('/api/') || url.hostname !== self.location.hostname) {
    return; // Let the browser handle it normally
  }

  // 2. Navigation requests (HTML pages) → stale-while-revalidate
  if (request.mode === 'navigate') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // 3. Static assets → cache-first
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }
});

// ── Cache strategies ──────────────────────────────────────────────────────

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const networkPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });

  // Return cached immediately if available, otherwise wait for network
  return cached ?? networkPromise;
}

// ── Background sync (future: use Background Sync API) ────────────────────
// Currently handled by the JS sync engine in sync.ts polling on 'online' events.
// When Background Sync API has wider support, register a sync tag here:
//
// self.addEventListener('sync', (event) => {
//   if (event.tag === 'sync-orders') {
//     event.waitUntil(syncPendingOrders());
//   }
// });
