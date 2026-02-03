const CACHE_NAME = 'vault-ultimate-v8-fix'; // Tăng version
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icons/icon-192.png', // Đảm bảo bạn có file này
    '/icons/icon-512.png', // Đảm bảo bạn có file này
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;600&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/zip.js/2.7.29/zip.min.js' // Cache thêm thư viện ZIP
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
    // FIX QUAN TRỌNG: Chỉ chặn GET request. 
    // POST request (Gửi backup, Sync) phải đi thẳng ra mạng, không qua Cache.
    if (e.request.method !== 'GET') {
        return; 
    }

    e.respondWith(
        caches.match(e.request).then(res => {
            return res || fetch(e.request);
        }).catch(() => {
            // Fallback về trang chủ nếu mất mạng và không có cache
            return caches.match('/index.html');
        })
    );
});
