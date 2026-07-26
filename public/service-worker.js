const CACHE_NAME = 'iron-will-v3'; // Bumped to v3 - Network First strategy
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/user-portal.html',
    '/admin-dashboard.html',
    '/check-in.html',
    '/gallery.html',
    '/members.html',
    '/user-login.html',
    '/admin-login.html',
    '/manifest.json',
    '/css/components.css',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
    // Immediately activate the new service worker
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            // Delete ALL old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        ])
    );
});

self.addEventListener('fetch', (event) => {
    // API requests - Network Only
    if (event.request.url.includes('/api/')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // ALL other requests - Network First, fall back to cache
    // This ensures you ALWAYS get the latest version of every file
    if (event.request.method === 'GET') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Save a copy to cache for offline use
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Offline: serve from cache
                    return caches.match(event.request);
                })
        );
    }
});

// Handle manual activation message
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
