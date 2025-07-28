const CACHE_NAME = 'terra-earth-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/chat.js',
  '/manifest.json',
  '/three.min.js'
];

// 安装事件
self.addEventListener('install', function(event) {
  console.log('Service Worker 安装中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('缓存已打开');
        return cache.addAll(urlsToCache);
      })
  );
});

// 激活事件
self.addEventListener('activate', function(event) {
  console.log('Service Worker 激活中...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 拦截网络请求
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // 如果缓存中有响应，则返回缓存的版本
        if (response) {
          return response;
        }

        // 否则，进行网络请求
        return fetch(event.request).then(function(response) {
          // 检查是否收到有效响应
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // 重要：克隆响应，因为响应是一个流
          // 我们想要浏览器消费响应和缓存消费响应
          var responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(function() {
          // 网络请求失败时的回退
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// 推送事件（为将来的功能预留）
self.addEventListener('push', function(event) {
  const options = {
    body: event.data ? event.data.text() : '球球terra有新消息！',
    // icon: 'icon-192x192.png',
    // badge: 'icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '探索地球'
        // icon: 'icon-192x192.png'
      },
      {
        action: 'close',
        title: '关闭'
        // icon: 'icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('球球terra', options)
  );
});

// 消息事件
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 