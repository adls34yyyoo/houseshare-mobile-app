// Service Worker for HouseShare APP - 简化版
const CACHE_NAME = 'houseshare-app-v1.2';
const STATIC_ASSETS = [
  './index.html',
  './manifest.json',
  './css/style.css',
  './css/components.css',
  './css/login.css',
  './css/remixicon-local.css',
  './js/app.js',
  './js/services.js',
  './js/ui.js'
];

// 安装事件
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 激活事件
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 获取请求
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }))
      .catch(() => caches.match('./index.html'))
  );
});
