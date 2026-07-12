// ============================================================
// SERVICE WORKER — Sistema Discoteca PWA
// Offline support, caching, push notifications
// ============================================================

const CACHE_NAME = 'sistema-discoteca-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/database.js',
  '/js/dashboard.js',
  '/js/ventas.js',
  '/js/mesas.js',
  '/js/pedidos.js',
  '/js/caja.js',
  '/js/bar.js',
  '/js/cocina.js',
  '/js/usuarios.js',
  '/js/menu.js',
  '/js/navigation.js',
  '/js/utils.js',
  '/js/notifications.js',
  '/js/icons.js',
  '/audio/notification.wav',
  '/audio/cajera.wav',
  '/manifest.json'
];

const FIREBASE_ASSETS = [
  'https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.9.0/firebase-database-compat.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap'
];

// Install - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch - network first for API, cache first for static
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip Firebase realtime connections
  if (url.hostname.includes('firebaseio.com') || url.hostname.includes('googleapis.com')) {
    return;
  }
  
  // API requests - network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(event.request));
    return;
  }
  
  // Static assets - cache first
  event.respondWith(cacheFirst(event.request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }
    throw err;
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    
    // Return offline response for API
    return new Response(JSON.stringify({ 
      error: 'offline', 
      message: 'Sin conexión. Los datos se sincronizarán al reconectar.' 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-pedidos') {
    event.waitUntil(syncPedidos());
  } else if (event.tag === 'sync-ventas') {
    event.waitUntil(syncVentas());
  }
});

async function syncPedidos() {
  const db = await openIndexedDB();
  const pending = await db.getAll('pendingPedidos');
  
  for (const pedido of pending) {
    try {
      const response = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedido)
      });
      
      if (response.ok) {
        await db.delete('pendingPedidos', pedido.id);
      }
    } catch (err) {
      console.log('[SW] Sync failed for pedido:', pedido.id);
    }
  }
}

async function syncVentas() {
  const db = await openIndexedDB();
  const pending = await db.getAll('pendingVentas');
  
  for (const venta of pending) {
    try {
      const response = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(venta)
      });
      
      if (response.ok) {
        await db.delete('pendingVentas', venta.id);
      }
    } catch (err) {
      console.log('[SW] Sync failed for venta:', venta.id);
    }
  }
}

// IndexedDB helper
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SistemaDiscotecaOffline', 1);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingPedidos')) {
        db.createObjectStore('pendingPedidos', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pendingVentas')) {
        db.createObjectStore('pendingVentas', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Push notifications
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.mensaje || 'Nueva notificación',
    icon: '/manifest.json',
    badge: '/manifest.json',
    vibrate: [200, 100, 200],
    tag: data.tipo || 'notification',
    data: {
      pedidoId: data.pedidoId,
      url: data.url || '/'
    },
    actions: [
      { action: 'view', title: 'Ver' },
      { action: 'dismiss', title: 'Cerrar' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.titulo || 'Sistema Discoteca', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then(clientList => {
          for (const client of clientList) {
            if (client.url.includes(event.notification.data.url) && 'focus' in client) {
              return client.focus();
            }
          }
          return clients.openWindow(event.notification.data.url);
        })
    );
  }
});

// Message from main thread
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data?.type === 'cache-pedido') {
    cachePedidoOffline(event.data.pedido);
  }
  
  if (event.data?.type === 'cache-venta') {
    cacheVentaOffline(event.data.venta);
  }
});

async function cachePedidoOffline(pedido) {
  const db = await openIndexedDB();
  await db.put('pendingPedidos', { ...pedido, id: Date.now(), timestamp: Date.now() });
  
  // Register background sync
  const registration = await self.registration.sync.register('sync-pedidos');
}

async function cacheVentaOffline(venta) {
  const db = await openIndexedDB();
  await db.put('pendingVentas', { ...venta, id: Date.now(), timestamp: Date.now() });
  
  const registration = await self.registration.sync.register('sync-ventas');
}

console.log('[SW] Service Worker loaded');