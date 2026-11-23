import { update, restore, getState, backupNow } from './store.js';
import { toast } from './lib/toast.js';
import { MEALS, MEAL_KEYS, RECIPE } from './data/recipes.js';
import { ING, guessIngredient, matchIngredientText } from './data/ingredients.js';
import { today, relDay, addDays } from './lib/dates.js';
import {
  uid, recipeLines, consumeLines, restoreTaken, nextMainSlot, batchIngOf, equivOf, autoSwaps, slotLines, batchOver, compileNeeds, nextFreeSlot, addToInventory, estimateDlc,
  listItemInfo, listTotal, euro, getProduct, getRecipe, defaultProductFor, slotKcal, isSlotPast,
} from './lib/engine.js';

const undoable = (prev, message) => toast(message, { action: 'Annuler', onAction: () => restore(prev) });
const mealName = (m) => MEALS[m].label.toLowerCase();

export function planRecipe(date, meal, recipeId, swaps = {}, servings = 1) {
  if (!swaps || !Object.keys(swaps).length) { const r = getRecipe(getState(), recipeId); swaps = r ? autoSwaps(getState(), r) : {}; }
  const prev = update((d) => {
    d.plan[date] = d.plan[date] || {};
    d.plan[date][meal] = { recipeId, swaps, status: 'planned', ...(servings !== 1 ? { servings } : {}) };
  });
  const x = servings !== 1 ? ` x${String(servings).replace('.', ',')}` : '';
  undoable(prev, `${getRecipe(getState(), recipeId)?.name}${x} · ${relDay(date)}, ${mealName(meal)}`);
}

// Créneaux « reste » qui dépendent de ce plat (même recette, dans les 2 jours)
function leftoverSlotsOf(d, date, meal, recipeId) {
  const out = [];
  for (let k = 0; k <= 2; k++) {
    const day = addDays(date, k);
    for (const m of ['dej', 'diner']) {
      if (k === 0 && (m === meal || (meal === 'diner' && m === 'dej'))) continue;
      const sl = d.plan[day]?.[m];
      if (sl?.leftover && sl.status === 'planned' && sl.recipeId === recipeId && !d.inventory.some((x) => x.forSlot === `${day}|${m}`)) out.push({ date: day, meal: m, slot: sl });
    }
  }
  return out;
}

function eatInDraft(d, date, meal) {
  const slot = d.plan[date]?.[meal];
  if (!slot || slot.status !== 'planned') return false;
  slot.status = 'eaten';
  const r = getRecipe(d, slot.recipeId);
  if (!r) return true;
  const lot = slot.leftover && d.inventory.find((x) => x.forSlot === `${date}|${meal}`);
  if (lot) {
    // Reste déjà cuisiné : on le sort du frigo, rien d'autre n'est déduit
    slot.ateLeftover = { ...lot };
    d.inventory = d.inventory.filter((x) => x.id !== lot.id);
    return true;
  }
  // Cuisson pour ce repas et ses restes : tout est déduit maintenant, les parts vont au frigo
  const rest = slot.leftover ? [] : leftoverSlotsOf(d, date, meal, r.id);
  const lines = [slot, ...rest.map((x) => x.slot)].flatMap((sl) => slotLines(sl, r));
  slot.consumed = consumeLines(d, lines);
  slot.leftoverLots = rest.map((x) => {
    const id = uid();
    d.inventory.push({ id, ing: null, unit: 'pc', qty: 1, name: `Reste : ${r.name}`, leftoverOf: r.id, forSlot: `${x.date}|${x.meal}`, location: 'frigo', dlc: addDays(date, 2), productId: null, addedAt: today() });
    return id;
  });
  return true;
}

export function markEaten(date, meal) {
  const prev = update((d) => { eatInDraft(d, date, meal); });
  undoable(prev, 'Bon appétit ! Stock mis à jour');
}

export function markDayEaten(date) {
  let n = 0;
  const prev = update((d) => { for (const m of MEAL_KEYS) if (eatInDraft(d, date, m)) n++; });
  if (n) undoable(prev, `${n} repas validé${n > 1 ? 's' : ''} · stock mis à jour`);
}

