const CACHE_NAME = 'vault-fix-cors-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;600&family=Roboto:wght@400;500;700&display=swap',
  'https://unpkg.com/@zip.js/zip.js@2.7.34/dist/zip.min.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  // QUAN TRỌNG: Nếu request gửi đến Worker API (doicucden) -> BỎ QUA, KHÔNG CACHE
  if (url.includes('workers.dev') || event.request.method === 'POST') {
    return; 
  }

  // Chỉ cache các file tĩnh (GET)
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(networkRes => {
         // Cache lại font và thư viện zip nếu tải từ mạng
         if(networkRes.ok && (url.startsWith('http'))) {
             const clone = networkRes.clone();
             caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
         }
         return networkRes;
      });
    }).catch(() => {
        // Fallback offline (nếu cần)
    })
  );
});
