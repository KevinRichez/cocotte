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
  out.prefs = { ing: isObj(s.prefs?.ing) ? s.prefs.ing : {}, recipe: isObj(s.prefs?.recipe) ? s.prefs.recipe : {} };
  for (const k of ['inventory', 'deferred', 'shoppingList', 'history', 'customProducts', 'customRecipes']) out[k] = arr(s[k]).filter(isObj);
  out.inventory = out.inventory.filter((x) => typeof x.qty === 'number' && x.qty > 0);
  for (const k of ['plan', 'priceOverrides', 'brandPrefs']) out[k] = isObj(s[k]) ? s[k] : {};
  return out;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? sanitize(migrate(JSON.parse(raw))) : null;
  } catch { return null; }
}

let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }, 120);
}
addEventListener('pagehide', () => { clearTimeout(saveTimer); try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} });

let state = load() || emptyState();
save();

export const getState = () => state;

export function update(mutator) {
  const prev = state;
  const draft = structuredClone(state);
  const res = mutator(draft);
  state = res || draft;
  save();
  listeners.forEach((l) => l(state));
  return prev;
}
export function restore(snapshot) {
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
