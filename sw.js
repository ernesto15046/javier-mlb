// ============================================================
// SERVICE WORKER — Javier MLB App
// ============================================================
// Este archivo debe estar en la MISMA CARPETA que Javier_MLB_App.html
// Cuando la app está alojada en una URL (GitHub Pages, Netlify, etc.)
// este Service Worker:
//   ✅ Guarda la app en caché para uso offline
//   ✅ Detecta cuando Lorenzo sube una nueva versión
//   ✅ Muestra el banner "Actualización disponible" automáticamente
// ============================================================

const APP_VERSION  = '3.0';
const CACHE_NAME   = 'javier-mlb-v' + APP_VERSION;
const URLS_TO_CACHE = [
  './',
  './Javier_MLB_App.html',
];

// ── INSTALL: guardar en caché ─────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando versión', APP_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(URLS_TO_CACHE))
      .then(() => {
        console.log('[SW] Caché creado:', CACHE_NAME);
      })
  );
  // Activar inmediatamente sin esperar
  self.skipWaiting();
});

// ── ACTIVATE: limpiar cachés viejos ──────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando versión', APP_VERSION);
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Eliminando caché viejo:', key);
            return caches.delete(key);
          })
      );
    })
  );
  // Tomar control de todas las pestañas abiertas
  self.clients.claim();
});

// ── FETCH: servir desde caché, actualizar en background ──────────
self.addEventListener('fetch', (event) => {
  // Solo interceptar navegación (HTML principal)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Guardar la versión más reciente en caché
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
          return networkResponse;
        })
        .catch(() => {
          // Sin internet → servir desde caché
          console.log('[SW] Sin internet — sirviendo desde caché');
          return caches.match(event.request);
        })
    );
    return;
  }

  // Para otros recursos: caché primero
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});

// ── MESSAGE: recibir comando skipWaiting desde la app ────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] skipWaiting recibido — tomando control');
    self.skipWaiting();
  }
});