export function markOutside(date, meal, { tags, note }) {
  let replaced = null;
  const prev = update((d) => {
    d.plan[date] = d.plan[date] || {};
    const slot = d.plan[date][meal];
    if (slot?.recipeId && slot.status === 'planned') {
      d.deferred.push({ id: uid(), recipeId: slot.recipeId, swaps: slot.swaps || {}, from: { date, meal } });
      replaced = getRecipe(d, slot.recipeId)?.name;
    }
    d.plan[date][meal] = { status: 'outside', outside: { tags, note } };
  });
  undoable(prev, replaced ? `Noté · « ${replaced} » sera re-proposé` : 'Noté, profite bien !');
}

export function skipSlot(date, meal) {
  const prev = update((d) => {
    d.plan[date] = d.plan[date] || {};
    const slot = d.plan[date][meal];
    if (slot?.recipeId && slot.status === 'planned' && meal !== 'collation') {
      d.deferred.push({ id: uid(), recipeId: slot.recipeId, swaps: slot.swaps || {}, from: { date, meal } });
    }
    d.plan[date][meal] = { status: 'skipped', recipeId: slot?.recipeId };
  });
  undoable(prev, 'Repas passé');
}

export function resetSlot(date, meal) {
  update((d) => {
    const slot = d.plan[date]?.[meal];
    if (!slot) return;
    if (slot.status === 'eaten' && slot.consumed) restoreTaken(d, slot.consumed);
    if (slot.status === 'eaten' && slot.leftoverLots) d.inventory = d.inventory.filter((x) => !slot.leftoverLots.includes(x.id));
    if (slot.status === 'eaten' && slot.ateLeftover) d.inventory.push(slot.ateLeftover);
    if (slot.recipeId) d.plan[date][meal] = { recipeId: slot.recipeId, swaps: slot.swaps || {}, status: 'planned', ...(slot.servings ? { servings: slot.servings } : {}), ...(slot.over ? { over: slot.over } : {}), ...(slot.leftover ? { leftover: true } : {}), ...(slot.fullPortion ? { fullPortion: true } : {}) };
    else delete d.plan[date][meal];
  });
}

export function clearSlot(date, meal) {
  const prev = update((d) => { if (d.plan[date]) delete d.plan[date][meal]; });
  undoable(prev, 'Créneau libéré');
}

export function placeDeferred(id, target) {
  const s = getState();
  const item = s.deferred.find((x) => x.id === id);
  const r = item && getRecipe(s, item.recipeId);
  if (!r) return;
  const slot = target || nextFreeSlot(s, r);
  if (!slot) { toast('Aucun créneau libre cette semaine'); return; }
  const prev = update((d) => {
    d.plan[slot.date] = d.plan[slot.date] || {};
    d.plan[slot.date][slot.meal] = { recipeId: item.recipeId, swaps: item.swaps, status: 'planned' };
    d.deferred = d.deferred.filter((x) => x.id !== id);
  });
  undoable(prev, `Recasé ${relDay(slot.date).toLowerCase()}, ${mealName(slot.meal)}`);
}
export const dropDeferred = (id) => update((d) => { d.deferred = d.deferred.filter((x) => x.id !== id); });

export function autofillWeek(dates, suggestFn) {
  let n = 0;
  const prev = update((d) => {
    for (const date of dates) {
      for (const meal of MEAL_KEYS) {
        if (d.plan[date]?.[meal]) continue;
        const best = suggestFn(d, date, meal);
        if (!best) continue;
        d.plan[date] = d.plan[date] || {};
        d.plan[date][meal] = { recipeId: best.recipe.id, swaps: autoSwaps(d, best.recipe), status: 'planned', ...(best.servings !== 1 ? { servings: best.servings } : {}) };
        n++;
      }
    }
  });
  if (n) undoable(prev, `${n} créneau${n > 1 ? 'x' : ''} rempli${n > 1 ? 's' : ''}`);
  else toast('Ta semaine est déjà bien remplie');
}

export function generateList(dates) {
  const needs = compileNeeds(getState(), dates);
  const prev = update((d) => {
    d.shoppingList = d.shoppingList.filter((x) => !(x.source === 'plan' && !x.checked));
    for (const n of needs) {
      const ex = d.shoppingList.find((x) => x.productId === n.productId);
      if (ex) ex.qty = Math.max(ex.qty, n.packs);
      else d.shoppingList.push({ id: uid(), productId: n.productId, qty: n.packs, checked: false, source: 'plan' });
    }
    d.ui.tab = 'shop'; d.ui.shopTab = 'list';
  });
  const st = getState();
  if (needs.length) undoable(prev, `${needs.length} produit${needs.length > 1 ? 's' : ''} manquant${needs.length > 1 ? 's' : ''} · ${euro(listTotal(st, st.shoppingList))}`);
  else toast('Tout est déjà dans tes placards');
}

