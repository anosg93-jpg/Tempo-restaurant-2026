const CACHE_NAME = 'tempo-restaurant-v2'; // عند تغيير الرقم هنا مستقبلاً يمسح الكاش القديم تلقائياً
const ASSETS_TO_CACHE = [
  'index.html',
  'manifest.json',
  'images/logotempo.png'
];

// تثبيت الـ Service Worker وحفظ الملفات الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting()) // تفعيل الكود الجديد فوراً دون انتظار إغلاق المتصفح
  );
});

// تنظيف الكاش القديم عند تحديث الملف
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // السيطرة على كل الصفحات المفتوحة وتحديثها فوراً
  );
});

// إدارة الطلبات (الإنترنت أولاً لضمان التحديث التلقائي الفوري للزبون)
self.addEventListener('fetch', (event) => {
  // عدم عمل كاش لطلبات ملف الـ CSV الخاص بجوجل شيت لضمان تحديث الأسعار والمنيو فوراً في كل لحظة
  if (event.request.url.includes('docs.google.com')) {
    return event.respondWith(fetch(event.request));
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // إذا كان هناك إنترنت، خذ نسخة حديثة من الملفات وضعها في الكاش لفتحها لاحقاً بسرعة
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // إذا انقطع الإنترنت تماماً، قم بتحميل المنيو والأبلكيشن من الكاش المخزن
        return caches.match(event.request);
      })
  );
});
