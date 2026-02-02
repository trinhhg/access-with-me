const CACHE_NAME = 'vault-cache-v3'; // Tăng phiên bản khi cập nhật
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  // Cache luôn icon chính để dùng offline
  'https://bitwarden.com/images/icon-32x32.png',
  'https://bitwarden.com/images/icon-192x192.png'
];

// 1. Cài đặt & Cache tài nguyên
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Kích hoạt SW mới ngay lập tức
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching URLs');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// 2. Kích hoạt & Xóa cache cũ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // SW chiếm quyền điều khiển ngay
});

// 3. Xử lý Fetch - Ưu tiên Cache, sau đó mới ra Mạng
self.addEventListener('fetch', (event) => {
  // Chỉ xử lý các request GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Nếu có trong cache, trả về ngay (OFFLINE first)
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Nếu không, thử tải từ mạng
        return fetch(event.request)
          .then((networkResponse) => {
             // (Tùy chọn) Có thể cache động các file mới tải về ở đây
             return networkResponse;
          })
          .catch(() => {
             // Xử lý khi mất mạng hoàn toàn và không có cache
             // Có thể trả về một trang "Bạn đang offline" nếu muốn
          });
      })
  );
});