export function addToList(productId, qty = 1, { silent } = {}) {
  update((d) => {
    const ex = d.shoppingList.find((x) => x.productId === productId && !x.checked);
    if (ex) ex.qty += qty;
    else d.shoppingList.push({ id: uid(), productId, qty, checked: false, source: 'manual' });
  });
  if (!silent) toast(`${getProduct(getState(), productId)?.name} ajouté`);
}
export function addIngsToList(ings) {
  const s = getState();
  let n = 0;
  update((d) => {
    for (const ing of ings) {
      const pid = defaultProductFor(s, ing);
      if (!pid || d.shoppingList.some((x) => x.productId === pid && !x.checked)) continue;
      d.shoppingList.push({ id: uid(), productId: pid, qty: 1, checked: false, source: 'manual' }); n++;
    }
  });
  toast(n ? `${n} produit${n > 1 ? 's' : ''} ajouté${n > 1 ? 's' : ''} à la liste` : 'Déjà dans ta liste');
}
export const toggleItem = (id) => update((d) => { const it = d.shoppingList.find((x) => x.id === id); if (it) it.checked = !it.checked; });
export function checkAll(on = true) {
  const prev = update((d) => { d.shoppingList.forEach((x) => { x.checked = on; }); });
  undoable(prev, on ? 'Tout est dans le caddie' : 'Tout est décoché');
}
export const setItemQty = (id, qty) => update((d) => {
  if (qty <= 0) d.shoppingList = d.shoppingList.filter((x) => x.id !== id);
  else { const it = d.shoppingList.find((x) => x.id === id); if (it) it.qty = qty; }
});
export function removeItem(id) {
  const prev = update((d) => { d.shoppingList = d.shoppingList.filter((x) => x.id !== id); });
  undoable(prev, 'Article retiré');
}
// Un produit scanné, photographié ou corrigé devient la fiche de référence
// de son aliment : tickets, liste de courses et recettes la reprennent.
function rememberRef(d, productId) {
  const p = getProduct(d, productId);
  if (!p?.ing || !ING[p.ing] || p.ignored) return;
  if ((p.image && !p.stockPhoto) || p.barcode || p.offName || p.nutri || p.edited) d.brandPrefs[p.ing] = p.id;
}

export function swapItemProduct(id, productId) {
  update((d) => {
    const it = d.shoppingList.find((x) => x.id === id);
    if (!it) return;
    it.productId = productId;
    const ing = getProduct(d, productId)?.ing;
    if (ing) d.brandPrefs[ing] = productId;
  });
}

function stockFromProduct(d, productId, packs, dlc) {
  const p = getProduct(d, productId);
  if (!p) return;
  const ing = p.ing && ING[p.ing] ? p.ing : null;
  addToInventory(d, {
    ing, productId: p.id, name: p.custom ? p.name : (ING[p.ing]?.name || p.name),
    qty: p.size && (ing || p.unit) ? p.size * packs : packs,
    unit: !ing && p.size ? p.unit : null,
    dlc: dlc || estimateDlc(d, p.id, ing),
    location: p.storage || ING[ing]?.storage || 'placard',
    nutri: p.nutri,
  });
}

export function finishShopping({ keepUnchecked = false, dlcOverrides = {} } = {}) {
  const s = getState();
  const bought = s.shoppingList.filter((x) => x.checked);
  if (!bought.length) return;
  const t = today();
  const items = bought.map((it) => {
    const info = listItemInfo(s, it);
    return { productId: it.productId || null, name: info.name, store: info.store, aisle: info.aisle, qty: it.qty, price: info.unitPrice };
  });
  const total = Math.round(items.reduce((n, x) => n + x.price * x.qty, 0) * 100) / 100;
  const prev = update((d) => {
    d.history.unshift({ id: uid(), date: t, total, count: items.reduce((n, x) => n + x.qty, 0), items, source: 'app' });
    for (const it of bought) {
      if (getProduct(d, it.productId)) stockFromProduct(d, it.productId, it.qty, dlcOverrides[it.id]);
      else addToInventory(d, { ing: guessIngredient(it.name), name: it.name, qty: it.qty, dlc: dlcOverrides[it.id] || null, location: 'placard' });
    }
    d.shoppingList = keepUnchecked ? d.shoppingList.filter((x) => !x.checked) : [];
    d.ui.shopTab = 'history';
  });
  undoable(prev, `Courses rangées · ${euro(total)}`);
}

