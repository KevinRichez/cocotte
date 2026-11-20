import { ING, INGREDIENTS, SWAP_GROUPS } from '../data/ingredients.js';
import { bank, bankProduct, bankForIng, STORES, TIERS } from '../data/products.js';
import { RECIPES, RECIPE, MEAL_KEYS } from '../data/recipes.js';
import { today, addDays, diffDays, weekDays, mondayOf, dlcInfo } from './dates.js';

export const uid = () => (crypto.randomUUID ? crypto.randomUUID().slice(0, 13) : Math.random().toString(36).slice(2, 12));
export const norm = (x) => String(x || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
export const euro = (n) => `${(Math.round(n * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
export const kcalFmt = (n) => Math.round(n).toLocaleString('fr-FR');

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
  const step = p.pace === 'actif' ? 500 : 300;
  let kcal = tdee + (dir === 'gain' ? step : dir === 'lose' ? -step : 0);
  if (dir === 'lose') kcal = Math.max(kcal, bmr * 1.1, 1300);
  const prot = Math.round(w * (dir === 'maintain' ? 1.4 : 1.8));
  return { kcal: Math.round(kcal / 50) * 50, prot, dir, bmr: Math.round(bmr), tdee: Math.round(tdee) };
}
export const GOAL_LABEL = { gain: 'Prendre du poids', maintain: 'Garder mon poids', lose: 'Perdre du poids' };

export const userStores = (s) => (s.profile.stores?.length ? s.profile.stores : ['leclerc']);

export function getProduct(s, id) {
  if (!id) return null;
  return bankProduct(id) || s.customProducts.find((p) => p.id === id) || null;
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
  const pool = bankForIng(ing).filter((p) => p.tier !== 'bio' && p.tier !== 'nat');
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
    if (sc >= 0) out.push({ p, sc: sc - stores.indexOf(p.store) * 0.3 - (p.tier === 'bio' || p.tier === 'nat' ? 0.4 : 0) });
  }
  return out.sort((a, b) => b.sc - a.sc || a.p.name.localeCompare(b.p.name)).slice(0, limit).map((x) => x.p);
}

export function searchIngredients(query, { limit = 30 } = {}) {
  const q = norm(query);
  if (!q) return INGREDIENTS.slice(0, limit);
  return INGREDIENTS.filter((i) => i.keys.includes(q)).sort((a, b) => (norm(a.name).startsWith(q) ? -1 : 0) - (norm(b.name).startsWith(q) ? -1 : 0)).slice(0, limit);
}

export const allRecipes = (s) => (s.customRecipes.length ? [...s.customRecipes, ...RECIPES] : RECIPES);
export const getRecipe = (s, id) => RECIPE[id] || s.customRecipes.find((r) => r.id === id) || null;

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
export function nutrition(lines) {
  let kcal = 0, prot = 0;
  for (const l of lines) {
    const ing = ING[l.ing];
    const f = ing.unit === 'pc' ? l.qty : l.qty / 100;
    kcal += ing.kcal * f; prot += ing.prot * f;
  }
  return { kcal, prot };
}
export const linesCost = (s, lines) => lines.reduce((sum, l) => sum + (ING[l.ing].staple ? 0 : unitCost(s, l.ing) * l.qty), 0);
export function recipeStats(s, recipe, swaps) {
  const lines = recipeLines(recipe, swaps);
  const { kcal, prot } = nutrition(lines);
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

export function stockQty(s, ing) {
  return s.inventory.filter((x) => x.ing === ing && !dlcInfo(x.dlc).past).reduce((n, x) => n + x.qty, 0);
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

export function addToInventory(draft, { ing, qty, name, dlc, location, productId, nutri }) {
  const existing = draft.inventory.find((x) => ing && x.ing === ing && x.dlc === dlc && x.location === location && x.productId === productId);
  if (existing) { existing.qty += qty; return existing; }
  const item = { id: uid(), ing: ing || null, name: name || ING[ing]?.name || 'Produit', qty, dlc: dlc || null, location: location || ING[ing]?.storage || 'placard', productId: productId || null, addedAt: today() };
  if (nutri) item.nutri = nutri;
  draft.inventory.push(item);
  return item;
}

export function consumeLines(draft, lines) {
  for (const l of lines) {
    if (ING[l.ing]?.staple) continue;
    let left = l.qty;
    const lots = draft.inventory.filter((x) => x.ing === l.ing).sort((a, b) => (a.dlc || '9').localeCompare(b.dlc || '9'));
    for (const lot of lots) {
      if (left <= 0) break;
      const take = Math.min(lot.qty, left);
      lot.qty = Math.round((lot.qty - take) * 10) / 10; left -= take;
    }
  }
  draft.inventory = draft.inventory.filter((x) => x.qty > 0);
}

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
export function suggest(s, { meal, date, n = 3, exclude = [] }) {
  const t = targets(s.profile);
  const weekIds = weekRecipeIds(s, mondayOf(date || today()));
  const urgent = urgentIngs(s);
  return allRecipes(s)
    .filter((r) => (!meal || r.meals.includes(meal)) && !exclude.includes(r.id) && !isBlocked(s, r))
    .map((r) => {
      const lines = recipeLines(r);
      const ings = lines.map((l) => l.ing);
      const { kcal, prot } = nutrition(lines);
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
      if (meal) {
        const budget = t.kcal * MEAL_SHARE[meal];
        const gap = (kcal - budget) / budget;
        if (t.dir === 'gain') score += Math.min(gap, 0.6) * 2 + (prot / Math.max(kcal, 1)) * 20;
        else if (t.dir === 'lose') score += -Math.abs(Math.max(gap, -0.2)) * 3 + (prot / Math.max(kcal, 1)) * 40;
        else score -= Math.abs(gap) * 1.5;
      }
      score -= weekIds.filter((id) => id === r.id).length * 2.2;
      score += r.time <= 15 ? 0.4 : 0;
      return { recipe: r, score, reasons: reasons.slice(0, 2), match, kcal, prot };
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
      for (const l of recipeLines(r, slot.swaps)) need[l.ing] = (need[l.ing] || 0) + l.qty;
    }
  }
  const out = [];
  for (const [ing, qty] of Object.entries(need)) {
    const have = stockQty(s, ing);
    const pid = defaultProductFor(s, ing);
    const prod = getProduct(s, pid);
    if (!prod) continue;
    if (ING[ing].staple) { if (have <= 0) out.push({ ing, productId: pid, packs: 1, missing: 0 }); continue; }
    const missing = qty - have;
    if (missing > 0.01) out.push({ ing, productId: pid, packs: Math.max(1, Math.ceil(missing / (prod.size || 1))), missing });
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
  return r ? nutrition(recipeLines(r, slot.swaps)) : { kcal: 0, prot: 0 };
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
