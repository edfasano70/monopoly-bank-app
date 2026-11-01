const VERSION = '1.0.9';
const CACHE_NAME = 'monopoly-wallet-' + VERSION;
const OFFLINE_URL = '/offline.html';
const APP_SHELL = [
  OFFLINE_URL,
  '/manifest.json',
  '/icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-180.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/assets/tailwind.js?v=' + VERSION,
  '/assets/js/common.js?v=' + VERSION,
  '/assets/js/reasons.js?v=' + VERSION,
  '/assets/js/bank.js?v=' + VERSION,
  '/assets/js/player.js?v=' + VERSION,
  '/assets/js/qrcode.js?v=' + VERSION,
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(APP_SHELL);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (key) {
              return key !== CACHE_NAME;
            })
            .map(function (key) {
              return caches.delete(key);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

function isApiRequest(url) {
  return url.pathname.indexOf('/api/') === 0;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then(function (response) {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(function () {
      return null;
    });

  if (cached) {
    return cached;
  }

  const response = await networkPromise;
  return (
    response ||
    new Response('Recurso no disponible sin conexión', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  );
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      return response;
    }
  } catch (err) {
    void err;
  }

  const offline = await caches.match(OFFLINE_URL);
  return (
    offline ||
    new Response('Sin conexión', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  );
}

self.addEventListener('fetch', function (event) {
  const request = event.request;
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }
  if (isApiRequest(url)) {
    return;
  }
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