export function applyTicket(items, dlcs = {}, draft = null) {
  const t = today();
  const prev = update((d) => {
    const hItems = [];
    for (const it of items) {
      const ing = it.ing && ING[it.ing] ? it.ing : null;
      const size = it.size > 0 ? it.size : null;
      const linked = ing && (!size || ING[ing].unit === it.unit) ? ing : null;
      let p = d.customProducts.find((x) => x.ticketKey === it.ticketKey && x.store === it.store);
      const data = {
        name: it.name.trim().slice(0, 80) || it.label, ing: ing || null, size, unit: it.unit, store: it.store, price: it.unitPrice,
        ticketKey: it.ticketKey, packCount: it.packCount || 1, storage: it.storage, aisle: ING[ing]?.aisle || 'Divers', emoji: it.ignored ? '🚫' : ING[ing]?.emoji || '🛒', custom: true,
        ignored: !!it.ignored, ignoredReason: it.ignoredReason || null,
        ...(it.image ? { image: it.image } : {}), ...(it.nutri ? { nutri: it.nutri } : {}), ...(it.barcode ? { barcode: it.barcode } : {}), ...(it.brand ? { brand: it.brand } : {}),
      };
      if (p) Object.assign(p, data);
      else { p = { id: `perso.${uid()}`, ...data }; d.customProducts.push(p); }
      if (it.edited) p.edited = true;
      if (!it.ignored) rememberRef(d, p.id);
      if (!it.ignored) addToInventory(d, {
        ing: linked, productId: p.id, name: p.name,
        qty: size ? size * (it.packCount || 1) * it.qty : it.qty * (it.packCount || 1), unit: linked ? null : (size ? it.unit : null),
        dlc: dlcs[it.key] || estimateDlc(d, p.id, ing), location: it.storage, nutri: it.nutri || undefined,
      });
      d.shoppingList.forEach((x) => { if (ing && getProduct(d, x.productId)?.ing === ing) x.checked = true; });
      hItems.push({ productId: p.id, name: p.name, store: it.store, aisle: p.aisle, qty: it.qty, price: it.unitPrice, ...(it.ignored ? { ignored: true } : {}) });
    }
    const food = hItems.filter((x) => !x.ignored);
    const total = Math.round(food.reduce((n, x) => n + x.price * x.qty, 0) * 100) / 100;
    const ticketTotal = Math.round(hItems.reduce((n, x) => n + x.price * x.qty, 0) * 100) / 100;
    d.history.unshift({ id: uid(), date: t, total, ticketTotal, count: food.reduce((n, x) => n + x.qty, 0), items: hItems, source: 'ticket' });
    d.shoppingList = d.shoppingList.filter((x) => !x.checked);
    d.lastTicketSync = t;
  });
  // Annuler : retire le stock et la course, mais garde tes scans et corrections
  // et rouvre l'aperçu du ticket tel que tu l'avais laissé.
  toast(`Ticket importé · ${items.filter((x) => !x.ignored).length} produits rangés`, { action: 'Annuler', duration: 8000, onAction: () => {
    if (draft) { try { localStorage.setItem('cocotte:ticket-draft', JSON.stringify(draft)); } catch {} }
    const cur = getState();
    restore({ ...prev, customProducts: cur.customProducts, brandPrefs: cur.brandPrefs, productOverrides: cur.productOverrides, ui: { ...prev.ui, tab: 'shop', reopenTicket: Date.now() } });
  } });
}

export function saveCustomProduct(product) {
  const id = product.id || `perso.${uid()}`;
  update((d) => {
    const i = d.customProducts.findIndex((p) => p.id === id || (product.barcode && p.barcode === product.barcode));
    const p = { aisle: 'Divers', emoji: ING[product.ing]?.emoji || '🛒', ...product, id, custom: true };
    if (i >= 0) d.customProducts[i] = { ...d.customProducts[i], ...p, id: d.customProducts[i].id };
    else d.customProducts.push(p);
  });
  const s = getState();
  return s.customProducts.find((p) => p.id === id || (product.barcode && p.barcode === product.barcode))?.id || id;
}

