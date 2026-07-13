// ============================================================
// SERVICE WORKER — Sistema Discoteca PWA
// Network-first: siempre busca la versión más nueva del servidor.
// Solo usa caché como respaldo cuando NO hay conexión (offline).
// ============================================================

const CACHE_NAME = 'sistema-discoteca-v7';
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

// Install — pre-cache static assets para soporte offline
self.addEventListener('install', event => {
  console.log('[SW] Instalando versión:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()) // Activar inmediatamente sin esperar
  );
});

// Activate — borrar TODOS los cachés antiguos y tomar control inmediato
self.addEventListener('activate', event => {
  console.log('[SW] Activando versión:', CACHE_NAME);
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Borrando caché antigua:', key);
            return caches.delete(key);
          })
      ))
      .then(() => self.clients.claim()) // Tomar control de todas las pestañas
  );
});

// Fetch — NETWORK FIRST para TODO (excepto Firebase)
// Siempre intenta descargar la versión nueva del servidor.
// Si falla (sin internet), devuelve la copia cacheada.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Ignorar peticiones que no sean GET
  if (event.request.method !== 'GET') return;

  // Ignorar conexiones Firebase Realtime DB (WebSocket)
  if (url.hostname.includes('firebaseio.com')) return;

  // Ignorar Google APIs (fonts, Firebase SDK)
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com')) return;

  // Para TODOS los demás recursos: Network First
  event.respondWith(networkFirst(event.request));
});

async function networkFirst(request) {
  try {
    // 1. Intentar descargar del servidor (la versión MÁS NUEVA)
    const response = await fetch(request);
    if (response.ok) {
      // Guardar copia en caché para uso offline futuro
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // 2. Sin internet → devolver la copia cacheada
    const cached = await caches.match(request);
    if (cached) {
      console.log('[SW] Offline, sirviendo desde caché:', request.url);
      return cached;
    }

    // 3. Navegación sin caché → devolver index.html cacheado
    if (request.mode === 'navigate') {
      const fallback = await caches.match('/index.html');
      if (fallback) return fallback;
    }

    // 4. Sin nada → error offline
    return new Response('Sin conexión', { status: 503, statusText: 'Offline' });
  }
}

// Message handler — forzar actualización desde la app
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  if (event.data === 'forceUpdate') {
    // Limpiar todo el caché y reclamar clientes
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    ).then(() => {
      self.clients.claim();
      // Notificar a todos los clientes que recarguen
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage({ type: 'CACHE_CLEARED' }));
      });
    });
  }
});

// Push notifications
self.addEventListener('push', event => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.mensaje || 'Nueva notificación',
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

console.log('[SW] Service Worker cargado — versión:', CACHE_NAME);