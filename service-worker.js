// 🚀 Enhanced Service Worker - Universal Resource Caching
// Version: 2.0.1 | Intelligent Multi-Layer Caching Strategy
// Stale-While-Revalidate + Progressive Cache Management
// ✨ v2.0.1: Improved Google Fonts caching + DNS error handling

const CACHE_VERSION = '2.0.1';
const CACHE_NAMES = {
  CORE: `knm-yassa-core-v${CACHE_VERSION}`,      // HTML, CSS, JS includes
  IMAGES: `knm-yassa-images-v${CACHE_VERSION}`,  // JPG, PNG, WebP, SVG
  FONTS: `knm-yassa-fonts-v${CACHE_VERSION}`,    // Google Fonts, local fonts
  ICONS: `knm-yassa-icons-v${CACHE_VERSION}`,    // Font Awesome, SVG icons
  EXTERNAL: `knm-yassa-external-v${CACHE_VERSION}` // External CDN libs
};

const CRITICAL_ASSETS = [
  'assets/includes/header.html',
  'assets/includes/footer.html',
  'assets/css/variables.css',
  'assets/css/styles.css',
  'assets/js/main.js',
  // Pre-cache Google Fonts CSS (fonts themselves will be cached on demand)
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,500&display=swap'
];

// Cache strategies configuration
const CACHE_STRATEGIES = {
  // Images: Serve from cache first, update in background
  IMAGES: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  // Fonts: Aggressive caching (fonts never change often)
  FONTS: ['.woff', '.woff2', '.ttf', '.otf', '.eot'],
  // Icons: Medium caching
  ICONS: ['fontawesome', 'icon', '.ico'],
  // External: Cache CDN libraries
  EXTERNAL: ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'kit.fontawesome.com']
};

// Installation: Pre-cache critical assets only (lazy cache others)
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker v' + CACHE_VERSION + ' installing...');
  
  event.waitUntil(
    // Cache only critical assets on install
    caches.open(CACHE_NAMES.CORE).then((cache) => {
      console.log('📦 Pre-caching core assets...');
      return cache.addAll(CRITICAL_ASSETS).catch((err) => {
        console.warn('⚠️ Error pre-caching critical assets:', err);
        // Continue even if some assets fail
      });
    })
  );
  
  self.skipWaiting();
});

// Activation: Clean up old cache versions
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker v' + CACHE_VERSION + ' activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old versions of all cache types
          const isOldVersion = !Object.values(CACHE_NAMES).includes(cacheName);
          if (isOldVersion) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// ════════════════════════════════════════════════════════════
// FETCH EVENT - Multi-Strategy Caching
// ════════════════════════════════════════════════════════════

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests (handle internally only)
  if (url.origin !== location.origin && !isExternalCDN(url.origin)) {
    return;
  }

  // Determine resource type and apply appropriate strategy
  const resourceType = getResourceType(request.url);

  // ═══════════════════════════════════════════════════════
  // STRATEGY 1: CRITICAL ASSETS - Cache First (most aggressive)
  // HTML includes, CSS, JS core
  // ═══════════════════════════════════════════════════════
  if (
    request.url.includes('assets/includes/') ||
    request.url.includes('assets/css/') ||
    (request.url.includes('assets/js/') && !request.url.includes('service-worker'))
  ) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.CORE));
  }

  // ═══════════════════════════════════════════════════════
  // STRATEGY 2: IMAGES - Stale-While-Revalidate (best UX)
  // Serve from cache instantly, update in background
  // ═══════════════════════════════════════════════════════
  else if (resourceType === 'IMAGE') {
    event.respondWith(staleWhileRevalidateStrategy(request, CACHE_NAMES.IMAGES));
  }

  // ═══════════════════════════════════════════════════════
  // STRATEGY 3: FONTS - Cache First (fonts = permanent)
  // Font files rarely change and are safe to cache aggressively
  // ═══════════════════════════════════════════════════════
  else if (resourceType === 'FONT') {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.FONTS));
  }

  // ═══════════════════════════════════════════════════════
  // STRATEGY 4: ICONS & ASSETS - Network First
  // Try network, fallback to cache if offline
  // ═══════════════════════════════════════════════════════
  else if (resourceType === 'ICON' || resourceType === 'ASSET') {
    event.respondWith(networkFirstStrategy(request, CACHE_NAMES.ICONS));
  }

  // ═══════════════════════════════════════════════════════
  // STRATEGY 5: EXTERNAL CDN (Fonts, Font Awesome) - Stale-While-Revalidate
  // ═══════════════════════════════════════════════════════
  else if (isExternalCDN(url.origin)) {
    event.respondWith(staleWhileRevalidateStrategy(request, CACHE_NAMES.EXTERNAL));
  }

  // ═══════════════════════════════════════════════════════
  // STRATEGY 6: HTML PAGES - Network First
  // Always try to get fresh version, fallback to cache
  // ═══════════════════════════════════════════════════════
  else if (request.method === 'GET' && request.destination === 'document') {
    event.respondWith(networkFirstStrategy(request, CACHE_NAMES.CORE));
  }
});

