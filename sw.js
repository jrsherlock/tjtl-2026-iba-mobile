// City High Jazz · IBA 2026 — offline-first service worker
// Purpose: keep the program readable inside a saturated convention-center
// network. Strategy is stale-while-revalidate for the HTML + cache-first for
// fonts. Bump CACHE_VERSION to force a refresh after content updates.

const CACHE_VERSION = 'chj-iba-2026-v11';
const CORE = [
  '/', '/index.html',
  '/assets/champions-2026.jpg',
  '/assets/champions-2026-sm.jpg',
  '/assets/iba-poster.jpg',
  '/assets/iba-poster-sm.jpg',
  '/assets/iba-og.jpg',
  '/assets/ensemble-2026.jpg',
  '/assets/ensemble-2026-sm.jpg',
  '/assets/players/gideon-levine.jpg',
  '/assets/players/gideon-levine-sm.jpg',
  '/assets/players/jesse-varner.jpg',
  '/assets/players/jesse-varner-sm.jpg',
  '/assets/players/silas-gollnick.jpg',
  '/assets/players/silas-gollnick-sm.jpg',
  '/assets/players/james-tilley.jpg',
  '/assets/players/james-tilley-sm.jpg',
  '/assets/players/jameson-sherlock.jpg',
  '/assets/players/jameson-sherlock-sm.jpg',
  '/assets/players/jillian-leman.jpg',
  '/assets/players/jillian-leman-sm.jpg',
  '/assets/players/cameron-echols.jpg',
  '/assets/players/cameron-echols-sm.jpg',
  '/assets/players/jack-harmsen.jpg',
  '/assets/players/jack-harmsen-sm.jpg',
  '/assets/players/naomi-downing-sherer.jpg',
  '/assets/players/naomi-downing-sherer-sm.jpg',
  '/assets/players/thomas-hand.jpg',
  '/assets/players/thomas-hand-sm.jpg',
  '/assets/players/linus-mcroberts.jpg',
  '/assets/players/linus-mcroberts-sm.jpg',
  '/assets/players/leif-larsen.jpg',
  '/assets/players/leif-larsen-sm.jpg',
  '/assets/players/coraline-etler.jpg',
  '/assets/players/coraline-etler-sm.jpg',
  '/assets/players/frank-ogilvie.jpg',
  '/assets/players/frank-ogilvie-sm.jpg',
  '/assets/players/willow-schultz.jpg',
  '/assets/players/willow-schultz-sm.jpg',
  '/assets/players/beckett-tobin.jpg',
  '/assets/players/beckett-tobin-sm.jpg',
  '/assets/players/evan-farley.jpg',
  '/assets/players/evan-farley-sm.jpg',
  '/assets/players/ethan-kardos.jpg',
  '/assets/players/ethan-kardos-sm.jpg',
  '/assets/players/max-nolte.jpg',
  '/assets/players/max-nolte-sm.jpg',
  '/assets/players/daniel-kenyon.jpg',
  '/assets/players/daniel-kenyon-sm.jpg',
  '/assets/players/alma-bhandary-narayanan.jpg',
  '/assets/players/alma-bhandary-narayanan-sm.jpg'
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
