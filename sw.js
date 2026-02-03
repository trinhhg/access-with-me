const CACHE_NAME = 'vault-fix-v9';
const APP_SHELL = [
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;600&display=swap'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Chỉ xử lý GET request, bỏ qua POST (API backup/sync)
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(res => {
      // Có cache thì dùng, không thì tải mạng
      return res || fetch(e.request);
    }).catch(() => {
      // MẤT MẠNG + KHÔNG CACHE -> TRẢ VỀ TRANG CHỦ (Quan trọng nhất)
      if (e.request.mode === 'navigate') {
        return caches.match('/index.html');
      }
    })
  );
});
