import { useState, useEffect } from './lib/h.js';
import { createSeed, emptyState, migrate, defaultProfile } from './data/seed.js';

const KEY = 'fitmus:v1';
const listeners = new Set();

const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
const arr = (x) => (Array.isArray(x) ? x : []);

function sanitize(s) {
  if (!isObj(s)) return null;
  const base = emptyState();
  const out = { ...base, ...s };
  out.ui = isObj(s.ui) ? { ...base.ui, ...s.ui } : base.ui;
  out.profile = isObj(s.profile) ? { ...defaultProfile(), ...s.profile } : defaultProfile();
  const dp = defaultProfile();
  if (!isObj(out.profile.household)) out.profile.household = dp.household;
  for (const k of ['diets', 'priorities']) if (!Array.isArray(out.profile[k])) out.profile[k] = [];
  // Portions allégées : gardées pour qui les avait déjà (novembre 2026), sinon quantités normales
  if (typeof s.profile?.light !== 'boolean') out.profile.light = !!s.flags?.lightV1;
  out.profile.reminders = { ...dp.reminders, ...(isObj(out.profile.reminders) ? out.profile.reminders : {}) };
  out.prefs = { ing: isObj(s.prefs?.ing) ? s.prefs.ing : {}, recipe: isObj(s.prefs?.recipe) ? s.prefs.recipe : {} };
  for (const k of ['inventory', 'deferred', 'shoppingList', 'history', 'customProducts', 'customRecipes']) out[k] = arr(s[k]).filter(isObj);
  out.inventory = out.inventory.filter((x) => typeof x.qty === 'number' && x.qty > 0);
  for (const k of ['plan', 'priceOverrides', 'brandPrefs', 'productOverrides', 'extras', 'needsSkip']) out[k] = isObj(s[k]) ? s[k] : {};
  return out;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? sanitize(migrate(JSON.parse(raw))) : null;
  } catch { return null; }
}

// Sauvegardes automatiques : 4 instantanés max, pris une fois par jour
// et avant toute action qui retire beaucoup de stock ou d'historique.
const BACKUP_KEY = 'cocotte:backups';
const BACKUP_MAX = 4;
export function listBackups() {
  try { const b = JSON.parse(localStorage.getItem(BACKUP_KEY) || '[]'); return Array.isArray(b) ? b.filter((x) => isObj(x) && isObj(x.state)) : []; } catch { return []; }
}
const hasContent = (s) => s && (s.inventory?.length || s.history?.length || Object.keys(s.plan || {}).length);
export function backupNow(s = state, reason = 'auto') {
  if (!hasContent(s)) return;
  let list = listBackups();
  list.unshift({ at: new Date().toISOString(), reason, stock: s.inventory.length, tickets: s.history.length, state: s });
  list = list.slice(0, BACKUP_MAX);
  while (list.length) {
    try { localStorage.setItem(BACKUP_KEY, JSON.stringify(list)); return; } catch { list.pop(); }
  }
}
function dailyBackup() {
  const last = listBackups()[0];
  if (!last || Date.now() - Date.parse(last.at) > 20 * 3600e3) backupNow(state, 'jour');
}
function guard(prev, next) {
  const lost = (prev.inventory?.length || 0) - (next.inventory?.length || 0);
  const lostH = (prev.history?.length || 0) - (next.history?.length || 0);
  if (lost >= 3 || lostH >= 1) backupNow(prev, 'avant');
}

let saveTimer = null;
let warned = false;
function write() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch {
    if (!warned) { warned = true; import('./lib/toast.js').then((t) => t.toast('Mémoire du téléphone pleine : tes derniers changements ne sont pas enregistrés')); }
  }
}
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(write, 120);
}
const flush = () => { clearTimeout(saveTimer); write(); };
addEventListener('pagehide', flush);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
navigator.storage?.persist?.().catch(() => {});

let state = load() || emptyState();
save();
dailyBackup();

export const getState = () => state;
export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

export function update(mutator) {
  const prev = state;
  const draft = structuredClone(state);
  const res = mutator(draft);
  state = res || draft;
  guard(prev, state);
  save();
  listeners.forEach((l) => l(state));
  return prev;
}
export function restore(snapshot) {
  guard(state, snapshot);
  state = snapshot; save(); listeners.forEach((l) => l(state));
}
export function replaceState(next) { restore(sanitize(next)); }
export const freshDemo = (profile) => createSeed(profile);
export const freshEmpty = (profile) => emptyState(profile);

export function useStore() {
  const [s, set] = useState(state);
  useEffect(() => { const l = (ns) => set(ns); listeners.add(l); set(state); return () => listeners.delete(l); }, []);
  return s;
}

export const setTab = (tab, extra = {}) => update((d) => { d.ui = { ...d.ui, tab, ...extra }; });
