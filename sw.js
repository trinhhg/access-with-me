const CACHE_NAME = 'vault-offline-v5'; // Đổi tên để ép trình duyệt cập nhật
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  // Cache cứng các thư viện này để offline vẫn chạy được
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;600&family=Roboto:wght@400;500;700&display=swap',
  'https://unpkg.com/@zip.js/zip.js@2.7.34/dist/zip.min.js'
];

// 1. INSTALL: Tải và lưu ngay lập tức các file quan trọng
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Đang cache dữ liệu...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. ACTIVATE: Xóa cache cũ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('SW: Xóa cache cũ', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. FETCH: Xử lý request
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // QUAN TRỌNG: Nếu là API gửi lên Cloudflare Worker (Backup/Sync) -> LUÔN DÙNG MẠNG (Không cache)
  if (req.method !== 'GET' || url.hostname.includes('workers.dev')) {
    return; // Để mặc định cho trình duyệt xử lý, SW không can thiệp
  }

  // Với các file tĩnh (HTML, JS, CSS): Ưu tiên lấy từ Cache
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      // 1. Nếu có trong cache -> Trả về ngay (Nhanh, chạy được offline)
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. Nếu không có -> Tải từ mạng
      return fetch(req)
        .then((networkResponse) => {
          // Kiểm tra nếu tải lỗi hoặc không phải file hợp lệ thì trả về luôn
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
            return networkResponse;
          }

          // 3. Nếu tải thành công -> Lưu vào cache cho lần sau
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // 4. Nếu mất mạng và không có trong cache (Lỗi Offline)
          // Nếu người dùng đang cố vào trang chủ -> Trả về index.html từ cache
          if (req.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html');
          }
        });
    })
  );
});
