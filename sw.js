// Service Worker — Sessanio PWA
// Versión: incrementar para forzar actualización del caché
var CACHE_NAME = 'sessanio-v1';
var ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instalar: cachear todos los assets
self.addEventListener('install', function(ev){
  ev.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activar: limpiar cachés viejos
self.addEventListener('activate', function(ev){
  ev.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: cache-first (funciona 100% offline)
self.addEventListener('fetch', function(ev){
  // Solo interceptar requests del mismo origen
  if(ev.request.url.indexOf(self.location.origin) !== 0) return;
  ev.respondWith(
    caches.match(ev.request).then(function(cached){
      if(cached) return cached;
      return fetch(ev.request).then(function(response){
        // Guardar en caché si es válido
        if(response && response.status === 200 && response.type === 'basic'){
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache){
            cache.put(ev.request, clone);
          });
        }
        return response;
      }).catch(function(){
        // Sin red y sin caché → nada que hacer
        return new Response('Sin conexión', {status: 503});
      });
    })
  );
});
