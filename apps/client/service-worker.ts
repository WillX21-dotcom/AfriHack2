// Royal Square Financial - Client PWA Service Worker
const CACHE_NAME = 'royal-square-client-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  (self as any).skipWaiting();
});

self.addEventListener('activate', (event: any) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  (self as any).clients.claim();
});

self.addEventListener('fetch', (event: any) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
            return response;
          })
          .catch(() => {
            return caches.match('/index.html');
          })
      );
    })
  );
});

self.addEventListener('push', (event: any) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Royal Square Financial Update';
  const options = {
    body: data.body || 'You have an important update regarding your portfolio or claim.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: {
      url: data.url || '/client',
    },
  };
  event.waitUntil((self as any).registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  event.waitUntil(
    (self as any).clients.openWindow(event.notification.data?.url || '/client')
  );
});
