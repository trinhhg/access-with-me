const CACHE_NAME = 'vault-app-v4';
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
    // Với Logo và ảnh bên ngoài -> Ưu tiên mạng, lỗi thì kệ
    if (e.request.url.includes('google.com/s2/favicons') || e.request.url.includes('flaticon')) {
        e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
        return;
    }
    // Với App chính -> Ưu tiên Cache để chạy Offline siêu tốc
    e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});
