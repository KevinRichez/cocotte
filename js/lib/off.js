import { guessIngredient, ING } from '../data/ingredients.js';

const BASE = 'https://world.openfoodfacts.org';
const FIELDS = 'code,product_name,product_name_fr,brands,quantity,product_quantity,product_quantity_unit,nutriments,image_front_small_url,nutriscore_grade,categories_tags';
const cache = new Map();
let lastSearch = 0;

const num = (x) => (typeof x === 'number' && isFinite(x) ? Math.round(x * 10) / 10 : null);
const clean = (x, max = 120) => String(x || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max);

function toProduct(p) {
  if (!p) return null;
  const name = clean(p.product_name_fr || p.product_name);
  if (!name) return null;
  const n = p.nutriments || {};
  const nutri = {
    kcal: num(n['energy-kcal_100g']), prot: num(n.proteins_100g), carbs: num(n.carbohydrates_100g), sugars: num(n.sugars_100g),
    fat: num(n.fat_100g), satFat: num(n['saturated-fat_100g']), fiber: num(n.fiber_100g), salt: num(n.salt_100g),
  };
  const ing = guessIngredient(`${name} ${(p.categories_tags || []).slice(-3).join(' ').replace(/[a-z]{2}:/g, ' ').replace(/-/g, ' ')}`);
  const unit = ing ? ING[ing].unit : null;
  let size = num(+p.product_quantity) || null;
  if (unit === 'pc') size = null;
  const img = typeof p.image_front_small_url === 'string' && p.image_front_small_url.startsWith('https://images.openfoodfacts.org/') ? p.image_front_small_url : null;
  return {
    barcode: clean(p.code, 20), name, brand: clean(p.brands, 60).split(',')[0], quantity: clean(p.quantity, 30),
    size, ing, nutri, image: img, nutriscore: /^[a-e]$/.test(p.nutriscore_grade) ? p.nutriscore_grade : null,
  };
}

async function getJson(url, ms = 8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally { clearTimeout(timer); }
}

export async function lookupBarcode(code) {
  const c = String(code).replace(/\D/g, '');
  if (c.length < 8 || c.length > 14) throw new Error('Code-barres invalide');
  const key = `b:${c}`;
  if (cache.has(key)) return cache.get(key);
  const data = await getJson(`${BASE}/api/v2/product/${c}.json?fields=${FIELDS}`);
  const prod = data?.status === 1 ? toProduct(data.product) : null;
  cache.set(key, prod);
  return prod;
}

export async function searchOnline(query) {
  const q = clean(query, 60);
  if (q.length < 3) return [];
  const key = `s:${q.toLowerCase()}`;
  if (cache.has(key)) return cache.get(key);
  const wait = 6500 - (Date.now() - lastSearch);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastSearch = Date.now();
  const url = `${BASE}/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=20&tagtype_0=countries&tag_contains_0=contains&tag_0=france&fields=${FIELDS}`;
  const data = await getJson(url, 10000);
  const list = (data?.products || []).map(toProduct).filter(Boolean);
  cache.set(key, list);
  return list;
}
