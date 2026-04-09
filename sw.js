const CACHE = 'breathe-v2';
const ASSETS = [
  '/breathe-free-/',
  '/breathe-free-/index.html',
  '/breathe-free-/css/app.css',
  '/breathe-free-/js/data.js',
  '/breathe-free-/js/storage.js',
  '/breathe-free-/js/app.js',
  '/breathe-free-/manifest.json',
  '/breathe-free-/icons/icon-192.png',
  '/breathe-free-/icons/icon-512.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('/breathe-free-/')))
  );
});
