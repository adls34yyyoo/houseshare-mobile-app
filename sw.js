// Service Worker for HouseShare APP - 修复版
const CACHE_NAME = 'houseshare-app-v1.1';
const STATIC_ASSETS = [
  './',
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

// 安装事件 - 缓存静态资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('缓存静态资源...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker 安装完成');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('缓存失败:', err);
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('清理旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker 激活完成');
      return self.clients.claim();
    })
  );
});

// 获取请求 - 优先从缓存获取，然后网络请求
self.addEventListener('fetch', event => {
  // 跳过非GET请求
  if (event.request.method !== 'GET') {
    return;
  }

  // 检查是否为API请求
  const isApiRequest = event.request.url.includes('/api/');
  
  // 对于API请求，优先网络
  if (isApiRequest) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // 克隆响应
          const responseClone = response.clone();
          
          // 缓存成功的API响应
          if (response.status === 200) {
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseClone);
              });
          }
          
          return response;
        })
        .catch(() => {
          // 网络失败时尝试从缓存获取
          return caches.match(event.request);
        })
    );
  } else {
    // 对于静态资源，优先缓存
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then(response => {
              // 检查是否为可缓存的响应
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // 克隆响应
              const responseToCache = response.clone();
              
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              
              return response;
            })
            .catch(err => {
              console.error('获取失败:', err);
              
              // 如果请求的是HTML页面，返回离线页面
              if (event.request.headers.get('accept')?.includes('text/html')) {
                return caches.match('/');
              }
              
              return new Response('网络连接失败，请检查网络后重试', {
                status: 408,
                headers: { 'Content-Type': 'text/plain; charset=utf-8' }
              });
            });
        }
      }
    });
  }
});

// 推送事件处理
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'HouseShare 通知',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-72x72.png',
    tag: 'houseshare-notification',
    renotify: true,
    actions: [
      {
        action: 'view',
        title: '查看'
      },
      {
        action: 'close',
        title: '关闭'
      }
    ],
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'HouseShare', options)
  );
});

// 推送通知点击处理
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const url = event.notification.data.url;
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then(clientList => {
        // 检查是否有已打开的窗口
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // 没有则打开新窗口
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});

// 后台同步处理
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// 同步数据函数
async function syncData() {
  try {
    // 从本地存储获取待同步的数据
    const pendingData = JSON.parse(localStorage.getItem('pending_sync') || '[]');
    
    if (pendingData.length === 0) {
      return;
    }
    
    // 发送同步请求
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data: pendingData })
    });
    
    if (response.ok) {
      // 同步成功，清除待同步数据
      localStorage.removeItem('pending_sync');
      
      console.log('数据同步成功');
    } else {
      console.error('数据同步失败');
    }
  } catch (error) {
    console.error('同步过程中发生错误:', error);
  }
}

// 监听消息
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 定期清理旧缓存
async function cleanOldCaches() {
  const cacheNames = await caches.keys();
  const currentCacheName = CACHE_NAME;
  
  for (const cacheName of cacheNames) {
    if (cacheName !== currentCacheName && !cacheName.startsWith('offline-')) {
      await caches.delete(cacheName);
      console.log('已清理旧缓存:', cacheName);
    }
  }
}

// 定期执行缓存清理
setInterval(cleanOldCaches, 7 * 24 * 60 * 60 * 1000); // 每周清理一次