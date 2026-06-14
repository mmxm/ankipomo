const CACHE_NAME = 'ankipomo-cache-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/index.css',
  '/app.js',
  '/logo.svg',
  '/manifest.json',
  '/HotAirBalloonHills.svg',
  '/airballoon.svg'
];

self.addEventListener('install', (e) => {
  self.skipWaiting(); // Force the waiting service worker to become active immediately
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim(); // Take control of all open pages immediately
    })
  );
});

self.addEventListener('fetch', (e) => {
  // Only handle GET requests and local/safe HTTP schemas
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Ne pas intercepter les fichiers internes du serveur de dev Vite
  if (e.request.url.includes('@vite') || e.request.url.includes('hot-update') || e.request.url.includes('node_modules')) {
    return;
  }
  
  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        // Si le réseau répond correctement, on met à jour le cache et on renvoie la réponse
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // En cas de panne de réseau (mode hors ligne), on renvoie la version du cache
        return caches.match(e.request);
      })
  );
});
