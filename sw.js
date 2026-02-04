const CACHE_NAME = 'vault-pwa-v3-final'; // Đổi tên để trình duyệt biết là phiên bản mới
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 1. INSTALL: Chỉ cache những file cốt lõi nhất để tránh lỗi khi cài đặt
self.addEventListener('install', event => {
  self.skipWaiting(); // Ép SW kích hoạt ngay lập tức
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('SW: Installing and caching App Shell');
      return cache.addAll(APP_SHELL);
    })
  );
});

// 2. ACTIVATE: Xóa các bản cache cũ rác
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Cleaning old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Kiểm soát các clients ngay lập tức
});

// 3. FETCH: Chiến lược Stale-While-Revalidate (Ưu tiên cache, tự cập nhật ngầm)
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // QUAN TRỌNG: Bỏ qua request POST (API Worker) và Chrome Extension
  // Để trình duyệt tự xử lý, SW không can thiệp -> Tránh lỗi "undefined response"
  if (req.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // Xử lý các request GET (HTML, CSS, JS, Images)
  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      // B1: Thử tìm trong cache trước
      const cachedResponse = await cache.match(req);
      
      // B2: Tạo promise để fetch từ mạng và cập nhật cache (chạy ngầm)
      const fetchPromise = fetch(req).then(networkResponse => {
        // Chỉ cache nếu response OK (status 200) và là loại cơ bản hoặc cors
        if (networkResponse && networkResponse.status === 200) {
          // Clone response vì nó chỉ đọc được 1 lần
          cache.put(req, networkResponse.clone());
        }
        return networkResponse;
      }).catch(err => {
        // Lỗi mạng (Offline) -> bỏ qua
        console.log('SW: Fetch failed (Offline mode)', req.url);
      });

      // B3: Logic trả về:
      // - Nếu có cache: Trả về cache ngay (nhanh), mạng sẽ tự update cache sau.
      // - Nếu chưa có cache: Chờ tải từ mạng.
      // - Nếu mất mạng và không có cache: Trả về trang chủ (fallback).
      return cachedResponse || await fetchPromise || await cache.match('/index.html');
    })
  );
});
