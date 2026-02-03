// PHIÊN BẢN SW AN TOÀN - CHỐNG CRASH PWA
const CACHE = 'vault-safe-v1';
const APP_SHELL = [
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png', // Đảm bảo bạn đã upload file này lên folder /icons/
  '/icons/icon-512.png'  // Đảm bảo bạn đã upload file này lên folder /icons/
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE && caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // 1. KHÔNG can thiệp request ra ngoài domain (CDN, API Worker)
  if (url.origin !== self.location.origin) return;

  // 2. KHÔNG can thiệp POST/PUT (Upload, Sync)
  if (e.request.method !== 'GET') return;

  // 3. Xử lý khi mở App (Navigation)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match('/index.html').then(res => res || fetch('/index.html'))
    );
    return;
  }

  // 4. Các file tĩnh (CSS, JS, Icons)
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
