// Store global minimaliste : état unique, mutations via brouillon cloné, persistance localStorage.
import { useState, useEffect } from './lib/h.js';
import { createSeed, SEED_VERSION } from './data/seed.js';

const KEY = 'fitmus:v1';
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s.version === SEED_VERSION ? s : null;
  } catch { return null; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* stockage indisponible : l'app reste utilisable */ }
}

let state = load() || createSeed();
save();

export const getState = () => state;

/** Applique une mutation sur un brouillon. Renvoie l'état précédent (pour "Annuler"). */
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
export function resetDemo() { restore(createSeed()); }

export function useStore() {
  const [s, set] = useState(state);
  useEffect(() => { const l = (ns) => set(ns); listeners.add(l); set(state); return () => listeners.delete(l); }, []);
  return s;
}

export const setTab = (tab, extra = {}) => update((d) => { d.ui = { ...d.ui, tab, ...extra }; });
