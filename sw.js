const CACHE_NAME = 'vault-fix-routing-v9'; 
const ASSETS_TO_CACHE = [
  '/',                // Quan trọng: Cache đường dẫn gốc
  '/index.html',      // Quan trọng: Cache file thực tế
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;600&family=Roboto:wght@400;500;700&display=swap',
  'https://unpkg.com/@zip.js/zip.js@2.7.34/dist/zip.min.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Caching assets...');
      // Dùng return cache.addAll để đảm bảo nếu lỗi 1 file thì báo lỗi ngay
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
          console.error("SW: Cache failed", err);
      });
    })
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

  // Bỏ qua các request API hoặc Extension
  if (!url.protocol.startsWith('http') || req.method !== 'GET' || url.hostname.includes('workers.dev')) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(req).then((networkResponse) => {
        // Chỉ cache các file hợp lệ
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, responseToCache));
        }
        return networkResponse;
      }).catch(() => {
        // --- FALLBACK CỰC MẠNH ---
        // Nếu lỗi mạng, bất kể đang gọi file HTML nào, trả về index.html từ cache
        if (req.headers.get('accept').includes('text/html')) {
          return caches.match('/') 
            .then(res => res || caches.match('/index.html')); 
        }
      });
    })
  );
});
