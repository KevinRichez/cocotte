const VERSION = 'cocotte-v8';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css', 'css/fonts.css', 'fonts/jakarta.woff2', 'fonts/bricolage.woff2',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png',
  'vendor/preact.module.js', 'vendor/hooks.module.js', 'vendor/htm.module.js',
  'js/boot.js', 'js/main.js', 'js/store.js', 'js/actions.js',
  'js/lib/h.js', 'js/lib/dates.js', 'js/lib/engine.js', 'js/lib/ticket.js', 'js/lib/toast.js', 'js/lib/off.js', 'js/lib/scanner.js', 'js/lib/ticketFile.js',
  'js/data/ingredients.js', 'js/data/products.js', 'js/data/recipes.js', 'js/data/seed.js',
  'js/components/ui.js', 'js/components/icons.js', 'js/components/RecipeSheet.js', 'js/components/RecipeEditor.js', 'js/components/ProductSearch.js',
  'js/views/WeekView.js', 'js/views/ShoppingView.js', 'js/views/RecipesView.js', 'js/views/ProfileView.js', 'js/views/Onboarding.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== 'cocotte-share').map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function receiveShare(request) {
  try {
    const form = await request.formData();
    const file = form.get('ticket');
    if (file && typeof file !== 'string' && file.size < 15 * 1024 * 1024) {
      const cache = await caches.open('cocotte-share');
      await cache.put('shared-ticket', new Response(file, { headers: { 'content-type': file.type || 'application/octet-stream', 'x-name': encodeURIComponent(file.name || 'ticket') } }));
    }
  } catch {}
  return Response.redirect('./?share=ticket', 303);
}

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);
  if (request.method === 'POST' && url.origin === self.location.origin && url.pathname.endsWith('/share-target')) {
    e.respondWith(receiveShare(request));
    return;
  }
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  const heavy = url.pathname.includes('/vendor/ocr/') || url.pathname.includes('/vendor/pdf/') || url.pathname.includes('/fonts/');
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(request, { ignoreSearch: true });
      if (heavy && cached) return cached;
      const network = fetch(request, { cache: 'no-cache' }).then((res) => {
        if (res.ok && res.type === 'basic') cache.put(request, res.clone());
        return res;
      });
      const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 3500));
      try {
        const res = await (cached ? Promise.race([network, timeout]) : network);
        if (res) return res;
      } catch {}
      return cached || (await cache.match('index.html')) || Response.error();
    })
  );
});
