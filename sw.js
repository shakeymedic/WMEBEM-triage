// sw.js - EMEvidence Triage v19.0
// Basic offline app-shell caching for a device used at a triage desk with unreliable wifi.
// Cache-first for the app shell, network-first fallback isn't needed since this app has no server calls.

const CACHE_NAME = 'emevidence-triage-v19';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './protocols.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {
            // If an asset 404s (e.g. an icon not yet added), don't block install of the rest.
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request).then((response) => {
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => cached);
        })
    );
});
