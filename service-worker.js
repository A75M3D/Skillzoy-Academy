const CACHE_NAME = 'skillzoy-v4'; // غيّر الرقم كل مرة ترفع تحديث جديد
const urlsToCache = [
  '/',
  '/manifest.json',
  '/script.js',
  '/style.css',
  '/login.html',
  '/register.html',
];

// Install
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching Files');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // إجبار التحديث الفوري
  );
});

// Activate
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(cacheName);
          }
        })
      )
    ).then(() => self.clients.claim()) // تفعيل فوري للعملاء الحاليين
  );
});

// Fetch
self.addEventListener('fetch', (event) => {
  const dynamicFiles = ['/dashboard/index.html', '/index.html'];
  const isDynamicFile = dynamicFiles.some((file) =>
    event.request.url.includes(file)
  );

  if (isDynamicFile) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) =>
              cache.put(event.request, responseClone)
            );
          }
          return networkResponse;
        })
        .catch(() =>
          caches.match(event.request).then(
            (cachedResponse) =>
              cachedResponse ||
              new Response('Offline - No cached version available')
          )
        )
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) return response;
        return fetch(event.request)
          .then((fetchResponse) => {
            if (!fetchResponse || fetchResponse.status !== 200) {
              return fetchResponse;
            }
            const responseToCache = fetchResponse.clone();
            caches.open(CACHE_NAME).then((cache) =>
              cache.put(event.request, responseToCache)
            );
            return fetchResponse;
          })
          .catch(
            () => new Response('Offline - Please check your connection')
          );
      })
    );
  }
});

// Listen for messages (لتحديث النسخة يدويًا)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
