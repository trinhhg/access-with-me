const CACHE_NAME = 'vault-fix-ext-v6'; // Đổi tên để reset cache cũ
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;600&family=Roboto:wght@400;500;700&display=swap',
  'https://unpkg.com/@zip.js/zip.js@2.7.34/dist/zip.min.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => Promise.all(
      keyList.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // --- FIX QUAN TRỌNG: CHẶN LỖI CHROME EXTENSION ---
  // Chỉ xử lý các request http/https. Bỏ qua chrome-extension://, workers.dev (API), và POST request
  if (!url.protocol.startsWith('http') || req.method !== 'GET' || url.hostname.includes('workers.dev')) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      // 1. Có cache dùng luôn
      if (cachedResponse) return cachedResponse;

      // 2. Không có thì tải mạng
      return fetch(req).then((networkResponse) => {
        // Kiểm tra response hợp lệ
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
          return networkResponse;
        }

        // 3. Cache lại cho lần sau
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, responseToCache));
        return networkResponse;
      }).catch(() => {
        // 4. Offline Fallback: Nếu đang vào trang chủ mà mất mạng thì trả về index.html
        if (req.headers.get('accept').includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});
