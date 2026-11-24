import { getState, subscribe, setTab } from '../store.js';
import { toast } from './toast.js';
import { today, dlcInfo } from './dates.js';
import { MEAL_KEYS } from '../data/recipes.js';

// Rappels doux : jour des courses, produits à cuisiner bientôt, repas du jour à valider.
// Dans l'app : un message à l'ouverture. Sur le téléphone : notification si autorisée
// (le service worker les envoie quand Android le permet, via la synchro périodique).
const SEEN_KEY = 'cocotte:rappels-vus';
const MIRROR = 'cocotte-rappels';

const readSeen = () => { try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}') || {}; } catch { return {}; } };
const writeSeen = (v) => { try { localStorage.setItem(SEEN_KEY, JSON.stringify(v)); } catch {} };

// Données minimales pour calculer les rappels (aussi copiées pour le service worker)
export function snapshot(s) {
  const t = today();
  const planned = MEAL_KEYS.filter((m) => s.plan[t]?.[m]?.status === 'planned').length;
  return {
    cfg: s.profile.reminders || {}, weekStart: s.profile.weekStart ?? 6, onboarded: !!s.profile.onboarded,
    list: s.shoppingList.filter((x) => !x.checked).length,
    dlc: s.inventory.filter((x) => x.dlc && !x.leftoverOf).map((x) => ({ name: x.name, dlc: x.dlc })),
    planned: { [t]: planned },
  };
}

// Même logique que dans sw.js (garder les deux alignées)
export function dueReminders(snap, now = new Date()) {
  const { cfg } = snap;
  if (!snap.onboarded) return [];
  const t = today();
  const h = now.getHours();
  const out = [];
  if (cfg.shopping && now.getDay() === snap.weekStart && h >= (cfg.shoppingHour ?? 10) && snap.list > 0) {
    out.push({ id: 'shopping', title: 'C’est le jour des courses', body: `${snap.list} produit${snap.list > 1 ? 's' : ''} sur ta liste.`, tab: 'shop', action: 'Voir ma liste' });
  }
  if (cfg.dlc && h >= 9) {
    const soon = snap.dlc.filter((x) => { const d = dlcInfo(x.dlc); return d.days >= 0 && d.days <= 1; });
    if (soon.length) out.push({ id: 'dlc', title: 'À cuisiner bientôt', body: soon.slice(0, 3).map((x) => x.name).join(', ') + (soon.length > 3 ? '…' : ''), tab: 'profile', action: 'Voir' });
  }
  if (cfg.meals && h >= (cfg.mealsHour ?? 21) && (snap.planned[t] || 0) > 0) {
    out.push({ id: 'meals', title: 'Ta journée', body: 'Quand tu veux, tu peux valider tes repas d’aujourd’hui en un geste.', tab: 'week', action: 'Ouvrir' });
  }
  return out;
}

function check() {
  const s = getState();
  const due = dueReminders(snapshot(s));
  const seen = readSeen();
  const t = today();
  const fresh = due.filter((r) => seen[r.id] !== t);
  if (!fresh.length || document.visibilityState !== 'visible') return;
  const r = fresh[0];
  seen[r.id] = t;
  writeSeen(seen);
  toast(`${r.title} · ${r.body}`, { action: r.action, onAction: () => setTab(r.tab), duration: 7000 });
}

let mirrorTimer = null;
function mirror(s) {
  clearTimeout(mirrorTimer);
  mirrorTimer = setTimeout(() => {
    if (!window.caches) return;
    const body = JSON.stringify({ ...snapshot(s), seen: readSeen() });
    caches.open(MIRROR).then((c) => c.put('rappels.json', new Response(body, { headers: { 'content-type': 'application/json' } }))).catch(() => {});
  }, 1500);
}

export function startReminders() {
  setTimeout(check, 2500);
  setInterval(check, 15 * 60e3);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') setTimeout(check, 800); });
  mirror(getState());
  subscribe(mirror);
}

// Autoriser les notifications du téléphone (demandé seulement au clic de la personne)
export async function enableNotifications() {
  if (!('Notification' in window)) return 'unsupported';
  const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (perm !== 'granted') return perm;
  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg?.periodicSync) await reg.periodicSync.register('cocotte-rappels', { minInterval: 4 * 3600e3 });
  } catch {}
  return 'granted';
}
export const notificationState = () => ('Notification' in window ? Notification.permission : 'unsupported');
