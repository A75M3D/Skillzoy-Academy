const CACHE_NAME = 'skillzoy-dynamic-v1';
const STATIC_CACHE = 'skillzoy-static-v1';

// الملفات الثابتة التي نريد تخزينها
const staticAssets = [
  '/',
  '/manifest.json',
  '/style.css',
  '/login.html',
  '/register.html',
];

// التهيئة والتثبيت
self.addEventListener('install', (event) => {
  console.log('🔄 Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // تخزين الملفات الثابتة
      caches.open(STATIC_CACHE)
        .then((cache) => {
          console.log('📦 Service Worker: Caching Static Files');
          return cache.addAll(staticAssets);
        }),
      
      // تفعيل Service Worker فوراً
      self.skipWaiting()
    ])
  );
});

// التنشيط
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activated');
  
  event.waitUntil(
    Promise.all([
      // تنظيف الكاش القديم
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== CACHE_NAME) {
              console.log('🗑️ Service Worker: Clearing Old Cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // تفعيل فوري للعملاء الحاليين
      self.clients.claim()
    ])
  );
});

// إستراتيجية التخزين المؤقت الذكية
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // استراتيجية Network First للبيانات الديناميكية من Supabase
  if (url.href.includes('supabase.co') || 
      url.href.includes('/api/') || 
      request.headers.get('Accept')?.includes('application/json')) {
    
    console.log('🌐 Service Worker: Dynamic Data Request -', url.pathname);
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // استراتيجية Cache First للملفات الثابتة
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'image') {
    
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // استراتيجية Network First للصفحات
  event.respondWith(networkFirstStrategy(request));
});

// استراتيجية Network First (الشبكة أولاً)
async function networkFirstStrategy(request) {
  try {
    console.log('📡 Service Worker: Trying network request -', request.url);
    
    // محاولة جلب البيانات من الشبكة أولاً
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      // تخزين الاستجابة في الكاش للمرة القادمة
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
      
      console.log('✅ Service Worker: Network response cached -', request.url);
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    console.log('❌ Service Worker: Network failed, trying cache -', request.url);
    
    // إذا فشلت الشبكة، نستخدم البيانات المخزنة
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('💾 Service Worker: Serving from cache -', request.url);
      return cachedResponse;
    }
    
    // إذا لم توجد بيانات مخزنة، نعيد رسالة خطأ
    console.log('⚠️ Service Worker: No cached version available');
    return new Response('Offline - No cached version available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// استراتيجية Cache First (الكاش أولاً)
async function cacheFirstStrategy(request) {
  try {
    console.log('💾 Service Worker: Trying cache first -', request.url);
    
    // محاولة استخدام البيانات المخزنة أولاً
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('✅ Service Worker: Serving from cache -', request.url);
      return cachedResponse;
    }
    
    // إذا لم توجد بيانات مخزنة، نجلب من الشبكة
    console.log('📡 Service Worker: Cache miss, fetching from network -', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
      console.log('✅ Service Worker: Network response cached -', request.url);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('❌ Service Worker: Both cache and network failed -', request.url);
    return new Response('Offline - Please check your connection', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// نظام التحديث الذكي للبيانات
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Service Worker: Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // تحديث البيانات في الخلفية
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    
    const supabaseRequests = keys.filter(request => 
      request.url.includes('supabase.co')
    );
    
    for (const request of supabaseRequests) {
      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200) {
          await cache.put(request, networkResponse.clone());
          console.log('✅ Service Worker: Background sync updated -', request.url);
        }
      } catch (error) {
        console.log('❌ Service Worker: Background sync failed for -', request.url);
      }
    }
  } catch (error) {
    console.log('❌ Service Worker: Background sync error', error);
  }
}

// نظام المراقبة والتحديث التلقائي
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'periodic-data-update') {
    console.log('🔄 Service Worker: Periodic sync triggered');
    event.waitUntil(doPeriodicSync());
  }
});

async function doPeriodicSync() {
  // تحديث دوري للبيانات كل 24 ساعة
  try {
    console.log('🔄 Service Worker: Periodic data update started');
    // يمكن إضافة منطق التحديث الدوري هنا
  } catch (error) {
    console.log('❌ Service Worker: Periodic sync error', error);
  }
}

// نظام الرسائل للتحديث اليدوي
self.addEventListener('message', (event) => {
  console.log('📨 Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    console.log('✅ Service Worker: Skip waiting activated');
  }
  
  if (event.data && event.data.type === 'UPDATE_DATA') {
    console.log('🔄 Service Worker: Manual data update requested');
    event.waitUntil(forceDataUpdate());
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('🗑️ Service Worker: Clearing cache requested');
    event.waitUntil(clearDynamicCache());
  }
});

// إجبار تحديث البيانات
async function forceDataUpdate() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    
    const updatePromises = keys.map(async (request) => {
      if (request.url.includes('supabase.co')) {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            await cache.put(request, networkResponse.clone());
            console.log('✅ Service Worker: Force updated -', request.url);
          }
        } catch (error) {
          console.log('❌ Service Worker: Force update failed for -', request.url);
        }
      }
    });
    
    await Promise.all(updatePromises);
    
    // إرسال رسالة للعملاء بتحديث البيانات
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'DATA_UPDATED',
        message: 'All data has been updated'
      });
    });
    
  } catch (error) {
    console.log('❌ Service Worker: Force update error', error);
  }
}

// تنظيف الكاش الديناميكي
async function clearDynamicCache() {
  try {
    await caches.delete(CACHE_NAME);
    console.log('✅ Service Worker: Dynamic cache cleared');
    
    // إرسال رسالة للعملاء
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'CACHE_CLEARED',
        message: 'Dynamic cache has been cleared'
      });
    });
    
  } catch (error) {
    console.log('❌ Service Worker: Clear cache error', error);
  }
}

// نظام التعامل مع Push Notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    console.log('🔔 Service Worker: Push notification received', data);
    
    const options = {
      body: data.body || 'New update available',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'skillzoy-update',
      renotify: true,
      actions: [
        {
          action: 'update',
          title: 'Update Now'
        },
        {
          action: 'close',
          title: 'Close'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Skillzoy Academy', options)
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'update') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        if (clients.length > 0) {
          clients[0].focus();
          clients[0].postMessage({
            type: 'FORCE_REFRESH',
            message: 'Manual refresh requested'
          });
        } else {
          self.clients.openWindow('/');
        }
      })
    );
  }
});
