// Photos de plats : gardées à part (cocotte:photos) pour ne pas alourdir l'état ni les sauvegardes
import { useState, useEffect } from './h.js';
const KEY = 'cocotte:photos';
let map = {};
try { map = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { map = {}; }
const listeners = new Set();
export const getPhoto = (id) => (id && map[id]) || null;
export function setPhoto(id, dataUrl) {
  const next = { ...map, [id]: dataUrl };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { return false; }
  map = next; listeners.forEach((l) => l());
  return true;
}
export function removePhoto(id) {
  const next = { ...map }; delete next[id];
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  map = next; listeners.forEach((l) => l());
}
export function useRecipePhoto(id) {
  const [, force] = useState(0);
  useEffect(() => { const l = () => force((x) => x + 1); listeners.add(l); return () => listeners.delete(l); }, []);
  return getPhoto(id);
}
export async function photoFromFile(file, size = 360) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const s = Math.min(img.naturalWidth, img.naturalHeight);
    const c = document.createElement('canvas');
    c.width = c.height = size;
    c.getContext('2d').drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, size, size);
    return c.toDataURL('image/jpeg', 0.72);
  } finally { URL.revokeObjectURL(url); }
}
