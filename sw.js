const CACHE_NAME = 'artifact-archive-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/artifacts.json',
  '/manifest.json',
  '/assets/css/style.css',
  '/assets/js/config.js',
  '/assets/js/statistics.js',
  '/assets/js/app.js',
  'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap',
  'https://unpkg.com/aos@2.3.1/dist/aos.css',
  'https://unpkg.com/lucide@latest/dist/umd/lucide.js',
  'https://unpkg.com/aos@2.3.1/dist/aos.js'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        return fetch(event.request).then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
            
          return response;
        });
      })
      .catch(() => {
        // If both cache and network fail, show offline page
        if (event.request.url.includes('artifacts.json')) {
          return new Response(JSON.stringify({offline: true}), {
            headers: {'Content-Type': 'application/json'}
          });
        }
      })
  );
});