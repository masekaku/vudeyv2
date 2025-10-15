// Dummy Service Worker
self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('fetch', event => {
    // Dummy fetch handler
    event.respondWith(fetch(event.request));
});