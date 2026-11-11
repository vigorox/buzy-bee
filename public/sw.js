// 导入版本配置
importScripts('./version.js');

// Service Worker for PWA
// ⚠️ IMPORTANT: Update version in version.js to force cache update!
const CACHE_NAME = `buzybee-v${APP_VERSION}`;
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './dialog.js',
  './decks.js',
  './version.js',
  './assets/icon/buzy-bee-icon-512.png',
  './assets/icon/buzy-bee-icon-256.png',
  './assets/icon/buzy-bee-icon-192.png',
  './assets/icon/buzy-bee.svg',
  './assets/icon/buzy-bee-happy.svg',
  './assets/icon/buzy-bee-sad.svg',
  './manifest.json'
];

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...', CACHE_NAME);
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache:', CACHE_NAME);
        // cache: 'reload' skips the HTTP cache (GitHub Pages sends max-age=600), so the new
        // cache never ends up holding stale copies of the files
        return cache.addAll(urlsToCache.map((url) => new Request(url, { cache: 'reload' })));
      })
  );
});

// Fetch event - Network first, then cache (better for Safari updates)
self.addEventListener('fetch', (event) => {
  // Only handle GET requests; let everything else go straight to the network
  if (event.request.method !== 'GET') return;

  event.respondWith(
    // cache: 'no-cache' → always revalidate with the server instead of trusting the
    // HTTP cache, so "network first" really is network first
    fetch(event.request, { cache: 'no-cache' })
      .then((response) => {
        // Only keep good responses
        if (response.ok) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }

        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  // Take control of all pages immediately
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});
