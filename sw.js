const VERSION = 'cocotte-v5';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css', 'css/fonts.css', 'fonts/jakarta.woff2', 'fonts/bricolage.woff2',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png',
  'vendor/preact.module.js', 'vendor/hooks.module.js', 'vendor/htm.module.js',
  'js/boot.js', 'js/main.js', 'js/store.js', 'js/actions.js',
  'js/lib/h.js', 'js/lib/dates.js', 'js/lib/engine.js', 'js/lib/ticket.js', 'js/lib/toast.js', 'js/lib/off.js', 'js/lib/scanner.js',
  'js/data/ingredients.js', 'js/data/products.js', 'js/data/recipes.js', 'js/data/seed.js',
  'js/components/ui.js', 'js/components/icons.js', 'js/components/RecipeSheet.js', 'js/components/RecipeEditor.js', 'js/components/ProductSearch.js',
  'js/views/WeekView.js', 'js/views/ShoppingView.js', 'js/views/RecipesView.js', 'js/views/ProfileView.js', 'js/views/Onboarding.js',
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

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(request, { ignoreSearch: true });
      const network = fetch(request).then((res) => {
        if (res.ok && res.type === 'basic') cache.put(request, res.clone());
        return res;
      }).catch(() => cached || cache.match('index.html'));
      return cached ? (e.waitUntil(network), cached) : network;
    })
  );
});
