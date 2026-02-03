// sw.js - Safe Mode v2
const CACHE_NAME = 'vault-safe-core-v2';
const APP_SHELL = [
    '/index.html',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

self.addEventListener('install', e => {
    self.skipWaiting();
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(APP_SHELL)));
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keys => Promise.all(
        keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null)
    )));
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    const url = new URL(e.request.url);

    // 1. QUAN TRỌNG: Không bao giờ cache request gửi đi (POST) hoặc API
    if (e.request.method !== 'GET' || url.origin !== self.location.origin) {
        return; 
    }

    // 2. Ưu tiên Cache cho App Shell, còn lại Network First
    e.respondWith(
        caches.match(e.request).then(cached => {
            return cached || fetch(e.request).catch(() => {
                // Nếu mất mạng và không có cache, trả về trang chủ (Offline mode)
                return caches.match('/index.html');
            });
        })
    );
});
