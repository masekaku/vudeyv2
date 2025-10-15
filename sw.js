const CACHE_VERSION = 'artifact-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/assets/css/style.css',
  '/assets/js/app.js',
  '/assets/js/config.js',
  '/assets/js/statistics.js',
  '/artifacts.json',
  '/manifest.json',
  '/components/privacy-policy.html',
  '/components/disclaimer.html',
  '/components/contact.html',
  '/components/about.html',
  '/components/cdma.html',
  '/sitemap.xml'
];

// install
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
  );
});

// activate & cleanup
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

// fetch: cache-first for static, network-first for runtime json
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Always respond to navigation with cached index.html (app shell)
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then(res => res || fetch(request))
    );
    return;
  }

  // Artifacts JSON: network-first with fallback to cache
  if (url.pathname.endsWith('/artifacts.json')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // For other GET requests: cache-first
  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          // store fonts and images to runtime cache
          if (response && response.status === 200 && response.type !== 'opaque') {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        }).catch(() => {
          // fallback for images
          if (request.destination === 'image') {
            return caches.match('/assets/icons/icon-192.png');
          }
        });
      })
    );
  }
});