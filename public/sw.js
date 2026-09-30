// Wortwabe service worker: makes the app installable and playable offline.
//
// Bump CACHE only when the logic in this file changes. App assets are content-hashed by Vite,
// so a new deploy brings new URLs and never needs a cache bump; the network-first navigation
// below picks up the new index.html, which references the new hashed files.
const CACHE = 'wortwabe-v1';

// All paths resolve against the worker's scope, so this works under any base path.
const url = (path) => new URL(path, self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const shell = [url('./'), url('./index.html'), url('manifest.webmanifest')];
      shell.push(
        ...['icon-192.png', 'icon-512.png', 'icon-maskable-512.png'].map((f) => url('icons/' + f)),
      );
      // Read the hashed asset URLs out of index.html so the very first visit works offline too.
      const html = await (await fetch(url('./index.html'), { cache: 'reload' })).text();
      for (const match of html.matchAll(/(?:src|href)="([^"]*assets\/[^"]+)"/g)) {
        shell.push(new URL(match[1], url('./index.html')).href);
      }
      await cache.addAll(shell);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    // Network-first so a new deploy is picked up; the cached shell is the offline fallback.
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(url('./index.html'), copy));
          }
          return response;
        })
        .catch(() => caches.match(url('./index.html'))),
    );
    return;
  }

  // Cache-first for everything else (hashed assets, icons, manifest).
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
