// TechSoftware.digital Portal - High-Performance Service Worker
// Implements strategic caching for static assets, offline fallback, and SPA resilience

const CACHE_VERSION = 'tsd-v2';
const STATIC_CACHE = `tsd-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `tsd-runtime-${CACHE_VERSION}`;
const FONT_CACHE = `tsd-fonts-${CACHE_VERSION}`;

// Core static assets to precache immediately during service worker installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/logo.jpg'
];

// Maximum items to keep in runtime cache to avoid storage bloat
const MAX_RUNTIME_ITEMS = 60;

// Helper: Trim cache to max items
async function trimCache(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      await cache.delete(keys[0]);
      trimCache(cacheName, maxItems);
    }
  } catch (err) {
    // Graceful silent ignore
  }
}

// Installation: Precache core app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      // Precache assets individually to ensure one missing file doesn't fail the entire install
      for (const asset of PRECACHE_ASSETS) {
        try {
          const response = await fetch(asset, { cache: 'no-cache' });
          if (response && response.ok) {
            await cache.put(asset, response);
          }
        } catch (err) {
          console.warn(`[SW] Precache skipped for ${asset}:`, err.message);
        }
      }
    })
  );
  // Force activating the newly installed service worker without waiting for old clients to close
  self.skipWaiting();
});

// Activation: Clean up deprecated cache versions
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, RUNTIME_CACHE, FONT_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !currentCaches.includes(name))
          .map((name) => {
            console.log(`[SW] Purging outdated cache: ${name}`);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Caching strategies tailored to asset type
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle HTTP/HTTPS GET requests
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Skip browser extensions or special internal protocols
  if (!url.protocol.startsWith('http')) return;

  // Bypass API calls, Firebase services, and backend endpoints (Network Only)
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('cloudfunctions.net')
  ) {
    return;
  }

  // Strategy 1: HTML Navigations (Single Page App)
  // Try Network first for freshest index.html, fallback to cached /index.html if offline
  if (request.mode === 'navigate' || (request.headers.get('accept') && request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cachedNavigate = await caches.match(request);
          if (cachedNavigate) return cachedNavigate;
          // SPA fallback to /index.html
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // Strategy 2: Google Fonts & Web Fonts (Cache First with Long-Term Storage)
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.open(FONT_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) return cachedResponse;

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          return cachedResponse;
        }
      })
    );
    return;
  }

  // Strategy 3: Static Assets (JS, CSS, Images, Icons, SVGs)
  // Stale-While-Revalidate: Return cached copy immediately for instant load,
  // while updating the cache in the background for next time.
  const isStaticAsset =
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    url.pathname.includes('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
              const clone = networkResponse.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, clone);
                trimCache(RUNTIME_CACHE, MAX_RUNTIME_ITEMS);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse); // If network fails, stick to cached response

        // Return cached version if found, otherwise await network
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Default Strategy: Network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Support manual skipWaiting message from client if update banner is clicked
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
