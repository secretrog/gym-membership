const CACHE_NAME = 'iron-will-v1'; // Re-branded and updated for notification system
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
    // We no longer call skipWaiting() here immediately
    // to allow the user to trigger it manually via the banner.
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

    // Navigation requests (HTML) - Network First
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match(event.request);
            })
        );
        return;
    }

    // Static assets - Cache First, then Network
    if (event.request.method === 'GET') {
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request);
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