export function addStock({ productId, ing, name, qty, unit, dlc, location, nutri }) {
  const prev = update((d) => { addToInventory(d, { productId, ing, name, qty, unit, dlc, location, nutri }); rememberRef(d, productId); });
  undoable(prev, `${name} rangé au ${location === 'frigo' ? 'frigo' : 'placard'}`);
}
export const updateStockItem = (id, patch) => update((d) => {
  const it = d.inventory.find((x) => x.id === id);
  if (it) Object.assign(it, patch);
  if (it && patch.name && it.productId) {
    const custom = d.customProducts.find((p) => p.id === it.productId);
    if (custom) Object.assign(custom, { name: patch.name, offName: patch.name, edited: true });
    else if (getProduct(d, it.productId)) d.productOverrides[it.productId] = { ...(d.productOverrides[it.productId] || {}), offName: patch.name, edited: true };
    rememberRef(d, it.productId);
  }
  d.inventory = d.inventory.filter((x) => x.qty > 0);
});
export function removeStockItem(id) {
  const name = getState().inventory.find((x) => x.id === id)?.name;
  const prev = update((d) => { d.inventory = d.inventory.filter((x) => x.id !== id); });
  undoable(prev, `${name} retiré du stock`);
}

export function setTier(kind, id, tier) {
  update((d) => {
    if (tier) d.prefs[kind][id] = tier;
    else delete d.prefs[kind][id];
  });
}
export const setProfile = (patch) => update((d) => { Object.assign(d.profile, patch); });

export function saveRecipe(recipe) {
  const id = recipe.id || `perso_${uid()}`;
  const prev = update((d) => {
    const r = { ...recipe, id, custom: true, override: !!RECIPE[id] };
    const i = d.customRecipes.findIndex((x) => x.id === id);
    if (i >= 0) d.customRecipes[i] = r; else d.customRecipes.unshift(r);
  });
  undoable(prev, recipe.id ? 'Recette mise à jour' : 'Recette créée');
  return id;
}
export function deleteRecipe(id, { restoreOriginal } = {}) {
  const prev = update((d) => {
    d.customRecipes = d.customRecipes.filter((r) => r.id !== id);
    if (!restoreOriginal) delete d.prefs.recipe[id];
  });
  undoable(prev, restoreOriginal ? 'Recette d’origine rétablie' : 'Recette supprimée');
}
// Cuisiner en double : le même plat au créneau suivant (soir puis midi du lendemain)
export function planLeftover(date, meal, to = null) {
  const s = getState();
  const slot = s.plan[date]?.[meal];
  const next = to || nextMainSlot(date, meal);
  if (!slot?.recipeId || !next) return;
  const prev = update((d) => {
    d.plan[next.date] = d.plan[next.date] || {};
    const r = getRecipe(d, slot.recipeId);
    const over = r && batchOver(d, r);
    d.plan[next.date][next.meal] = { recipeId: slot.recipeId, swaps: slot.swaps || {}, status: 'planned', leftover: true, ...(slot.servings ? { servings: slot.servings } : {}), ...(over ? { over } : {}) };
    if (over && d.plan[date][meal].status === 'planned') d.plan[date][meal].over = over;
  });
  undoable(prev, `Reste prévu · ${relDay(next.date)}, ${mealName(next.meal)}`);
}

// Semaine : toutes les portions à 1 (une sauvegarde automatique est faite avant)
export function resetWeekPortions(dates) {
  backupNow(getState(), 'avant');
  let n = 0;
  const prev = update((d) => {
    for (const date of dates) for (const m of MEAL_KEYS) {
      const slot = d.plan[date]?.[m];
      if (slot?.servings && slot.servings !== 1 && slot.status === 'planned') { delete slot.servings; n++; }
    }
  });
  if (n) undoable(prev, `${n} portion${n > 1 ? 's' : ''} remise${n > 1 ? 's' : ''} à 1`);
  else toast('Toutes les portions sont déjà à 1');
}

