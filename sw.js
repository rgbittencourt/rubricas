// Service Worker — Gerador de Rubricas · INOVALAB
// Página (HTML): rede primeiro, cache como reserva offline → atualizações chegam sem trocar a versão.
// Demais arquivos estáticos: cache primeiro, atualizado em segundo plano.
// /api/*: nunca passa pelo cache.
const CACHE = 'rubricas-inovalab-v7';
const ASSETS = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

function guardar(req, resp) {
  if (resp && resp.ok && resp.type === 'basic') {
    const copia = resp.clone();
    caches.open(CACHE).then(c => c.put(req, copia));
  }
  return resp;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || url.pathname.startsWith('/api/')) return;

  if (req.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(req).then(r => guardar(req, r))
        .catch(() => caches.match(req).then(c => c || caches.match('/index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(cached => {
      const rede = fetch(req).then(r => guardar(req, r)).catch(() => cached);
      return cached || rede;
    })
  );
});
