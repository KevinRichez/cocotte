// Actions métier : toutes les mutations d'état passent par ici.
import { update, restore, getState } from './store.js';
import { toast } from './lib/toast.js';
import { RECIPE, MEALS } from './data/recipes.js';
import { PRODUCT } from './data/catalog.js';
import { ING } from './data/ingredients.js';
import { today, relDay } from './lib/dates.js';
import {
  uid, recipeLines, consumeLines, compileNeeds, nextFreeSlot, addToInventory, estimateDlc,
  listItemInfo, listTotal, euro, productPrice,
} from './lib/engine.js';

const undoable = (prev, message) => toast(message, { action: 'Annuler', onAction: () => restore(prev) });

/* ---------- Planning ---------- */
export function planRecipe(date, meal, recipeId, swaps = {}) {
  const prev = update((d) => {
    d.plan[date] = d.plan[date] || {};
    d.plan[date][meal] = { recipeId, swaps, status: 'planned' };
  });
  undoable(prev, `${RECIPE[recipeId].name} · ${relDay(date)}, ${MEALS[meal].label.toLowerCase()}`);
}

export function markEaten(date, meal) {
  const prev = update((d) => {
    const slot = d.plan[date]?.[meal];
    if (!slot) return;
    slot.status = 'eaten';
    const r = RECIPE[slot.recipeId];
    if (r) consumeLines(d, recipeLines(r, slot.swaps));
  });
  undoable(prev, 'Bon appétit ! Stock mis à jour');
}

export function markOutside(date, meal, { tags, note }) {
  let replaced = null;
  const prev = update((d) => {
    d.plan[date] = d.plan[date] || {};
    const slot = d.plan[date][meal];
    if (slot?.recipeId && slot.status === 'planned') {
      // Les ingrédients prévus ne sont pas perdus : la recette est mise de côté pour être recasée.
      d.deferred.push({ id: uid(), recipeId: slot.recipeId, swaps: slot.swaps || {}, from: { date, meal } });
      replaced = RECIPE[slot.recipeId]?.name;
    }
    d.plan[date][meal] = { status: 'outside', outside: { tags, note } };
  });
  undoable(prev, replaced ? `Noté ! « ${replaced} » sera re-proposé plus tard` : 'Noté, profite bien !');
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
  undoable(prev, 'Tu écoutes ta faim, c’est parfait 🌿');
}

export function resetSlot(date, meal) {
  update((d) => {
    const slot = d.plan[date]?.[meal];
    if (!slot) return;
    if (slot.recipeId) d.plan[date][meal] = { recipeId: slot.recipeId, swaps: slot.swaps || {}, status: 'planned' };
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
  if (!item) return;
  const slot = target || nextFreeSlot(s, RECIPE[item.recipeId]);
  if (!slot) { toast('Aucun créneau libre cette semaine'); return; }
  const prev = update((d) => {
    d.plan[slot.date] = d.plan[slot.date] || {};
    d.plan[slot.date][slot.meal] = { recipeId: item.recipeId, swaps: item.swaps, status: 'planned' };
    d.deferred = d.deferred.filter((x) => x.id !== id);
  });
  undoable(prev, `Recasé ${relDay(slot.date).toLowerCase()}, ${MEALS[slot.meal].label.toLowerCase()}`);
}
export function dropDeferred(id) {
  update((d) => { d.deferred = d.deferred.filter((x) => x.id !== id); });
}

export function autofillWeek(dates, suggestFn) {
  let n = 0;
  const prev = update((d) => {
    for (const date of dates) {
      for (const meal of ['petitdej', 'dej', 'collation', 'diner']) {
        if (d.plan[date]?.[meal]) continue;
        const best = suggestFn(d, date, meal);
        if (!best) continue;
        d.plan[date] = d.plan[date] || {};
        d.plan[date][meal] = { recipeId: best.id, swaps: {}, status: 'planned' };
        n++;
      }
    }
  });
  if (n) undoable(prev, `${n} créneau${n > 1 ? 'x' : ''} rempli${n > 1 ? 's' : ''} avec des idées`);
  else toast('Ta semaine est déjà bien remplie 👌');
}

/* ---------- Liste de courses ---------- */
export function generateList(dates) {
  const s = getState();
  const needs = compileNeeds(s, dates);
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
  else toast('Tout est déjà dans tes placards 🎉');
}

export function addToList(productId, qty = 1) {
  update((d) => {
    const ex = d.shoppingList.find((x) => x.productId === productId && !x.checked);
    if (ex) ex.qty += qty;
    else d.shoppingList.push({ id: uid(), productId, qty, checked: false, source: 'manual' });
  });
  toast(`${PRODUCT[productId].name} ajouté à la liste`);
}
export function addCustomToList(name) {
  update((d) => { d.shoppingList.push({ id: uid(), name, qty: 1, price: 0, checked: false, source: 'manual' }); });
}
export function addIngsToList(ings) {
  const s = getState();
  let n = 0;
  update((d) => {
    for (const ing of ings) {
      const pid = Object.values(PRODUCT).find((p) => p.id === (s.brandPrefs?.[ing]))?.id || null;
      const prodId = pid || Object.values(PRODUCT).filter((p) => p.ing === ing).sort((a, b) => a.price / a.size - b.price / b.size)[0]?.id;
      if (!prodId || d.shoppingList.some((x) => x.productId === prodId && !x.checked)) continue;
      d.shoppingList.push({ id: uid(), productId: prodId, qty: 1, checked: false, source: 'manual' }); n++;
    }
  });
  toast(n ? `${n} produit${n > 1 ? 's' : ''} ajouté${n > 1 ? 's' : ''} à la liste` : 'Déjà dans ta liste');
}
export const toggleItem = (id) => update((d) => { const it = d.shoppingList.find((x) => x.id === id); if (it) it.checked = !it.checked; });
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
    d.brandPrefs[PRODUCT[productId].ing] = productId;
  });
}

