const CACHE_NAME = 'cat-messenger-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/base.css',
  '/css/sidebar.css',
  '/css/chat.css',
  '/css/messages.css',
  '/css/input.css',
  '/css/emoji.css',
  '/css/context-menu.css',
  '/css/typing.css',
  '/css/reactions.css',
  '/css/voice.css',
  '/css/profile.css',
  '/css/modals.css',
  '/css/responsive.css',
  '/js/app.js',
  '/js/state.js',
  '/js/api.js',
  '/js/utils/helpers.js',
  '/js/ui/sidebar.js',
  '/js/ui/chat.js',
  '/js/ui/messages.js',
  '/js/ui/input.js',
  '/js/ui/emoji.js',
  '/js/ui/context-menu.js',
  '/js/ui/swipe.js',
  '/js/ui/profile.js',
  '/js/ui/modals.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
