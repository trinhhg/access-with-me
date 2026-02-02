const CACHE_NAME = 'vault-ultimate-v5';
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', e => {
    self.skipWaiting();
    e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keys => Promise.all(
        keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null)
    )));
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    // Cache App Shell, Network only cho ảnh bên ngoài để tránh lỗi
    if (e.request.url.includes('google.com/s2/favicons') || e.request.url.includes('flaticon')) {
        e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
        return;
    }
    e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});