// Semaine : deux plats différents avec la même barquette de suite deviennent le même plat (soir + midi du lendemain)
export function groupLeftovers(dates) {
  backupNow(getState(), 'avant');
  let n = 0;
  const prev = update((d) => {
    const seq = dates.flatMap((date) => ['dej', 'diner'].map((meal) => ({ date, meal })));
    for (let i = 0; i < seq.length - 1; i++) {
      const a = d.plan[seq[i].date]?.[seq[i].meal];
      const b = d.plan[seq[i + 1].date]?.[seq[i + 1].meal];
      if (!a || !b || b.status !== 'planned' || a.status === 'skipped' || a.status === 'outside') continue;
      const ra = getRecipe(d, a.recipeId), rb = getRecipe(d, b.recipeId);
      const pa = batchIngOf(ra), pb = batchIngOf(rb);
      if (!pa || !pb || ra.id === rb.id) { if (ra && rb && ra.id === rb.id) i++; continue; }
      const same = pa === pb || equivOf(pa).includes(pb);
      if (!same) continue;
      const over = batchOver(d, ra);
      d.plan[seq[i + 1].date][seq[i + 1].meal] = { recipeId: ra.id, swaps: a.swaps || {}, status: 'planned', leftover: true, ...(a.servings ? { servings: a.servings } : {}), ...(over ? { over } : {}) };
      if (over && a.status === 'planned') a.over = over;
      n++; i++;
    }
  });
  if (n) undoable(prev, `${n} plat${n > 1 ? 's' : ''} regroupé${n > 1 ? 's' : ''} en restes`);
  else toast('Rien à regrouper cette semaine');
}

export function addExtra(date, meal, extra) {
  const prev = update((d) => {
    d.extras = d.extras || {};
    d.extras[date] = d.extras[date] || {};
    d.extras[date][meal] = [...(d.extras[date][meal] || []), { id: uid(), ...extra }];
  });
  undoable(prev, `${extra.name} ajouté`);
}
export function removeExtra(date, meal, id) {
  const prev = update((d) => {
    const list = d.extras?.[date]?.[meal];
    if (list) d.extras[date][meal] = list.filter((x) => x.id !== id);
  });
  undoable(prev, 'Retiré');
}

export function setSlotServings(date, meal, servings) {
  update((d) => {
    const slot = d.plan[date]?.[meal];
    if (!slot) return;
    if (servings === 1) delete slot.servings; else slot.servings = servings;
  });
}

// Produits mémorisés (tickets, scans, créations) qui ne sont plus en stock
// Change l'aliment ou l'unité d'un produit en stock, et retient le choix pour la suite
export function relinkStockItem(id, { ing, unit }) {
  update((d) => {
    const it = d.inventory.find((x) => x.id === id);
    if (!it) return;
    const u = ing ? ING[ing].unit : unit;
    const before = it.ing ? ING[it.ing].unit : it.unit;
    if (before && u && before !== u) {
      // Changement d'unité (ex : tortillas en g vers pièces) : estimation à partir du nombre de paquets
      const prod = getProduct(d, it.productId);
      const packs = prod?.size ? Math.max(1, Math.round(it.qty / prod.size)) : 1;
      it.qty = ing ? packs * (ING[ing].pack?.size || 1) : packs;
    }
    it.ing = ing || null;
    it.unit = ing ? null : u;
    const p = it.productId && d.customProducts.find((x) => x.id === it.productId);
    if (p) {
      if ((p.unit || ING[p.ing]?.unit) !== u) p.size = null;
      Object.assign(p, { unit: u, ing: ing || null, edited: true });
      if (ing) { p.emoji = ING[ing].emoji; p.aisle = ING[ing].aisle; }
      rememberRef(d, p.id);
    } else if (it.productId && getProduct(d, it.productId)) {
      d.productOverrides[it.productId] = { ...(d.productOverrides[it.productId] || {}), ing: ing || null, unit: u, edited: true };
      rememberRef(d, it.productId);
    }
  });
}

// Recette modifiée avec un de tes produits : il devient la référence de l'aliment
export function useProductForIng(productId, ing) {
  update((d) => {
    const p = d.customProducts.find((x) => x.id === productId);
    if (p && !p.ing && ing) Object.assign(p, { ing, unit: ING[ing].unit, edited: true });
    const prod = getProduct(d, productId);
    if (prod?.ing === ing) d.brandPrefs[ing] = productId;
  });
}

// Format d'un paquet (ex : 1000 g) : la quantité en stock ne change pas, seul l'affichage passe à « 3 × 1 kg »
export function setProductSize(lotId, size) {
  update((d) => {
    const it = d.inventory.find((x) => x.id === lotId);
    if (!it?.productId) return;
    const unit = it.ing ? ING[it.ing].unit : it.unit;
    const p = d.customProducts.find((x) => x.id === it.productId);
    const patch = { size: size > 0 ? size : null, unit, edited: true };
    if (p) Object.assign(p, patch);
    else if (getProduct(d, it.productId)) d.productOverrides[it.productId] = { ...(d.productOverrides[it.productId] || {}), ...patch };
  });
}

