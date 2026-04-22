// Дыши Свободно — Service Worker
// ⚠️  Обновляй CACHE_VERSION при каждом деплое — это сигнал браузеру загрузить новую версию
const CACHE_VERSION = '2026-04-22-1';
const CACHE_NAME = 'breathe-free-' + CACHE_VERSION;

const ASSETS = [
  '/breathe-free-/',
  '/breathe-free-/index.html',
  '/breathe-free-/manifest.json',
  '/breathe-free-/css/app.css',
  '/breathe-free-/js/data.js',
  '/breathe-free-/js/storage.js',
  '/breathe-free-/js/app.js',
  '/breathe-free-/icons/favicon.svg',
  '/breathe-free-/icons/icon-192.png',
  '/breathe-free-/icons/icon-512.png',
];

// ── Установка: кешируем все файлы, активируемся немедленно ──
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) { return cache.addAll(ASSETS); })
      .then(function() { return self.skipWaiting(); })
  );
});

// ── Активация: удаляем старые кеши и уведомляем страницу ──
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      var oldCaches = keys.filter(function(k) { return k !== CACHE_NAME; });
      var isUpdate = oldCaches.length > 0; // старые кеши = это обновление, а не первый запуск
      return Promise.all(oldCaches.map(function(k) { return caches.delete(k); }))
        .then(function() { return self.clients.claim(); })
        .then(function() {
          if (!isUpdate) return;
          // Сообщаем всем открытым вкладкам/окнам что нужно перезагрузиться
          return self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
            .then(function(clients) {
              clients.forEach(function(client) {
                client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
              });
            });
        });
    })
  );
});

// ── Запросы: сначала кеш, иначе сеть; новые ресурсы тоже кешируем ──
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
        }
        return response;
      }).catch(function() {
        // Офлайн fallback — главная страница
        return caches.match('/breathe-free-/');
      });
    })
  );
});
