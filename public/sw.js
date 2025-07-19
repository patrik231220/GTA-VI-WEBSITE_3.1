// Service Worker for caching and offline functionality
const CACHE_NAME = 'gta-vi-countdown-v1.2';
const STATIC_CACHE_NAME = 'gta-vi-static-v1.2';

// Resources to cache immediately
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css',
  '/TRANSPARENT_LOGO/GTA-6-Logo-PNG-from-Grand-Theft-Auto-VI-Transparent.webp',
  '/posters_background/poster1-optimized.webp',
  '/posters_background/poster2-optimized.webp'
];

// Dynamic resources to cache on first access
const DYNAMIC_CACHE_PATTERNS = [
  /\/AUDIO\/.+\.mp3$/,
  /\/src\/.+\.(js|ts|tsx)$/,
  /\/node_modules\/.+$/,
  /https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
  /https:\/\/connect\.mailerlite\.com\/api\/.*/
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_RESOURCES);
      }),
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => 
              cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE_NAME
            )
            .map((cacheName) => caches.delete(cacheName))
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests (MailerLite)
  if (url.hostname === 'connect.mailerlite.com') {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Network unavailable' }),
          { 
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // Handle static resources
  if (STATIC_RESOURCES.some(resource => request.url.includes(resource))) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          const responseClone = response.clone();
          caches.open(STATIC_CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }

  // Handle dynamic resources
  const isDynamicResource = DYNAMIC_CACHE_PATTERNS.some(pattern => 
    pattern.test(request.url)
  );

  if (isDynamicResource) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            // Serve from cache and update in background
            fetch(request).then((response) => {
              cache.put(request, response.clone());
            }).catch(() => {});
            return cachedResponse;
          }

          // Fetch and cache
          return fetch(request).then((response) => {
            if (response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }

  // Default: network first, cache fallback
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// Background sync for form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'mailerlite-submission') {
    event.waitUntil(
      // Retry failed form submissions
      retryFailedSubmissions()
    );
  }
});

async function retryFailedSubmissions() {
  // Implementation for retrying failed MailerLite submissions
  // This would work with IndexedDB to store failed submissions
  console.log('Retrying failed form submissions...');
}