// Modifier une fiche produit (nom, format, aliment, rangement), même hors stock
export function updateProduct(productId, patch) {
  update((d) => {
    const custom = d.customProducts.find((p) => p.id === productId);
    const base = getProduct(d, productId);
    if (!base) return;
    const clean = { ...patch, edited: true };
    if ('name' in clean) { clean.offName = clean.name; if (!custom) delete clean.name; }
    if ('ing' in clean && clean.ing) { clean.unit = ING[clean.ing].unit; if (custom) { custom.emoji = ING[clean.ing].emoji; custom.aisle = ING[clean.ing].aisle; } }
    if (custom) Object.assign(custom, clean);
    else d.productOverrides[productId] = { ...(d.productOverrides[productId] || {}), ...clean };
    for (const lot of d.inventory.filter((x) => x.productId === productId)) {
      if ('name' in patch) lot.name = patch.name;
      if ('ing' in patch) { lot.ing = patch.ing || null; lot.unit = patch.ing ? null : (patch.unit || lot.unit); }
      else if ('unit' in patch && !lot.ing) lot.unit = patch.unit;
    }
    rememberRef(d, productId);
  });
}

export function deleteProduct(productId) {
  const prev = update((d) => {
    d.customProducts = d.customProducts.filter((p) => p.id !== productId);
    delete d.productOverrides[productId];
    for (const [k, v] of Object.entries(d.brandPrefs)) if (v === productId) delete d.brandPrefs[k];
    for (const lot of d.inventory) if (lot.productId === productId) lot.productId = null;
  });
  undoable(prev, 'Fiche produit supprimée');
}

// Correction unique : produits reliés par l'ancien moteur (ex : pâte à tartiner -> pâtes) et jamais corrigés par toi
export function relinkLegacy() {
  const s = getState();
  if (s.flags?.relinkV2) return;
  const fixes = [];
  for (const p of s.customProducts) {
    if (p.edited || p.ignored || !p.ing) continue;
    const m = matchIngredientText(`${p.offName || ''} ${p.name || ''}`);
    if (m && m !== p.ing && ING[m].unit === ING[p.ing].unit) fixes.push([p.id, m]);
  }
  if (fixes.length) backupNow(s, 'avant');
  const prev = update((d) => {
    d.flags = { ...(d.flags || {}), relinkV2: true };
    for (const [id, ing] of fixes) {
      const p = d.customProducts.find((x) => x.id === id);
      const old = p.ing;
      Object.assign(p, { ing, emoji: ING[ing].emoji, aisle: ING[ing].aisle });
      for (const lot of d.inventory) if (lot.productId === id && lot.ing === old) lot.ing = ing;
      if (d.brandPrefs[old] === id) delete d.brandPrefs[old];
    }
  });
  if (fixes.length) toast(`${fixes.length} produit${fixes.length > 1 ? 's' : ''} mieux reconnu${fixes.length > 1 ? 's' : ''} (ex : pâte à tartiner)`, { action: 'Annuler', onAction: () => restore(prev), duration: 8000 });
}

// Recettes allégées : les repas jusqu'au lundi 23 novembre gardent exactement leurs quantités
export function keepPastPortionsV1() {
  const s = getState();
  if (s.flags?.lightV1) return;
  const custom = new Set(s.customRecipes.map((r) => r.id));
  let n = 0;
  update((d) => {
    d.flags = { ...(d.flags || {}), lightV1: true };
    for (const [date, slots] of Object.entries(d.plan)) {
      if (date > '2026-11-23') continue;
      for (const slot of Object.values(slots || {})) {
        const r = slot?.recipeId && !custom.has(slot.recipeId) ? RECIPE[slot.recipeId] : null;
        if (!r || !r.lightFactor || r.lightFactor === 1) continue;
        slot.fullPortion = true;
        n++;
      }
    }
  });
  toast('Recettes allégées pour la suite (environ 25 % en moins). Tes repas d’avant restent inchangés.', { duration: 7000 });
  return n;
}

export function restockCandidates(s) {
  const inStock = new Set(s.inventory.map((x) => x.productId).filter(Boolean));
  const ids = [...s.customProducts.filter((p) => !p.ignored).map((p) => p.id).reverse(), ...Object.keys(s.productOverrides || {})];
  return [...new Set(ids)].filter((id) => !inStock.has(id)).map((id) => getProduct(s, id)).filter(Boolean);
}