// ════════════════════════════════════════════════════════════
// CACHING STRATEGIES
// ════════════════════════════════════════════════════════════

/**
 * CACHE FIRST: Use cache, only fetch if not cached
 * Best for: Static assets that don't change often (CSS, JS, Fonts)
 */
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    // Hit! Return from cache and update in background
    updateCacheInBackground(request, cacheName);
    return cached;
  }

  // Not in cache, fetch from network
  try {
    const response = await fetch(request);
    
    if (response && response.status === 200 && response.type !== 'error') {
      const responseClone = response.clone();
      cache.put(request, responseClone);
    }
    
    return response;
  } catch (error) {
    console.warn('Fetch failed for:', request.url, error);
    return cache.match(request) || createErrorResponse();
  }
}

/**
 * STALE WHILE REVALIDATE: Return cache immediately, fetch in background
 * Best for: Images, CDN assets that update occasionally
 * UX Impact: INSTANT response, no loading delays
 */
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Return cached response immediately
  const cachedPromise = cached || null;

  // Fetch fresh version in background
  const fetchPromise = fetch(request).then((response) => {
    if (response && response.status === 200 && response.type !== 'error') {
      const responseClone = response.clone();
      cache.put(request, responseClone);
    }
    return response;
  }).catch(() => cached || createErrorResponse());

  // Return cached version immediately if available
  return cachedPromise || fetchPromise;
}

/**
 * NETWORK FIRST: Try network first, fallback to cache
 * Best for: HTML pages, API data, frequently updated content
 */
async function networkFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    // Try network first
    const response = await fetch(request);
    
    if (response && response.status === 200 && response.type !== 'error') {
      const responseClone = response.clone();
      cache.put(request, responseClone);
    }
    
    return response;
  } catch (error) {
    // Network failed, use cache
    const cached = await cache.match(request);
    if (cached) {
      console.log('📦 Offline: Using cached version of', request.url);
      return cached;
    }
    
    return createErrorResponse();
  }
}

// ════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ════════════════════════════════════════════════════════════

/**
 * Update cache in background without blocking user
 */
function updateCacheInBackground(request, cacheName) {
  fetch(request).then((response) => {
    if (response && response.status === 200 && response.type !== 'error') {
      caches.open(cacheName).then((cache) => {
        cache.put(request, response);
        console.log('🔄 Updated cache:', request.url);
      });
    }
  }).catch(() => {
    // Silent failure - user already has cached version
  });
}

/**
 * Detect resource type from URL
 */
function getResourceType(url) {
  if (CACHE_STRATEGIES.IMAGES.some(ext => url.includes(ext))) return 'IMAGE';
  if (CACHE_STRATEGIES.FONTS.some(ext => url.includes(ext))) return 'FONT';
  if (CACHE_STRATEGIES.ICONS.some(keyword => url.includes(keyword))) return 'ICON';
  return 'ASSET';
}

/**
 * Check if URL is an external CDN we want to cache
 */
function isExternalCDN(origin) {
  const allowedCDNs = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'kit.fontawesome.com',
    'cdn.jsdelivr.net',
    'unpkg.com'
  ];
  return allowedCDNs.some(cdn => origin.includes(cdn));
}

/**
 * Create fallback error response
 */
function createErrorResponse() {
  return new Response('Offline - Resource not available', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: new Headers({
      'Content-Type': 'text/plain'
    })
  });
}

// ════════════════════════════════════════════════════════════
// MESSAGE HANDLER - Manual cache control
// ════════════════════════════════════════════════════════════

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_ALL_CACHE') {
    console.log('🗑️ Clearing all caches...');
    caches.keys().then((cacheNames) => {
      Promise.all(cacheNames.map(name => caches.delete(name)));
    });
  }
  
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    getCachesInfo().then((info) => {
      event.ports[0].postMessage(info);
    });
  }
});

/**
 * Get detailed info about all caches
 */
async function getCachesInfo() {
  const cacheNames = await caches.keys();
  const info = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    info[cacheName] = {
      count: keys.length,
      urls: keys.map(r => r.url)
    };
  }
  
  return info;
}
