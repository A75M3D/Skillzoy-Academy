const CACHE_NAME = 'skillzoy-auto-update-v1';
const STATIC_CACHE = 'skillzoy-static-auto-v1';

// الملفات الثابتة التي نريد تخزينها
const staticAssets = [
  '/',
  '/manifest.json',
  '/style.css',
  '/login.html',
  '/register.html',
];

// ⚡ نظام التحديث التلقائي بدون تغيير رقم الإصدار
class AutoUpdateManager {
  constructor() {
    this.lastContentHash = null;
    this.updateCheckInterval = null;
  }

  async getContentHash() {
    try {
      // محاولة جلب hash للمحتوى من الخادم
      const response = await fetch('/api/content-hash?' + Date.now());
      if (response.ok) {
        return await response.text();
      }
    } catch (error) {
      // إذا فشل، نستخدم timestamp كبديل
      return Date.now().toString();
    }
    return Date.now().toString();
  }

  async checkForUpdates() {
    try {
      const currentHash = await this.getContentHash();
      
      if (this.lastContentHash && this.lastContentHash !== currentHash) {
        console.log('🔄 AutoUpdate: New content detected!');
        this.handleContentUpdate();
      }
      
      this.lastContentHash = currentHash;
    } catch (error) {
      console.log('❌ AutoUpdate: Check failed', error);
    }
  }

  handleContentUpdate() {
    // إرسال إشعار لجميع العملاء
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'CONTENT_UPDATED',
          message: 'New content is available',
          timestamp: new Date().toISOString()
        });
      });
    });

    // تنظيف الكاش القديم وتحديثه
    this.refreshCaches();
  }

  async refreshCaches() {
    try {
      console.log('🔄 AutoUpdate: Refreshing caches...');
      
      // تنظيف جميع الكاشات القديمة
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );

      // إعادة تخزين الملفات الثابتة
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(staticAssets);

      console.log('✅ AutoUpdate: Caches refreshed successfully');
    } catch (error) {
      console.error('❌ AutoUpdate: Cache refresh failed', error);
    }
  }

  start() {
    console.log('🚀 AutoUpdate Manager Started');
    
    // التحقق من التحديثات كل دقيقتين
    this.updateCheckInterval = setInterval(() => {
      this.checkForUpdates();
    }, 2 * 60 * 1000);

    // تحقق أولي بعد 10 ثوانٍ
    setTimeout(() => this.checkForUpdates(), 10000);
  }

  stop() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
    }
  }
}

// تهيئة مدير التحديث التلقائي
const autoUpdateManager = new AutoUpdateManager();

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
    ]).then(() => {
      console.log('✅ Service Worker: Installation complete');
    })
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
      self.clients.claim(),
      
      // بدء نظام التحديث التلقائي
      autoUpdateManager.start()
    ]).then(() => {
      console.log('🎯 Service Worker: Ready with auto-updates');
    })
  );
});

// 🎯 إستراتيجية التخزين المؤقت الذكية المحسنة
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // ⚡ استراتيجية التحديث الفوري لبيانات Supabase
  if (this.isSupabaseRequest(url) || this.isDynamicDataRequest(request)) {
    event.respondWith(this.supabaseFirstStrategy(request));
    return;
  }

  // 📄 استراتيجية التحديث الذكي للصفحات
  if (this.isHtmlRequest(request)) {
    event.respondWith(this.htmlStrategy(request));
    return;
  }

  // 🎨 استراتيجية Stale-While-Revalidate للأصول الثابتة
  if (this.isStaticAssetRequest(request)) {
    event.respondWith(this.staleWhileRevalidateStrategy(request));
    return;
  }

  // استراتيجية افتراضية
  event.respondWith(this.networkFirstStrategy(request));
});

// 🎯 مساعدات تحديد نوع الطلب
isSupabaseRequest(url) {
  return url.href.includes('supabase.co') || 
         url.href.includes('/api/') ||
         url.hostname.includes('api.');
}

isDynamicDataRequest(request) {
  return request.headers.get('Accept')?.includes('application/json') ||
         request.method === 'POST' ||
         request.method === 'PUT' ||
         request.method === 'DELETE';
}

isHtmlRequest(request) {
  return request.destination === 'document' ||
         request.headers.get('Accept')?.includes('text/html');
}

isStaticAssetRequest(request) {
  return request.destination === 'style' || 
         request.destination === 'script' || 
         request.destination === 'image' ||
         request.destination === 'font';
}

// ⚡ استراتيجية Supabase First (التحديث الفوري)
async function supabaseFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    console.log('🌐 Service Worker: Fresh Supabase request -', request.url);
    
    // محاولة جلب البيانات الجديدة أولاً
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      // تخزين الاستجابة الجديدة فوراً
      await cache.put(request, networkResponse.clone());
      console.log('✅ Service Worker: Fresh data cached -', request.url);
      
      // إرسال إشعار بتحديث البيانات
      this.notifyDataUpdate(request.url);
      
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    console.log('❌ Service Worker: Network failed, trying cache -', request.url);
    
    // استخدام البيانات المخزنة مع علامة أنها قديمة
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('💾 Service Worker: Serving stale data -', request.url);
      
      // إضافة header يشير إلى أن البيانات قديمة
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-Data-Stale', 'true');
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers
      });
    }
    
    // إذا لم توجد بيانات مخزنة
    return new Response(
      JSON.stringify({ error: 'Offline - No data available' }), 
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// 📄 استراتيجية HTML الذكية
async function htmlStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // محاولة جلب الصفحة الجديدة أولاً
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      // تحديث الكاش بالصفحة الجديدة
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    // استخدام الصفحة المخزنة
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // الصفحة الافتراضية للإنترنت غير متوفر
    return new Response(this.getOfflinePage(), {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// 🎨 استراتيجية Stale-While-Revalidate
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // إرجاع البيانات المخزنة فوراً إذا كانت موجودة
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // تحديث الكاش في الخلفية
    this.updateCacheInBackground(request, cache);
    return cachedResponse;
  }
  
  // إذا لم تكن موجودة في الكاش، جلبها من الشبكة
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return new Response('Resource not available', { status: 503 });
  }
}

