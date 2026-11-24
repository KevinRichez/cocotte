const VERSION = 'cocotte-v30';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css', 'css/fonts.css', 'fonts/jakarta.woff2', 'fonts/bricolage.woff2',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png',
  'vendor/preact.module.js', 'vendor/hooks.module.js', 'vendor/htm.module.js',
  'js/boot.js', 'js/main.js', 'js/store.js', 'js/actions.js',
  'js/lib/h.js', 'js/lib/confirm.js', 'js/lib/photos.js', 'js/lib/dates.js', 'js/lib/engine.js', 'js/lib/ticket.js', 'js/lib/toast.js', 'js/lib/off.js', 'js/lib/scanner.js', 'js/lib/ticketFile.js',
  'js/data/ingredients.js', 'js/data/products.js', 'js/data/recipes.js', 'js/data/seed.js', 'js/data/produce.js', 'js/data/diets.js', 'js/lib/reminders.js', 'js/components/Tutorial.js',
  'js/components/ui.js', 'js/components/icons.js', 'js/components/RecipeSheet.js', 'js/components/RecipeEditor.js', 'js/components/RecipeImport.js', 'js/lib/recipeImport.js', 'js/components/ProductSearch.js',
  'js/views/WeekView.js', 'js/views/ShoppingView.js', 'js/views/RecipesView.js', 'js/views/ProfileView.js', 'js/views/Onboarding.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== 'cocotte-share' && k !== 'cocotte-rappels').map((k) => caches.delete(k))))
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

// Rappels en arrière-plan : Android réveille le service worker de temps en temps (app installée).
// Même logique que js/lib/reminders.js, sur la copie des données faite par l'app.
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
async function backgroundReminders() {
  const cache = await caches.open('cocotte-rappels');
  const res = await cache.match('rappels.json');
  if (!res) return;
  const snap = await res.json();
  const cfg = snap.cfg || {};
  if (!snap.onboarded) return;
  const now = new Date();
  const t = ymd(now);
  const h = now.getHours();
  const seen = snap.seen || {};
  const out = [];
  if (cfg.shopping && now.getDay() === snap.weekStart && h >= (cfg.shoppingHour ?? 10) && snap.list > 0) out.push({ id: 'shopping', title: 'C’est le jour des courses', body: `${snap.list} produit${snap.list > 1 ? 's' : ''} sur ta liste.`, tab: 'shop' });
  if (cfg.dlc && h >= 9) {
    const soon = (snap.dlc || []).filter((x) => { const d = Math.round((Date.parse(x.dlc) - Date.parse(t)) / 864e5); return d >= 0 && d <= 1; });
    if (soon.length) out.push({ id: 'dlc', title: 'À cuisiner bientôt', body: soon.slice(0, 3).map((x) => x.name).join(', '), tab: 'profile' });
  }
  if (cfg.meals && h >= (cfg.mealsHour ?? 21) && (snap.planned?.[t] || 0) > 0) out.push({ id: 'meals', title: 'Ta journée', body: 'Quand tu veux, tu peux valider tes repas d’aujourd’hui en un geste.', tab: 'week' });
  const fresh = out.filter((r) => seen[r.id] !== t);
  for (const r of fresh) {
    seen[r.id] = t;
    await self.registration.showNotification(r.title, { body: r.body, icon: 'icons/icon-192.png', badge: 'icons/favicon-32.png', tag: r.id, data: { tab: r.tab } });
  }
  if (fresh.length) await cache.put('rappels.json', new Response(JSON.stringify({ ...snap, seen }), { headers: { 'content-type': 'application/json' } }));
}
self.addEventListener('periodicsync', (e) => { if (e.tag === 'cocotte-rappels') e.waitUntil(backgroundReminders().catch(() => {})); });
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const tab = e.notification.data?.tab || 'week';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    const c = list[0];
    if (c) { c.postMessage({ type: 'open-tab', tab }); return c.focus(); }
    return self.clients.openWindow(`./?tab=${tab}`);
  }));
});
