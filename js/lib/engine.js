// Logique métier pure : nutrition, coût, stock, suggestions, compilation de la liste.
import { ING, SWAP_GROUPS } from '../data/ingredients.js';
import { PRODUCT, DEFAULT_PRODUCT } from '../data/catalog.js';
import { RECIPES, RECIPE, MEAL_KEYS } from '../data/recipes.js';
import { today, addDays, diffDays, weekDays, mondayOf, dlcInfo } from './dates.js';

export const uid = () => Math.random().toString(36).slice(2, 10);
export const euro = (n) => `${(Math.round(n * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
export const kcalFmt = (n) => Math.round(n).toLocaleString('fr-FR');

/* ---------- Prix ---------- */
export const productPrice = (s, id) => s.priceOverrides?.[id]?.price ?? PRODUCT[id]?.price ?? 0;
export function defaultProductFor(s, ing) {
  const pref = s.brandPrefs?.[ing];
  return (pref && PRODUCT[pref]) ? pref : DEFAULT_PRODUCT[ing];
}
export function unitCost(s, ing) {
  const pid = defaultProductFor(s, ing);
  const prod = PRODUCT[pid];
  return prod ? productPrice(s, pid) / prod.size : 0;
}

/* ---------- Recettes ---------- */
/** Lignes d'ingrédients d'une recette après swaps. swaps = { index: nouvelIngId } */
export function recipeLines(recipe, swaps = {}, servings = 1) {
  return recipe.ingredients.map((line, idx) => {
    const to = swaps[idx];
    if (to && to !== line.ing && ING[to]) {
      const from = ING[line.ing];
      const ratio = (from.portion && ING[to].portion) ? ING[to].portion / from.portion : 1;
      return { ...line, ing: to, qty: roundQty(line.qty * ratio * servings, ING[to].unit), swapped: line.ing, idx };
    }
    return { ...line, qty: roundQty(line.qty * servings, ING[line.ing].unit), idx };
  });
}
const roundQty = (q, unit) => (unit === 'pc' ? Math.round(q * 2) / 2 : Math.round(q));

export function nutrition(lines) {
  let kcal = 0, prot = 0;
  for (const l of lines) {
    const ing = ING[l.ing];
    const f = ing.unit === 'pc' ? l.qty : l.qty / 100;
    kcal += ing.kcal * f; prot += ing.prot * f;
  }
  return { kcal, prot };
}
export const linesCost = (s, lines) => lines.reduce((sum, l) => sum + unitCost(s, l.ing) * l.qty, 0);

export function recipeStats(s, recipe, swaps) {
  const lines = recipeLines(recipe, swaps);
  const { kcal, prot } = nutrition(lines);
  return { kcal, prot, cost: linesCost(s, lines), lines };
}
export function budgetLevel(cost) { return cost < 1.5 ? 1 : cost < 2.5 ? 2 : 3; }
export const budgetLabel = (lvl) => '€'.repeat(lvl);

export function swapOptions(line, prefs) {
  const group = SWAP_GROUPS[line.swap];
  if (!group) return [];
  return [line.ing, ...group.filter((id) => id !== line.ing && !prefs.nogo.includes(id))];
}

/* ---------- Stock ---------- */
export function stockQty(s, ing) {
  return s.inventory.filter((x) => x.ing === ing && !(dlcInfo(x.dlc).past)).reduce((n, x) => n + x.qty, 0);
}
export function stockMatch(s, lines) {
  let have = 0; const missing = [];
  for (const l of lines) {
    const ing = ING[l.ing];
    const q = stockQty(s, l.ing);
    if (ing.staple ? q > 0 : q >= l.qty) have++;
    else missing.push(l.ing);
  }
  return { have, total: lines.length, ratio: lines.length ? have / lines.length : 0, missing };
}
export function urgentIngs(s) {
  return [...new Set(s.inventory.filter((x) => { const d = dlcInfo(x.dlc); return d.days >= 0 && d.days <= 2; }).map((x) => x.ing).filter(Boolean))];
}

export function addToInventory(draft, { ing, qty, name, dlc, location, productId }) {
  const existing = draft.inventory.find((x) => x.ing === ing && ing && x.dlc === dlc && x.location === location);
  if (existing) { existing.qty += qty; return existing; }
  const item = { id: uid(), ing, name: name || ING[ing]?.name, qty, dlc, location: location || ING[ing]?.storage || 'placard', productId, addedAt: today() };
  draft.inventory.push(item);
  return item;
}

/** Retire les quantités du stock en commençant par les DLC les plus proches (FIFO). */
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

export function estimateDlc(productId, ing, from = today()) {
  const shelf = PRODUCT[productId]?.shelf ?? ING[ing]?.shelf ?? 7;
  return addDays(from, shelf);
}

/* ---------- Préférences ---------- */
export function isBlocked(recipe, prefs, swaps = {}) {
  return recipeLines(recipe, swaps).some((l) => prefs.nogo.includes(l.ing));
}
export function visibleRecipes(s) { return RECIPES.filter((r) => !isBlocked(r, s.prefs)); }

/* ---------- Planning ---------- */
export const slotOf = (s, date, meal) => s.plan[date]?.[meal];
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

/** Prochain créneau libre compatible avec la recette, à partir de maintenant. */
export function nextFreeSlot(s, recipe, { after } = {}) {
  const start = today();
  for (let k = 0; k < 10; k++) {
    const date = addDays(start, k);
    for (const meal of MEAL_KEYS) {
      if (!recipe.meals.includes(meal)) continue;
      if (isSlotPast(date, meal)) continue;
      if (after && (date < after.date || (date === after.date && MEAL_KEYS.indexOf(meal) <= MEAL_KEYS.indexOf(after.meal)))) continue;
      if (!s.plan[date]?.[meal]) return { date, meal };
    }
  }
  return null;
}

/** Suggestions intelligentes : stock, aliments refuges, anti-gaspi (DLC), variété, défis doux. */
export function suggest(s, { meal, date, n = 3, exclude = [] }) {
  const prefs = s.prefs;
  const weekIds = weekRecipeIds(s, mondayOf(date || today()));
  const urgent = urgentIngs(s);
  return RECIPES
    .filter((r) => (!meal || r.meals.includes(meal)) && !isBlocked(r, prefs) && !exclude.includes(r.id))
    .map((r) => {
      const lines = recipeLines(r);
      const ings = lines.map((l) => l.ing);
      const match = stockMatch(s, lines);
      const reasons = [];
      let score = match.ratio * 3;
      if (match.ratio === 1) reasons.push({ label: 'Tout en stock', tone: 'sage' });
      const anti = ings.filter((x) => urgent.includes(x));
      if (anti.length) { score += anti.length * 2; reasons.push({ label: `Anti-gaspi : ${ING[anti[0]].name.toLowerCase()}`, tone: 'amber' }); }
      const ref = ings.filter((x) => prefs.refuges.includes(x));
      score += ref.length * 1.1;
      if (ref.length >= 2) reasons.push({ label: 'Refuge', tone: 'sky' });
      const defi = ings.filter((x) => prefs.defis.includes(x));
      if (defi.length) { score += 0.5; reasons.push({ label: `Défi doux : ${ING[defi[0]].name.toLowerCase()}`, tone: 'lav' }); }
      const repeats = weekIds.filter((id) => id === r.id).length;
      score -= repeats * 2.2;
      score += (r.time <= 15 ? 0.4 : 0);
      return { recipe: r, score, reasons: reasons.slice(0, 2), match };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

/* ---------- Liste de courses ---------- */
/** Besoins manquants pour les créneaux prévus des dates données, déduits du stock. */
export function compileNeeds(s, dates) {
  const need = {};
  for (const date of dates) {
    for (const meal of MEAL_KEYS) {
      const slot = s.plan[date]?.[meal];
      if (!slot || slot.status !== 'planned' || !RECIPE[slot.recipeId]) continue;
      for (const l of recipeLines(RECIPE[slot.recipeId], slot.swaps)) need[l.ing] = (need[l.ing] || 0) + l.qty;
    }
  }
  const out = [];
  for (const [ing, qty] of Object.entries(need)) {
    const meta = ING[ing];
    const have = stockQty(s, ing);
    const pid = defaultProductFor(s, ing);
    const prod = PRODUCT[pid];
    if (!prod) continue;
    if (meta.staple) { if (have <= 0) out.push({ ing, productId: pid, packs: 1, missing: 0 }); continue; }
    const missing = qty - have;
    if (missing > 0.01) out.push({ ing, productId: pid, packs: Math.max(1, Math.ceil(missing / prod.size)), missing });
  }
  return out;
}

export function listItemInfo(s, item) {
  const prod = PRODUCT[item.productId];
  if (!prod) return { name: item.name, brand: null, aisle: 'Divers', unitPrice: item.price || 0, emoji: '🛒', size: null };
  return { name: prod.name, brand: prod.brand, aisle: prod.aisle, unitPrice: productPrice(s, prod.id), emoji: ING[prod.ing]?.emoji || '🛒', ing: prod.ing, prod };
}
export const listTotal = (s, items) => items.reduce((sum, it) => sum + listItemInfo(s, it).unitPrice * it.qty, 0);

/* ---------- Repas pris dehors ---------- */
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
  if (!slot) return { kcal: 0, prot: 0 };
  if (slot.status === 'skipped') return { kcal: 0, prot: 0 };
  if (slot.status === 'outside') {
    const kcal = (slot.outside?.tags || []).reduce((n, id) => n + (OUTSIDE_TAGS.find((t) => t.id === id)?.kcal || 0), 0) || 600;
    return { kcal, prot: kcal * 0.04 };
  }
  const r = RECIPE[slot.recipeId];
  return r ? nutrition(recipeLines(r, slot.swaps)) : { kcal: 0, prot: 0 };
}
