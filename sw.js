// Service worker FitMus : app shell en cache + cache runtime (CDN, polices).
const VERSION = 'fitmus-v1';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css', 'icons/icon.svg',
  'js/main.js', 'js/store.js', 'js/actions.js', 'js/components/RecipeSheet.js', 'js/lib/h.js', 'js/lib/dates.js', 'js/lib/engine.js',
  'js/lib/ticket.js', 'js/lib/catalogProvider.js', 'js/lib/toast.js',
  'js/data/ingredients.js', 'js/data/catalog.js', 'js/data/recipes.js', 'js/data/seed.js',
  'js/components/ui.js', 'js/components/icons.js',
  'js/views/WeekView.js', 'js/views/ShoppingView.js', 'js/views/RecipesView.js', 'js/views/ProfileView.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Réseau d'abord pour les fichiers locaux (dev confortable), cache d'abord pour le CDN.
self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;
  if (sameOrigin) {
    e.respondWith(
      fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(request, copy));
        return res;
      }).catch(() => caches.match(request).then((r) => r || caches.match('index.html')))
    );
  } else {
    e.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(request, copy));
        return res;
      }))
    );
  }
});
