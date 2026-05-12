// City High Jazz · IBA 2026 — offline-first service worker
// Purpose: keep the program readable inside a saturated convention-center
// network. Strategy is stale-while-revalidate for the HTML + cache-first for
// fonts. Bump CACHE_VERSION to force a refresh after content updates.

const CACHE_VERSION = 'chj-iba-2026-v3';
const CORE = [
  '/', '/index.html',
  '/assets/champions-2026.jpg',
  '/assets/champions-2026-sm.jpg',
  '/assets/iba-poster.jpg',
  '/assets/iba-poster-sm.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(CORE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Cache-first for Google Fonts (URL stays stable, content is immutable)
  if (url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then(c => c.put(req, copy));
        return res;
      }).catch(() => hit))
    );
    return;
  }

  // Stale-while-revalidate for same-origin navigations and assets
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(hit => {
        const network = fetch(req).then(res => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then(c => c.put(req, copy));
          }
          return res;
        }).catch(() => hit);
        return hit || network;
      })
    );
  }
});
