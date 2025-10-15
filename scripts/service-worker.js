// Service Worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // Create a simple service worker script as a blob
        const swScript = `
            const CACHE_NAME = 'artifact-archive-v1';
            const urlsToCache = [
                '/',
                '/styles/main.css',
                '/scripts/app.js',
                '/scripts/video-data.js',
                'https://cdnjs.cloudflare.com/ajax/libs/plyr/3.7.8/plyr.min.css',
                'https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css',
                'https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap',
                'https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css',
                'https://unpkg.com/lucide@latest/dist/umd/lucide.js',
                'https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/howler.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/plyr/3.7.8/plyr.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.js'
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
        `;
        
        const blob = new Blob([swScript], { type: 'application/javascript' });
        const swURL = URL.createObjectURL(blob);
        
        navigator.serviceWorker.register(swURL)
            .then(function(registration) {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(function(error) {
                console.log('Service Worker registration failed:', error);
            });
    });
}

// Embedded PWA Manifest
const manifest = {
    "name": "The Artifact: Classified and Forbidden Archive",
    "short_name": "The Artifact",
    "description": "A classified archive of forbidden videos and artifacts",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#0a0a0a",
    "theme_color": "#00ff00",
    "orientation": "portrait-primary",
    "icons": [
        {
            "src": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiBmaWxsPSIjMGEwYTBhIi8+CjxwYXRoIGQ9Ik05NiAzNkM2Mi44NjgzIDM2IDM2IDYyLjg2ODMgMzYgOTZDNzIgOTYgMTIwIDk2IDE1NiA5NkMxNTYgNjIuODY4MyAxMjkuMTMyIDM2IDk2IDM2WiIgZmlsbD0iIzAwZmYwMCIvPgo8cGF0aCBkPSJNMTU2IDk2QzE1NiAxMjkuMTMyIDEyOS4xMzIgMTU2IDk2IDE1NkM2Mi44NjgzIDE1NiAzNiAxMjkuMTMyIDM2IDk2IiBzdHJva2U9IiMwMGZmMDAiIHN0cm9rZS13aWR0aD0iOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxjaXJjbGUgY3g9Ijk2IiBjeT0iOTYiIHI9IjEyIiBmaWxsPSIjMDBmZjAwIi8+Cjwvc3ZnPgo=",
            "sizes": "192x192",
            "type": "image/svg+xml"
        }
    ]
};

const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
const manifestURL = URL.createObjectURL(manifestBlob);
document.getElementById('app-manifest').href = manifestURL;

// Third-party Scripts (Placeholders)
window.disqus_config = function () {
    this.page.url = window.location.href;
    this.page.identifier = 'artifact-archive';
};

window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'GA_MEASUREMENT_ID');