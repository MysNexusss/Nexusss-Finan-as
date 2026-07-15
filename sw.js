// Service Worker básico da Caderneta — existe só para permitir a instalação
// do site como app (PWA) e dar um cache leve do "esqueleto" da página.
// Chamadas ao Supabase (outra origem) NUNCA são cacheadas: sempre vão
// direto para a rede, para os dados nunca ficarem desatualizados.

const CACHE_NAME = 'caderneta-shell-v1';
const APP_SHELL = ['./', './index.html', './manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {}) // não trava a instalação se algum arquivo não existir
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Só cuida de requisições GET da própria origem (o app shell).
  // Tudo que for de outra origem (ex.: Supabase) passa direto, sem cache.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
