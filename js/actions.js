import { update, restore, getState } from './store.js';
import { toast } from './lib/toast.js';
import { MEALS, MEAL_KEYS, RECIPE } from './data/recipes.js';
import { ING, guessIngredient } from './data/ingredients.js';
import { today, relDay } from './lib/dates.js';
import {
  uid, recipeLines, consumeLines, compileNeeds, nextFreeSlot, addToInventory, estimateDlc,
  listItemInfo, listTotal, euro, getProduct, getRecipe, defaultProductFor,
} from './lib/engine.js';

const undoable = (prev, message) => toast(message, { action: 'Annuler', onAction: () => restore(prev) });
const mealName = (m) => MEALS[m].label.toLowerCase();

export function planRecipe(date, meal, recipeId, swaps = {}, servings = 1) {
  const prev = update((d) => {
    d.plan[date] = d.plan[date] || {};
    d.plan[date][meal] = { recipeId, swaps, status: 'planned', ...(servings !== 1 ? { servings } : {}) };
  });
  const x = servings !== 1 ? ` x${String(servings).replace('.', ',')}` : '';
  undoable(prev, `${getRecipe(getState(), recipeId)?.name}${x} · ${relDay(date)}, ${mealName(meal)}`);
}

function eatInDraft(d, date, meal) {
  const slot = d.plan[date]?.[meal];
  if (!slot || slot.status !== 'planned') return false;
  slot.status = 'eaten';
  const r = getRecipe(d, slot.recipeId);
  if (r) consumeLines(d, recipeLines(r, slot.swaps, slot.servings || 1));
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
    if (slot.recipeId) d.plan[date][meal] = { recipeId: slot.recipeId, swaps: slot.swaps || {}, status: 'planned', ...(slot.servings ? { servings: slot.servings } : {}) };
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
        d.plan[date][meal] = { recipeId: best.recipe.id, swaps: {}, status: 'planned', ...(best.servings !== 1 ? { servings: best.servings } : {}) };
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

export function applyTicket(items, dlcs = {}) {
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
        ticketKey: it.ticketKey, storage: it.storage, aisle: ING[ing]?.aisle || 'Divers', emoji: it.ignored ? '🚫' : ING[ing]?.emoji || '🛒', custom: true,
        ignored: !!it.ignored, ignoredReason: it.ignoredReason || null,
        ...(it.image ? { image: it.image } : {}), ...(it.nutri ? { nutri: it.nutri } : {}), ...(it.barcode ? { barcode: it.barcode } : {}), ...(it.brand ? { brand: it.brand } : {}),
      };
      if (p) Object.assign(p, data);
      else { p = { id: `perso.${uid()}`, ...data }; d.customProducts.push(p); }
      if (!it.ignored) addToInventory(d, {
        ing: linked, productId: p.id, name: p.name,
        qty: size ? size * it.qty : it.qty, unit: linked ? null : (size ? it.unit : null),
        dlc: dlcs[it.key] || estimateDlc(d, p.id, ing), location: it.storage, nutri: it.nutri || undefined,
      });
      d.shoppingList.forEach((x) => { if (ing && getProduct(d, x.productId)?.ing === ing) x.checked = true; });
      hItems.push({ productId: p.id, name: p.name, store: it.store, aisle: p.aisle, qty: it.qty, price: it.unitPrice });
    }
    const total = Math.round(hItems.reduce((n, x) => n + x.price * x.qty, 0) * 100) / 100;
    d.history.unshift({ id: uid(), date: t, total, count: hItems.reduce((n, x) => n + x.qty, 0), items: hItems, source: 'ticket' });
    d.shoppingList = d.shoppingList.filter((x) => !x.checked);
    d.lastTicketSync = t;
  });
  undoable(prev, `Ticket importé · ${items.length} produits rangés`);
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
  const prev = update((d) => { addToInventory(d, { productId, ing, name, qty, unit, dlc, location, nutri }); });
  undoable(prev, `${name} rangé au ${location === 'frigo' ? 'frigo' : 'placard'}`);
}
export const updateStockItem = (id, patch) => update((d) => {
  const it = d.inventory.find((x) => x.id === id);
  if (it) Object.assign(it, patch);
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
export function setSlotServings(date, meal, servings) {
  update((d) => {
    const slot = d.plan[date]?.[meal];
    if (!slot) return;
    if (servings === 1) delete slot.servings; else slot.servings = servings;
  });
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
  });
  undoable(prev, `Fiche mise à jour : ${label}`);
}
