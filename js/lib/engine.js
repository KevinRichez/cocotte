import { ING, INGREDIENTS, SWAP_GROUPS } from '../data/ingredients.js';
import { bank, bankProduct, bankForIng, STORES, TIERS } from '../data/products.js';
import { RECIPES, RECIPE, MEAL_KEYS } from '../data/recipes.js';
import { PRODUCE_PHOTOS } from '../data/produce.js';
import { today, addDays, diffDays, weekDays, mondayOf, dlcInfo } from './dates.js';

export const uid = () => (crypto.randomUUID ? crypto.randomUUID().slice(0, 13) : Math.random().toString(36).slice(2, 12));
export const norm = (x) => String(x || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
export const euro = (n) => `${(Math.round(n * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
export const kcalFmt = (n) => Math.round(n).toLocaleString('fr-FR');
// x1,25 = une seule portion, 25 % plus grande
export function fmtPortion(v) {
  if (v === 1) return '1 portion';
  if (v === 2) return 'Portion double';
  if (v === 1.5) return '1 portion et demie';
  if (v > 1 && v <= 2.5) return `1 portion +${Math.round((v - 1) * 100)} %`;
  if (v < 1) return `1 portion ${Math.round((v - 1) * 100)} %`.replace('-', 'moins ');
  return `${String(v).replace('.', ',')} portions`;
}

export const TIER_META = {
  refuge: { label: 'Refuge', emoji: '💙', tone: 'sky', hint: 'Ceux qui te font du bien, mis en avant.' },
  ok: { label: 'OK', emoji: '👍', tone: 'sage', hint: 'Tu aimes bien, sans plus.' },
  doux: { label: 'Défi doux', emoji: '🌱', tone: 'lav', hint: 'Proposés de temps en temps, jamais imposés.' },
  nogo: { label: 'No-go', emoji: '🙅', tone: 'mute', hint: 'Masqués partout.' },
};
export const TIER_KEYS = ['refuge', 'ok', 'doux', 'nogo'];
export const ingTier = (s, id) => s.prefs.ing[id] || null;
export const recipeTier = (s, id) => s.prefs.recipe[id] || null;

export function targets(p) {
  const w = +p.weight || 60, h = +p.height || 170, a = +p.age || 25;
  const sexAdj = p.sex === 'm' ? 5 : p.sex === 'f' ? -161 : -78;
  const bmr = 10 * w + 6.25 * h - 5 * a + sexAdj;
  const tdee = bmr * (+p.activity || 1.4);
  const goal = +p.weightGoal || w;
  const dir = goal > w + 0.4 ? 'gain' : goal < w - 0.4 ? 'lose' : 'maintain';
  const gap = Math.abs(goal - w);
  const step = Math.min(700, Math.max(150, 150 + gap * 40)) * (p.pace === 'actif' ? 1.3 : 1);
  let kcal = tdee + (dir === 'gain' ? step : dir === 'lose' ? -step : 0);
  if (dir === 'lose') kcal = Math.max(kcal, bmr * 1.1, 1300);
  const prot = Math.round(w * (dir === 'maintain' ? 1.4 : 1.8));
  return { kcal: Math.round(kcal / 50) * 50, prot, dir, bmr: Math.round(bmr), tdee: Math.round(tdee) };
}
export const GOAL_LABEL = { gain: 'Prendre du poids', maintain: 'Garder mon poids', lose: 'Perdre du poids' };

export const userStores = (s) => (s.profile.stores?.length ? s.profile.stores : ['leclerc']);

export const photoFor = (ing) => PRODUCE_PHOTOS[ing] || null;
const withPhoto = (p) => (p && !p.image && PRODUCE_PHOTOS[p.ing] ? { ...p, image: PRODUCE_PHOTOS[p.ing], stockPhoto: true } : p);
export function getProduct(s, id) {
  if (!id) return null;
  const b = bankProduct(id);
  if (b) { const ov = s.productOverrides?.[id]; return withPhoto(ov ? { ...b, ...ov, id } : b); }
  return withPhoto(s.customProducts.find((p) => p.id === id) || null);
}
// Fiche de référence d'un aliment : le produit que tu as scanné, photographié ou corrigé
const isRef = (p) => p && ((p.image && !p.stockPhoto) || p.barcode || p.offName || p.edited || p.nutri);
export function refProduct(s, ing) {
  const p = getProduct(s, s.brandPrefs?.[ing]);
  return p && p.ing === ing && isRef(p) ? p : null;
}
export function refProducts(s) {
  const out = {};
  for (const ing of Object.keys(s.brandPrefs || {})) { const p = refProduct(s, ing); if (p) out[ing] = p; }
  return out;
}
export function productTitle(p) {
  if (!p) return '';
  if (p.offName) return p.offName;
  if (p.custom) return cleanName(p.name);
  return ING[p.ing]?.name || p.name;
}
export const cleanName = (n) => {
  const out = String(n || '')
    .replace(/\d+([.,]\d+)?\s?%\s?(mg)?/gi, ' ')
    .replace(/\b\d+([.,]\d+)?\s?(kg|g|gr|cl|ml|l)\b/gi, ' ')
    .replace(/\b\d+\s?x\s?\d*\b|\bx\s?\d+\b/gi, ' ')
    .replace(/\s+à l'unité$/u, '')
    .replace(/\s{2,}/g, ' ').trim();
  return out || String(n || '');
};
export function productSize(p) {
  if (!p?.size) return '';
  const unit = p.unit || ING[p.ing]?.unit;
  if (unit === 'pc') return p.size === 1 ? "à l'unité" : `x${p.size}`;
  if (unit === 'ml') return p.size >= 1000 ? `${(p.size / 1000).toLocaleString('fr-FR')} L` : p.size >= 100 && p.size % 10 === 0 ? `${p.size / 10} cl` : `${p.size} ml`;
  return p.size >= 1000 ? `${(p.size / 1000).toLocaleString('fr-FR')} kg` : `${p.size} g`;
}
export const productPrice = (s, id) => s.priceOverrides?.[id]?.price ?? getProduct(s, id)?.price ?? 0;

export function productsForIng(s, ing) {
  const stores = userStores(s);
  const own = bankForIng(ing).filter((p) => stores.includes(p.store));
  const custom = s.customProducts.filter((p) => p.ing === ing);
  return [...custom, ...own].sort((a, b) => stores.indexOf(a.store) - stores.indexOf(b.store) || a.price / a.size - b.price / b.size);
}

export function defaultProductFor(s, ing) {
  const pref = s.brandPrefs?.[ing];
  if (pref && getProduct(s, pref)) return pref;
  const stores = userStores(s);
  const pool = bankForIng(ing).filter((p) => p.tier !== 'bio' && p.tier !== 'nat' && !p.id.includes('.s'));
  for (const st of stores) {
    const inStore = pool.filter((p) => p.store === st).sort((a, b) => a.price / a.size - b.price / b.size);
    if (inStore.length) return inStore[0].id;
  }
  return pool[0]?.id || null;
}
export function unitCost(s, ing) {
  const p = getProduct(s, defaultProductFor(s, ing));
  return p && p.size ? productPrice(s, p.id) / p.size : 0;
}

export function searchProducts(s, query, { limit = 40 } = {}) {
  const q = norm(query);
  if (q.length < 2) return [];
  const words = q.replace(/(\d)\s*%/g, '$1').split(/\s+/).filter(Boolean);
  const tests = words.map((w) => (/^\d+$/.test(w) ? ((t) => new RegExp(`(^|[^0-9,.])${w}([^0-9]|$)`).test(t)) : (t) => t.includes(w)));
  const stores = userStores(s);
  const score = (p, text) => {
    let sc = 0;
    for (let k = 0; k < words.length; k++) {
      if (!tests[k](text)) return -1;
      sc += norm(p.name).startsWith(words[k]) ? 3 : 1;
    }
    return sc;
  };
  const out = [];
  for (const p of s.customProducts) {
    const sc = score(p, norm(`${p.name} ${p.brand || ''}`));
    if (sc >= 0) out.push({ p, sc: sc + 4 });
  }
  for (const p of bank().list) {
    if (!stores.includes(p.store)) continue;
    const sc = score(p, p.search);
    if (sc >= 0) out.push({ p, sc: sc - stores.indexOf(p.store) * 0.3 - (p.tier === 'bio' || p.tier === 'nat' ? 0.4 : 0) - (p.id.includes('.s') ? 0.2 : 0) });
  }
  return out.sort((a, b) => b.sc - a.sc || a.p.name.localeCompare(b.p.name)).slice(0, limit).map((x) => x.p);
}

export function searchIngredients(query, { limit = 30 } = {}) {
  const q = norm(query);
  if (!q) return INGREDIENTS.slice(0, limit);
  const words = q.split(/[^a-z0-9%]+/).filter((w) => w.length > 1).map((w) => (w.length > 3 ? w.replace(/s$/, '') : w));
  const score = (i) => {
    const n = norm(i.name);
    if (n.startsWith(q)) return 100;
    if (i.keys.includes(q)) return 80;
    const hit = words.filter((w) => i.keys.includes(w)).length;
    return hit === words.length ? 60 + hit : hit >= 1 && words[0] && i.keys.includes(words[0]) ? 20 + hit : 0;
  };
  return INGREDIENTS.map((i) => [i, score(i)]).filter(([, sc]) => sc > 0).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([i]) => i);
}

export function allRecipes(s) {
  if (!s.customRecipes.length) return RECIPES;
  const own = new Set(s.customRecipes.map((r) => r.id));
  return [...s.customRecipes, ...RECIPES.filter((r) => !own.has(r.id))];
}
export const getRecipe = (s, id) => s.customRecipes.find((r) => r.id === id) || RECIPE[id] || null;

const roundQty = (q, unit) => (unit === 'pc' ? Math.round(q * 2) / 2 : Math.round(q));
export function recipeLines(recipe, swaps = {}, servings = 1) {
  return recipe.ingredients.filter((l) => ING[l.ing]).map((line, idx) => {
    const to = swaps?.[idx];
    if (to && to !== line.ing && ING[to]) {
      const from = ING[line.ing];
      const ratio = from.portion && ING[to].portion ? ING[to].portion / from.portion : 1;
      return { ...line, ing: to, qty: roundQty(line.qty * ratio * servings, ING[to].unit), swapped: line.ing, idx };
    }
    return { ...line, qty: roundQty(line.qty * servings, ING[line.ing].unit), idx };
  });
}
const nutriCache = new WeakMap();
export function ingNutri(s, id) {
  const ing = ING[id];
  if (!s || ing.unit === 'pc') return ing;
  let map = nutriCache.get(s.inventory);
  if (!map) {
    map = {};
    const lots = [...s.inventory].sort((a, b) => (a.addedAt || '').localeCompare(b.addedAt || ''));
    for (const lot of lots) {
      const n = lot.nutri || getProduct(s, lot.productId)?.nutri;
      if (lot.ing && n && n.kcal != null) map[lot.ing] = { kcal: n.kcal, prot: n.prot ?? ING[lot.ing].prot };
    }
    for (const [ingId, pid] of Object.entries(s.brandPrefs || {})) {
      const n = getProduct(s, pid)?.nutri;
      if (!map[ingId] && n && n.kcal != null) map[ingId] = { kcal: n.kcal, prot: n.prot ?? ING[ingId].prot };
    }
    nutriCache.set(s.inventory, map);
  }
  return map[id] || ing;
}
export function nutrition(lines, s) {
  let kcal = 0, prot = 0;
  for (const l of lines) {
    const ing = ING[l.ing];
    const n = ingNutri(s, l.ing);
    const f = ing.unit === 'pc' ? l.qty : l.qty / 100;
    kcal += n.kcal * f; prot += n.prot * f;
  }
  return { kcal, prot };
}
export const linesCost = (s, lines) => lines.reduce((sum, l) => sum + (ING[l.ing].staple ? 0 : unitCost(s, l.ing) * l.qty), 0);
export function recipeStats(s, recipe, swaps) {
  const lines = recipeLines(recipe, swaps);
  const { kcal, prot } = nutrition(lines, s);
  return { kcal, prot, cost: linesCost(s, lines), lines };
}
export const budgetLevel = (cost) => (cost < 1.5 ? 1 : cost < 2.5 ? 2 : 3);
export const budgetLabel = (lvl) => '€'.repeat(lvl);

export function swapOptions(line, s) {
  const group = SWAP_GROUPS[line.swap];
  if (!group) return [];
  return [line.ing, ...group.filter((id) => id !== line.ing && ingTier(s, id) !== 'nogo')];
}

export function canCook(s, recipe) {
  const eq = s.profile.equipment || [];
  return recipe.equipment.every((e) => e === 'aucun' || eq.includes(e) || (e === 'plaques' && (eq.includes('poele') || eq.includes('casserole'))));
}
export function isBlocked(s, recipe, swaps = {}) {
  if (recipeTier(s, recipe.id) === 'nogo') return true;
  if (!canCook(s, recipe)) return true;
  return recipeLines(recipe, swaps).some((l) => ingTier(s, l.ing) === 'nogo');
}
export const visibleRecipes = (s) => allRecipes(s).filter((r) => !isBlocked(s, r));

// Aliments interchangeables dans les recettes (même unité) : ton pain de mie complet
// compte pour « pain de mie », ton beurre demi-sel pour « beurre doux »...
const EQUIV_GROUPS = [
  ['pain_mie', 'pain_complet'], ['jambon', 'jambon_cru', 'blanc_dinde'], ['beurre', 'beurre_demi_sel'],
  ['riz', 'riz_basmati', 'riz_thai', 'riz_complet'], ['pates', 'pates_completes', 'pates_fraiches'],
  ['lait', 'lait_entier', 'lait_ecreme'], ['creme', 'creme_30', 'creme_liquide'], ['fromage_blanc', 'fromage_blanc0', 'skyr'],
  ['steak5', 'steak15', 'steak20'], ['tomates_pelees', 'pulpe_tomate'], ['mozzarella', 'mozza_rapee'], ['emmental', 'mozza_rapee'],
  ['poisson_blanc', 'cabillaud'], ['pain', 'pain_campagne'], ['yaourt', 'yaourt_grec'], ['chocolat', 'chocolat_noir'],
  ['oignon', 'echalote'], ['citron', 'citron_vert'], ['poulet', 'emince_poulet_cuit'], ['saumon', 'saumon_cuit'],
  ['hache_boeuf', 'dinde_hachee'], ['huile', 'huile_olive'], ['wraps', 'pita'], ['curry', 'garam_masala'], ['persil', 'coriandre'],
];
const EQUIV = {};
for (const g of EQUIV_GROUPS) for (const a of g) for (const b of g) {
  if (a !== b && ING[a] && ING[b] && ING[a].unit === ING[b].unit) (EQUIV[a] ||= new Set()).add(b);
}
export const equivOf = (ing) => [...(EQUIV[ing] || [])];
const liveLots = (s, ing) => s.inventory.filter((x) => x.ing === ing && !dlcInfo(x.dlc).past);
export function stockQty(s, ing, { exact = false } = {}) {
  const ids = exact ? [ing] : [ing, ...equivOf(ing)];
  return ids.reduce((n, id) => n + liveLots(s, id).reduce((m, x) => m + x.qty, 0), 0);
}
// Nom de l'aliment équivalent utilisé quand l'aliment exact manque
export function stockSubstitute(s, ing, qty = 0) {
  if (stockQty(s, ing, { exact: true }) >= Math.max(qty, 0.01)) return null;
  const lot = equivOf(ing).flatMap((id) => liveLots(s, id))[0];
  return lot ? cleanName(lot.name) || ING[lot.ing].name : null;
}
export function stockMatch(s, lines) {
  let have = 0; const missing = [];
  for (const l of lines) {
    const q = stockQty(s, l.ing);
    if (ING[l.ing].staple ? q > 0 : q >= l.qty) have++;
    else missing.push(l.ing);
  }
  return { have, total: lines.length, ratio: lines.length ? have / lines.length : 0, missing };
}
export function urgentIngs(s) {
  return [...new Set(s.inventory.filter((x) => { const d = dlcInfo(x.dlc); return d.days >= 0 && d.days <= 2; }).map((x) => x.ing).filter(Boolean))];
}

export function addToInventory(draft, { ing, qty, name, dlc, location, productId, nutri, unit }) {
  const existing = draft.inventory.find((x) => ing && x.ing === ing && x.dlc === dlc && x.location === location && x.productId === productId);
  if (existing) { existing.qty += qty; return existing; }
  const item = { id: uid(), ing: ing || null, name: name || ING[ing]?.name || 'Produit', qty, dlc: dlc || null, location: location || ING[ing]?.storage || 'placard', productId: productId || null, addedAt: today() };
  if (nutri) item.nutri = nutri;
  if (!ing && unit) item.unit = unit;
  draft.inventory.push(item);
  return item;
}

export function consumeLines(draft, lines) {
  const taken = [];
  for (const l of lines) {
    if (ING[l.ing]?.staple) continue;
    let left = l.qty;
    const byDlc = (a, b) => (a.dlc || '9').localeCompare(b.dlc || '9');
    const eq = equivOf(l.ing);
    const lots = [...draft.inventory.filter((x) => x.ing === l.ing).sort(byDlc), ...draft.inventory.filter((x) => eq.includes(x.ing)).sort(byDlc)];
    for (const lot of lots) {
      if (left <= 0) break;
      const take = Math.min(lot.qty, left);
      lot.qty = Math.round((lot.qty - take) * 10) / 10; left -= take;
      if (take > 0) taken.push({ lot: { ...lot, qty: 0 }, take });
    }
  }
  draft.inventory = draft.inventory.filter((x) => x.qty > 0);
  return taken;
}
// Remet en stock ce qu'un repas avait consommé (le lot réapparaît s'il avait disparu)
export function restoreTaken(draft, taken = []) {
  for (const { lot, take } of taken) {
    const cur = draft.inventory.find((x) => x.id === lot.id);
    if (cur) cur.qty = Math.round((cur.qty + take) * 10) / 10;
    else draft.inventory.push({ ...lot, qty: take });
  }
}
// Produits en stock qui ressemblent à l'aliment mais n'y sont pas reliés
export function linkCandidates(s, ing) {
  const eq = new Set([ing, ...equivOf(ing)]);
  const words = norm(ING[ing].name).split(/[^a-z]+/).filter((w) => w.length > 3).map((w) => w.replace(/s$/, ''));
  if (!words.length) return [];
  return s.inventory.filter((x) => !eq.has(x.ing) && !dlcInfo(x.dlc).past && norm(x.name).includes(words[0]));
}
export const pastStock = (s, ing) => s.inventory.filter((x) => (x.ing === ing || equivOf(ing).includes(x.ing)) && dlcInfo(x.dlc).past);

export function estimateDlc(s, productId, ing, from = today()) {
  const p = getProduct(s, productId);
  const shelf = p?.shelf ?? ING[ing || p?.ing]?.shelf ?? 7;
  return addDays(from, shelf);
}

export function weekRecipeIds(s, monday) {
  return weekDays(monday).flatMap((d) => MEAL_KEYS.map((m) => s.plan[d]?.[m]?.recipeId)).filter(Boolean);
}
const MEAL_END_HOUR = { petitdej: 10, dej: 14, collation: 17, diner: 22 };
export function isSlotPast(date, meal) {
  const d = diffDays(date, today());
  if (d < 0) return true;
  if (d > 0) return false;
  return new Date().getHours() >= MEAL_END_HOUR[meal];
}
export function nextFreeSlot(s, recipe, { after } = {}) {
  for (let k = 0; k < 10; k++) {
    const date = addDays(today(), k);
    for (const meal of MEAL_KEYS) {
      if (!recipe.meals.includes(meal) || isSlotPast(date, meal)) continue;
      if (after && (date < after.date || (date === after.date && MEAL_KEYS.indexOf(meal) <= MEAL_KEYS.indexOf(after.meal)))) continue;
      if (!s.plan[date]?.[meal]) return { date, meal };
    }
  }
  return null;
}

const MEAL_SHARE = { petitdej: 0.25, dej: 0.32, collation: 0.13, diner: 0.3 };

export function slotBudget(s, date, meal) {
  const t = targets(s.profile);
  const plan = s.plan[date] || {};
  let used = 0, shares = 0;
  for (const m of MEAL_KEYS) {
    const slot = plan[m];
    if (m === meal) { shares += MEAL_SHARE[m]; continue; }
    if (slot) used += slotKcal(s, slot).kcal;
    else if (!isSlotPast(date, m)) shares += MEAL_SHARE[m];
  }
  const remaining = Math.max(0, t.kcal - used);
  return { budget: shares ? remaining * (MEAL_SHARE[meal] / shares) : remaining, remaining, dir: t.dir };
}

export function servingsFor(kcal, budget, dir) {
  if (!kcal || !budget) return 1;
  const raw = budget / kcal;
  const max = dir === 'lose' ? 1 : 2.5;
  const min = dir === 'gain' ? 1 : 0.75;
  return Math.min(max, Math.max(min, Math.round(raw * 4) / 4));
}

export function suggest(s, { meal, date, n = 3, exclude = [], budget: forced }) {
  const t = targets(s.profile);
  const target = meal ? (forced ?? (date ? slotBudget(s, date, meal).budget : t.kcal * MEAL_SHARE[meal])) : null;
  const weekIds = weekRecipeIds(s, mondayOf(date || today()));
  const urgent = urgentIngs(s);
  return allRecipes(s)
    .filter((r) => (!meal || r.meals.includes(meal)) && !exclude.includes(r.id) && !isBlocked(s, r))
    .map((r) => {
      const lines = recipeLines(r);
      const ings = lines.map((l) => l.ing);
      const base = nutrition(lines, s);
      const match = stockMatch(s, lines);
      const reasons = [];
      let score = match.ratio * 3;
      if (match.ratio === 1) reasons.push({ label: 'Tout en stock', tone: 'sage' });
      const anti = ings.filter((x) => urgent.includes(x));
      if (anti.length) { score += anti.length * 2; reasons.push({ label: `Anti-gaspi : ${ING[anti[0]].name.toLowerCase()}`, tone: 'amber' }); }
      const rt = recipeTier(s, r.id);
      if (rt === 'refuge') { score += 3; reasons.unshift({ label: 'Refuge', tone: 'sky' }); }
      else if (rt === 'ok') score += 1;
      else if (rt === 'doux') { score += 0.5; reasons.push({ label: 'Défi doux', tone: 'lav' }); }
      const ref = ings.filter((x) => ingTier(s, x) === 'refuge');
      score += ref.length * 1.1;
      if (ref.length >= 2 && rt !== 'refuge') reasons.push({ label: 'Aliments refuges', tone: 'sky' });
      const defi = ings.find((x) => ingTier(s, x) === 'doux');
      if (defi) { score += 0.4; reasons.push({ label: `Défi doux : ${ING[defi].name.toLowerCase()}`, tone: 'lav' }); }
      let servings = 1;
      if (target) {
        servings = servingsFor(base.kcal, target, t.dir);
        const gap = Math.abs(base.kcal * servings - target) / Math.max(target, 200);
        score += 3 - Math.min(gap, 1.5) * 4;
        score += (base.prot / Math.max(base.kcal, 1)) * (t.dir === 'lose' ? 40 : 15);
        if (servings > 1) score -= (servings - 1) * 0.8;
      }
      score -= weekIds.filter((id) => id === r.id).length * 2.2;
      score += r.time <= 15 ? 0.4 : 0;
      return { recipe: r, score, reasons: reasons.slice(0, 2), match, servings, kcal: base.kcal * servings, prot: base.prot * servings };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

export function compileNeeds(s, dates) {
  const need = {};
  for (const date of dates) {
    for (const meal of MEAL_KEYS) {
      const slot = s.plan[date]?.[meal];
      const r = slot && getRecipe(s, slot.recipeId);
      if (!slot || slot.status !== 'planned' || !r) continue;
      for (const l of recipeLines(r, slot.swaps, slot.servings || 1)) need[l.ing] = (need[l.ing] || 0) + l.qty;
    }
  }
  const out = [];
  for (const [ing, qty] of Object.entries(need)) {
    const have = stockQty(s, ing);
    const pid = defaultProductFor(s, ing);
    let prod = getProduct(s, pid);
    if (!prod) continue;
    if (ING[ing].staple) { if (have <= 0) out.push({ ing, productId: pid, packs: 1, missing: 0 }); continue; }
    const missing = qty - have;
    if (missing <= 0.01) continue;
    if (!prod.custom) {
      const sib = bankForIng(ing).filter((p) => p.store === prod.store && p.tier === prod.tier && p.brand === prod.brand).sort((a, b) => a.size - b.size);
      prod = sib.find((p) => p.size >= missing) || sib[sib.length - 1] || prod;
    }
    out.push({ ing, productId: prod.id, packs: Math.max(1, Math.ceil(missing / (prod.size || 1))), missing });
  }
  return out;
}

export function listItemInfo(s, item) {
  const prod = getProduct(s, item.productId);
  if (!prod) return { name: item.name, aisle: 'Divers', unitPrice: item.price || 0, emoji: '🛒', store: null, prod: null };
  return { name: prod.name, aisle: prod.aisle || 'Divers', unitPrice: productPrice(s, prod.id), emoji: prod.emoji || ING[prod.ing]?.emoji || '🛒', ing: prod.ing, store: prod.store, prod };
}
export const listTotal = (s, items) => items.reduce((sum, it) => sum + listItemInfo(s, it).unitPrice * it.qty, 0);

export function unitPriceLabel(s, p) {
  const ing = ING[p.ing];
  const price = productPrice(s, p.id);
  if (!p.size || !ing) return '';
  if (ing.unit === 'g') return `${euro((price / p.size) * 1000)}/kg`;
  if (ing.unit === 'ml') return `${euro((price / p.size) * 1000)}/L`;
  return `${euro(price / p.size)}/${ing.unitLabel || 'pièce'}`;
}

export const OUTSIDE_TAGS = [
  { id: 'kebab', label: 'Kebab', emoji: '🥙', kcal: 800 },
  { id: 'sandwich', label: 'Sandwich', emoji: '🥪', kcal: 550 },
  { id: 'resto', label: 'Resto', emoji: '🍽️', kcal: 850 },
  { id: 'pizza', label: 'Pizza', emoji: '🍕', kcal: 900 },
  { id: 'burger', label: 'Burger', emoji: '🍔', kcal: 850 },
  { id: 'sushi', label: 'Sushi', emoji: '🍣', kcal: 600 },
  { id: 'cantine', label: 'Cantine', emoji: '🍛', kcal: 700 },
  { id: 'amis', label: 'Chez des amis', emoji: '🏠', kcal: 750 },
  { id: 'boulangerie', label: 'Boulangerie', emoji: '🥐', kcal: 500 },
  { id: 'snack', label: 'Petit snack', emoji: '🍪', kcal: 250 },
];

export function slotKcal(s, slot) {
  if (!slot || slot.status === 'skipped') return { kcal: 0, prot: 0 };
  if (slot.status === 'outside') {
    const kcal = (slot.outside?.tags || []).reduce((n, id) => n + (OUTSIDE_TAGS.find((t) => t.id === id)?.kcal || 0), 0) || 600;
    return { kcal, prot: kcal * 0.04 };
  }
  const r = getRecipe(s, slot.recipeId);
  return r ? nutrition(recipeLines(r, slot.swaps, slot.servings || 1), s) : { kcal: 0, prot: 0 };
}

export function dayTotals(s, date) {
  const plan = s.plan[date] || {};
  let eaten = 0, planned = 0, protEaten = 0, protPlanned = 0;
  for (const m of MEAL_KEYS) {
    const slot = plan[m];
    if (!slot) continue;
    const k = slotKcal(s, slot);
    if (slot.status === 'eaten' || slot.status === 'outside') { eaten += k.kcal; protEaten += k.prot; }
    if (slot.status !== 'skipped') { planned += k.kcal; protPlanned += k.prot; }
  }
  return { eaten, planned, protEaten, protPlanned };
}

export { STORES, TIERS };