/** "J'ai fini mes courses" : archive, transfère au stock, vide la liste. */
export function finishShopping({ keepUnchecked = false, dlcOverrides = {} } = {}) {
  const s = getState();
  const bought = s.shoppingList.filter((x) => x.checked);
  if (!bought.length) return;
  const t = today();
  const items = bought.map((it) => {
    const info = listItemInfo(s, it);
    return { productId: it.productId || null, name: info.name, brand: info.brand, aisle: info.aisle, qty: it.qty, price: info.unitPrice };
  });
  const total = Math.round(items.reduce((n, x) => n + x.price * x.qty, 0) * 100) / 100;
  const prev = update((d) => {
    d.history.unshift({ id: uid(), date: t, total, count: items.reduce((n, x) => n + x.qty, 0), items, source: 'app' });
    for (const it of bought) {
      const prod = PRODUCT[it.productId];
      if (prod) {
        addToInventory(d, {
          ing: prod.ing, qty: prod.size * it.qty, productId: prod.id,
          dlc: dlcOverrides[it.id] || estimateDlc(prod.id, prod.ing, t), location: ING[prod.ing].storage,
        });
      } else {
        addToInventory(d, { ing: null, name: it.name, qty: it.qty, dlc: dlcOverrides[it.id] || null, location: 'placard' });
      }
    }
    d.shoppingList = keepUnchecked ? d.shoppingList.filter((x) => !x.checked) : [];
    d.ui.shopTab = 'history';
  });
  undoable(prev, `Courses archivées · ${euro(total)} · stock mis à jour`);
}

/** Import d'un ticket : met à jour les prix, ajoute au stock, archive et coche la liste. */
export function applyTicket(items, { updatePrices = true, addStock = true, archive = true, checkList = true }) {
  const t = today();
  const prev = update((d) => {
    for (const it of items) {
      const prod = PRODUCT[it.productId];
      if (updatePrices) d.priceOverrides[it.productId] = { price: it.unitPrice, date: t };
      if (addStock) addToInventory(d, { ing: prod.ing, qty: prod.size * it.qty, productId: prod.id, dlc: estimateDlc(prod.id, prod.ing, t), location: ING[prod.ing].storage });
      if (checkList) d.shoppingList.forEach((x) => { if (x.productId === it.productId) x.checked = true; });
    }
    if (archive) {
      const hItems = items.map((it) => ({ productId: it.productId, name: PRODUCT[it.productId].name, brand: PRODUCT[it.productId].brand, aisle: PRODUCT[it.productId].aisle, qty: it.qty, price: it.unitPrice }));
      const total = Math.round(hItems.reduce((n, x) => n + x.price * x.qty, 0) * 100) / 100;
      d.history.unshift({ id: uid(), date: t, total, count: hItems.reduce((n, x) => n + x.qty, 0), items: hItems, source: 'ticket' });
      if (checkList) d.shoppingList = d.shoppingList.filter((x) => !x.checked);
    }
    d.lastTicketSync = t;
  });
  undoable(prev, `Ticket importé · ${items.length} produits synchronisés`);
}

/* ---------- Stock ---------- */
export function quickAddStock(ing) {
  const meta = ING[ing];
  const s = getState();
  const pid = s.brandPrefs?.[ing] || Object.values(PRODUCT).find((p) => p.ing === ing)?.id;
  const qty = PRODUCT[pid]?.size || (meta.unit === 'pc' ? 1 : 100);
  const prev = update((d) => { addToInventory(d, { ing, qty, productId: pid, dlc: estimateDlc(pid, ing), location: meta.storage }); });
  undoable(prev, `${meta.emoji} ${meta.name} ajouté au ${meta.storage === 'frigo' ? 'frigo' : 'placard'}`);
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

/* ---------- Préférences ---------- */
export function setPref(ing, cat) {
  update((d) => {
    for (const k of ['refuges', 'defis', 'nogo']) d.prefs[k] = d.prefs[k].filter((x) => x !== ing);
    if (cat) d.prefs[cat].push(ing);
  });
}
export const setProfile = (patch) => update((d) => { Object.assign(d.profile, patch); });
export const productUnitPrice = (s, id) => productPrice(s, id);
