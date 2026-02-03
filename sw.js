const CACHE_NAME = 'vault-ultimate-v7'; // Tăng version để trình duyệt cập nhật
const ASSETS = [
    '/index.html',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;600&display=swap' // Cache thêm font mới
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
    // Chiến lược: Network First cho API, Cache First cho tài nguyên tĩnh
    if (e.request.method === 'POST') {
        return; // Không cache lệnh gửi dữ liệu
    }
    e.respondWith(
        caches.match(e.request).then(res => res || fetch(e.request))
    );
});
