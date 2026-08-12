const CACHE_NAME = 'shanshi-static-v20260812-d1-5';
const CORE_ASSETS = ['./', './index.html', './app.css'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // 只處理 GitHub Pages 同網域靜態檔，不碰 Cloudflare Worker API。
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match('./index.html') || await cache.match(request);
        const networkPromise = fetch(request).then(response => {
          if (response && response.ok) cache.put('./index.html', response.clone());
          return response;
        }).catch(() => null);
        return cached || await networkPromise || Response.error();
      })
    );
    return;
  }

  if (url.pathname.endsWith('/app.css') || url.pathname.endsWith('/index.html')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(request);
        const networkPromise = fetch(request).then(response => {
          if (response && response.ok) cache.put(request, response.clone());
          return response;
        }).catch(() => null);
        return cached || await networkPromise || Response.error();
      })
    );
  }
});
