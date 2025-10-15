const CACHE_NAME = 'artifact-archive-v1';
const urlsToCache = [
    './',
    './index.html',
    './styles/main.css',
    './scripts/app.js',
    './scripts/video-data.js',
    './data/videos.json',
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=VT323&display=swap',
    'https://cdn.plyr.io/3.7.8/plyr.css',
    'https://unpkg.com/lucide@latest/dist/umd/lucide.js',
    'https://unpkg.com/aos@2.3.1/dist/aos.css',
    'https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/howler.min.js',
    'https://cdn.plyr.io/3.7.8/plyr.js',
    'https://unpkg.com/aos@2.3.1/dist/aos.js'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            }
        )
    );
});