// 🔄 تحديث الكاش في الخلفية
async function updateCacheInBackground(request, cache) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      await cache.put(request, networkResponse.clone());
      console.log('✅ Service Worker: Background cache updated -', request.url);
    }
  } catch (error) {
    console.log('❌ Service Worker: Background update failed -', request.url);
  }
}

// 🌐 استراتيجية Network First الأساسية
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Offline - No cached version available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// 📢 نظام الإشعارات الداخلية
function notifyDataUpdate(url) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'DATA_UPDATED',
        source: url,
        timestamp: new Date().toISOString(),
        message: 'New data is available'
      });
    });
  });
}

// 📄 صفحة الإنترنت غير متوفر
function getOfflinePage() {
  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Skillzoy Academy - غير متصل</title>
        <style>
            body { 
                font-family: 'Cairo', sans-serif; 
                background: linear-gradient(135deg, #0f172a, #1e293b);
                color: white;
                text-align: center;
                padding: 50px 20px;
            }
            .container { max-width: 500px; margin: 0 auto; }
            h1 { color: #f59e0b; margin-bottom: 20px; }
            p { margin-bottom: 30px; opacity: 0.8; }
            .icon { font-size: 64px; margin-bottom: 20px; }
            button { 
                background: #3b82f6; 
                color: white; 
                border: none; 
                padding: 12px 24px; 
                border-radius: 8px; 
                cursor: pointer;
                font-family: 'Cairo', sans-serif;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="icon">📶</div>
            <h1>أنت غير متصل بالإنترنت</h1>
            <p>تعذر الاتصال بالإنترنت. يرجى التحقق من اتصالك والمحاولة مرة أخرى.</p>
            <button onclick="window.location.reload()">إعادة المحاولة</button>
        </div>
    </body>
    </html>
  `;
}

// 🔄 نظام التحديث الذكي للبيانات
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Service Worker: Background sync triggered');
    event.waitUntil(this.doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    
    const supabaseRequests = keys.filter(request => 
      this.isSupabaseRequest(new URL(request.url))
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

// 📨 نظام الرسائل المتقدم
self.addEventListener('message', (event) => {
  console.log('📨 Service Worker: Message received', event.data);
  
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      console.log('✅ Service Worker: Skip waiting activated');
      break;
      
    case 'UPDATE_DATA':
      console.log('🔄 Service Worker: Manual data update requested');
      event.waitUntil(this.forceDataUpdate());
      break;
      
    case 'CLEAR_CACHE':
      console.log('🗑️ Service Worker: Clearing cache requested');
      event.waitUntil(this.clearDynamicCache());
      break;
      
    case 'CHECK_UPDATES':
      console.log('🔍 Service Worker: Manual update check requested');
      autoUpdateManager.checkForUpdates();
      break;
      
    case 'GET_CACHE_INFO':
      this.sendCacheInfo(event.source);
      break;
  }
});

// 🔄 إجبار تحديث البيانات
async function forceDataUpdate() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    
    const updatePromises = keys.map(async (request) => {
      if (this.isSupabaseRequest(new URL(request.url)) || 
          this.isDynamicDataRequest(request)) {
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
        message: 'All data has been forcefully updated',
        timestamp: new Date().toISOString()
      });
    });
    
  } catch (error) {
    console.log('❌ Service Worker: Force update error', error);
  }
}

// 🗑️ تنظيف الكاش الديناميكي
async function clearDynamicCache() {
  try {
    await caches.delete(CACHE_NAME);
    console.log('✅ Service Worker: Dynamic cache cleared');
    
    // إعادة إنشاء الكاش الفارغ
    await caches.open(CACHE_NAME);
    
    // إرسال رسالة للعملاء
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'CACHE_CLEARED',
        message: 'Dynamic cache has been cleared and recreated',
        timestamp: new Date().toISOString()
      });
    });
    
  } catch (error) {
    console.log('❌ Service Worker: Clear cache error', error);
  }
}

// 📊 إرسال معلومات الكاش
async function sendCacheInfo(client) {
  try {
    const cacheNames = await caches.keys();
    const cacheInfo = {};
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      cacheInfo[cacheName] = {
        size: keys.length,
        urls: keys.slice(0, 10).map(req => req.url) // أول 10 عناصر فقط
      };
    }
    
    client.postMessage({
      type: 'CACHE_INFO',
      data: cacheInfo,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.log('❌ Service Worker: Cache info error', error);
  }
}

// 🔔 نظام التعامل مع Push Notifications المحسن
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
      data: data.data || {},
      actions: [
        {
          action: 'update',
          title: 'Update Now'
        },
        {
          action: 'view',
          title: 'View Details'
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
            message: 'Manual refresh requested from notification'
          });
        } else {
          self.clients.openWindow('/');
        }
      })
    );
  } else if (event.action === 'view') {
    event.waitUntil(
      self.clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// 🎯 تهيئة إضافية عند التحميل
self.addEventListener('load', () => {
  console.log('🎯 Service Worker: Fully loaded with auto-update system');
});

// جعل الدوال متاحة للاستخدام
self.autoUpdateManager = autoUpdateManager;