export function restockProducts(ids) {
  const prev = update((d) => {
    for (const id of ids) {
      const p = getProduct(d, id);
      if (!p) continue;
      const ing = p.ing && ING[p.ing] ? p.ing : null;
      const linked = ing && (!p.size || ING[ing].unit === p.unit) ? ing : null;
      const n = p.packCount || 1;
      addToInventory(d, {
        ing: linked, productId: p.id, name: p.name,
        qty: p.size ? p.size * n : n, unit: linked ? null : (p.size ? p.unit : null),
        dlc: estimateDlc(d, p.id, ing), location: p.storage || ING[ing]?.storage || 'placard', nutri: p.nutri || undefined,
      });
    }
  });
  undoable(prev, `${ids.length} produit${ids.length > 1 ? 's' : ''} remis en stock`);
}

export function resetStockAndHistory() {
  const prev = update((d) => {
    d.inventory = [];
    d.history = [];
    d.priceOverrides = {};
    d.lastTicketSync = null;
  });
  toast('Placards, frigo et historique remis à zéro', { action: 'Annuler', onAction: () => restore(prev), duration: 8000 });
}

export function adjustDayPortions(date, target) {
  let changed = 0;
  const prev = update((d) => {
    const plan = d.plan[date] || {};
    let fixed = 0, flexible = 0;
    const flex = [];
    for (const m of MEAL_KEYS) {
      const slot = plan[m];
      if (!slot || slot.status === 'skipped') continue;
      const k = slotKcal(d, slot).kcal;
      if (slot.status === 'planned' && !isSlotPast(date, m) && getRecipe(d, slot.recipeId)) { flex.push({ slot, base: k / (slot.servings || 1) }); flexible += k; }
      else fixed += k;
    }
    if (!flex.length || flexible <= 0) return;
    const factor = Math.max(0, target - fixed) / flex.reduce((n, x) => n + x.base, 0);
    for (const x of flex) {
      const sv = Math.min(2.5, Math.max(0.75, Math.round(factor * 4) / 4));
      if (sv !== (x.slot.servings || 1)) changed++;
      if (sv === 1) delete x.slot.servings; else x.slot.servings = sv;
    }
  });
  if (changed) undoable(prev, 'Portions ajustées pour atteindre ton objectif');
  else toast('Les portions sont déjà au maximum conseillé');
}

export function enrichFromScan({ lotId, productId }, off) {
  let label = off.name;
  const prev = update((d) => {
    const lot = lotId ? d.inventory.find((x) => x.id === lotId) : null;
    const pid = productId || lot?.productId;
    const info = { offName: off.name, image: off.image || undefined, nutri: off.nutri || undefined, barcode: off.barcode, brand: off.brand || undefined, quantity: off.quantity || undefined };
    Object.keys(info).forEach((k) => info[k] === undefined && delete info[k]);
    const custom = pid && d.customProducts.find((p) => p.id === pid);
    const ingId = lot?.ing || custom?.ing || getProduct(d, pid)?.ing || off.ing;
    if (off.size && (!ingId || ING[ingId].unit === off.unit)) { info.size = off.size; info.unit = off.unit; }
    let oldSize = null;
    if (custom) { oldSize = custom.size; Object.assign(custom, info, { name: off.name }); }
    else if (pid && getProduct(d, pid)) { oldSize = getProduct(d, pid).size; d.productOverrides[pid] = { ...(d.productOverrides[pid] || {}), ...info }; }
    else if (lot) {
      const p = { id: `perso.${uid()}`, name: off.name, ing: lot.ing || off.ing || null, store: null, price: 0, storage: lot.location, custom: true, emoji: ING[lot.ing]?.emoji || '🛒', aisle: ING[lot.ing]?.aisle || 'Divers', ...info };
      d.customProducts.push(p);
      lot.productId = p.id;
    }
    if (lot) {
      lot.name = off.name;
      if (off.nutri) lot.nutri = off.nutri;
      const unitOk = !lot.ing || !off.size || ING[lot.ing].unit === off.unit;
      if (off.size && unitOk && oldSize && Math.abs(lot.qty / oldSize - Math.round(lot.qty / oldSize)) < 0.01) lot.qty = Math.round(lot.qty / oldSize) * off.size;
      if (!lot.ing && off.size) lot.unit = off.unit;
    }
    rememberRef(d, lot?.productId || pid);
  });
  undoable(prev, `Fiche mise à jour : ${label}`);
}
