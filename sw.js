// Offline support: serve the app from cache, refresh the cache from the network when online.
// It caches only the game's own files. Player data is in localStorage and never passes through here.
const CACHE = 'my-life-v2';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      const fresh = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      // Pages: network first so updates arrive; assets (hashed names): cache first.
      return req.mode === 'navigate' ? fresh.then((r) => r || cached) : cached || fresh;
    }),
  );
});
