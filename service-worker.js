// ⚡ Skillzoy Smart Auto-Updating Service Worker
const VERSION = new Date().getTime(); // رقم فريد تلقائي في كل تحميل جديد
const CACHE_NAME = `skillzoy-cache-${VERSION}`;
const STATIC_FILES = [
  '/',
  '/manifest.json',
  '/style.css',
  '/login.html',
  '/register.html',
];

// 🧠 تثبيت الملفات الثابتة
self.addEventListener('install', (event) => {
  console.log('📦 Installing new service worker:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_FILES);
    }).then(() => {
      console.log('✅ Cached static files successfully');
      return self.skipWaiting();
    })
  );
});

// 🧹 تنشيط وحذف الكاش القديم
self.addEventListener('activate', (event) => {
  console.log('🚀 Activating service worker...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('🗑️ Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ⚙️ إستراتيجية ذكية للتعامل مع الطلبات
self.addEventListener('fetch', (event) => {
  const req = event.request;
  
  // لو كان طلب API أو Supabase → تحديث فوري من الشبكة
  if (req.url.includes('supabase.co') || req.url.includes('/api/')) {
    event.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }

  // لو كان HTML → استخدم Network First
  if (req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // باقي الملفات (CSS, JS, صور...) → Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((res) => {
        caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
        return res;
      });
      return cached || fetchPromise;
    })
  );
});

// 🔁 تحديث تلقائي للعميل عند وجود SW جديد
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('controllerchange', () => {
  console.log('♻️ Controller changed — app updated automatically!');
});
