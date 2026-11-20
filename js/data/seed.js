import { today, addDays, mondayOf } from '../lib/dates.js';
import { ING } from './ingredients.js';
import { bankProduct, mapOldProductId } from './products.js';
import { uid } from '../lib/engine.js';

export const SEED_VERSION = 2;

export const DEFAULT_EQUIPMENT = ['plaques', 'poele', 'casserole', 'four', 'micro-ondes', 'grille-pain'];

export function defaultProfile() {
  return {
    onboarded: false, sex: 'x', age: 25, height: 170, weight: 60, weightGoal: 60, activity: 1.4, pace: 'doux',
    stores: ['leclerc'], equipment: [...DEFAULT_EQUIPMENT], storeMode: false,
  };
}

export function emptyState(profile = defaultProfile()) {
  return {
    version: SEED_VERSION,
    ui: { tab: 'week', shopTab: 'list', profileTab: 'stock' },
    profile,
    prefs: { ing: {}, recipe: {} },
    inventory: [], plan: {}, deferred: [], shoppingList: [], history: [],
    customProducts: [], customRecipes: [], productOverrides: {},
    priceOverrides: {}, brandPrefs: {}, lastTicketSync: null,
  };
}

export function createSeed(profile) {
  const t = today();
  const monday = mondayOf(t);
  const s = emptyState(profile);
  const pattern = [
    ['porridge_banane_cac', 'pates_poulet_creme', 'fb_miel_flocons', 'omelette_jambon'],
    ['tartines_cac_banane', 'bowl_steak_riz', 'yaourt_compote_choco', { outside: ['kebab'], note: 'Kebab avec les collègues' }],
    ['porridge_banane_cac', 'poulet_curry_riz', { skipped: true }, 'croque_monsieur'],
    ['oeufs_brouilles_tartines', 'wrap_poulet_curry', 'fb_miel_flocons', 'gnocchis_tomate_mozza'],
    ['bol_cereales', 'pates_pesto_poulet', 'pomme_cac', 'steak_puree'],
    ['pancakes_banane', null, 'tartines_cac_banane', 'carbo_express'],
    ['porridge_cacao', 'chili_con_carne', null, null],
  ];
  const meals = ['petitdej', 'dej', 'collation', 'diner'];
  pattern.forEach((day, i) => {
    const date = addDays(monday, i);
    const past = date < t;
    s.plan[date] = {};
    day.forEach((cell, j) => {
      if (!cell) return;
      const meal = meals[j];
      if (typeof cell === 'string') s.plan[date][meal] = { recipeId: cell, swaps: {}, status: past ? 'eaten' : 'planned' };
      else if (cell.outside) s.plan[date][meal] = past ? { status: 'outside', outside: { tags: cell.outside, note: cell.note } } : { recipeId: 'omelette_jambon', swaps: {}, status: 'planned' };
      else if (cell.skipped) s.plan[date][meal] = past ? { status: 'skipped' } : { recipeId: 'yaourt_compote_choco', swaps: {}, status: 'planned' };
    });
  });

  const inv = (ing, qty, days) => ({ id: uid(), ing, name: ING[ing].name, qty, dlc: addDays(t, days), location: ING[ing].storage, productId: null, addedAt: addDays(t, -4) });
  s.inventory = [
    inv('poulet', 300, 1), inv('fromage_blanc', 600, 2), inv('oeufs', 8, 14), inv('emmental', 120, 18), inv('jambon', 2, 3),
    inv('creme', 150, 9), inv('yaourt_grec', 2, 10), inv('beurre', 180, 30), inv('carottes', 500, 8), inv('mozzarella', 125, 5),
    inv('pates', 800, 300), inv('riz', 600, 400), inv('avoine', 350, 200), inv('beurre_cac', 200, 150), inv('miel', 380, 600),
    inv('huile', 700, 400), inv('curry', 30, 500), inv('paprika', 30, 500), inv('sel', 500, 900), inv('poivre', 40, 900),
    inv('sauce_tomate', 500, 300), inv('banane', 3, 3), inv('pain_mie', 10, 4), inv('lait', 1500, 60), inv('mais', 285, 500),
    inv('compote', 2, 90), inv('cereales', 400, 120),
  ];

  const trip = (daysAgo, lines) => {
    const items = lines.map(([ing, tier, qty]) => {
      const p = bankProduct(`leclerc.${ing}.${tier}`);
      return { productId: p.id, name: p.name, store: 'leclerc', aisle: p.aisle, qty, price: p.price };
    });
    const total = items.reduce((n, it) => n + it.price * it.qty, 0);
    return { id: uid(), date: addDays(t, -daysAgo), total: Math.round(total * 100) / 100, count: items.reduce((n, it) => n + it.qty, 0), items, source: 'app' };
  };
  s.history = [
    trip(4, [['poulet', 'mdd', 1], ['steak15', 'mdd', 1], ['oeufs', 'mdd', 1], ['fromage_blanc', 'mdd', 1], ['banane', 'vrac', 1], ['pain_mie', 'mdd', 1], ['emmental', 'mdd', 1], ['jambon', 'eco', 1], ['creme', 'mdd', 1], ['mozzarella', 'mdd', 1], ['carottes', 'vrac', 1]]),
    trip(11, [['pates', 'mdd', 2], ['riz', 'eco', 1], ['avoine', 'mdd', 1], ['beurre_cac', 'mdd', 1], ['lait', 'mdd', 2], ['poulet', 'eco', 1], ['oeufs', 'eco', 1], ['yaourt_grec', 'mdd', 1], ['sauce_tomate', 'mdd', 1], ['beurre', 'mdd', 1], ['cereales', 'mdd', 1], ['compote', 'mdd', 1], ['mais', 'mdd', 1]]),
  ];
  s.shoppingList = [
    { id: uid(), productId: 'leclerc.wraps.mdd', qty: 1, checked: false, source: 'manual' },
    { id: uid(), productId: 'leclerc.jus_orange.mdd', qty: 1, checked: false, source: 'manual' },
    { id: uid(), productId: 'leclerc.chocolat.eco', qty: 2, checked: false, source: 'manual' },
    { id: uid(), productId: 'leclerc.pomme.vrac', qty: 1, checked: false, source: 'manual' },
  ];
  s.prefs = {
    ing: { poulet: 'refuge', oeufs: 'refuge', steak15: 'refuge', fromage_blanc: 'refuge', pates: 'refuge', brocoli: 'doux', saumon: 'doux', pois_chiches: 'doux', avocat: 'doux', thon: 'nogo', lentilles: 'nogo' },
    recipe: { pates_poulet_creme: 'refuge', porridge_banane_cac: 'refuge', bowl_steak_riz: 'ok' },
  };
  return s;
}

export function migrate(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.version === SEED_VERSION) return raw;
  if (raw.version !== 1) return null;
  const s = emptyState();
  const p = raw.profile || {};
  s.profile = { ...defaultProfile(), weightGoal: +p.weightGoal || 60, weight: Math.max(35, (+p.weightGoal || 60) - 5), storeMode: !!p.storeMode };
  s.ui = { ...s.ui, ...(raw.ui || {}) };
  for (const id of raw.prefs?.refuges || []) s.prefs.ing[id] = 'refuge';
  for (const id of raw.prefs?.defis || []) s.prefs.ing[id] = 'doux';
  for (const id of raw.prefs?.nogo || []) s.prefs.ing[id] = 'nogo';
  s.inventory = (raw.inventory || []).map((x) => ({ ...x, ing: x.ing === 'epices' ? 'epices' : x.ing, productId: x.productId ? mapOldProductId(x.productId) : null }));
  s.plan = raw.plan || {};
  s.deferred = raw.deferred || [];
  s.shoppingList = (raw.shoppingList || []).map((x) => (x.productId ? { ...x, productId: mapOldProductId(x.productId) } : x));
  s.history = (raw.history || []).map((h) => ({ ...h, items: (h.items || []).map((it) => ({ ...it, productId: it.productId ? mapOldProductId(it.productId) : null, store: 'leclerc' })) }));
  for (const [k, v] of Object.entries(raw.priceOverrides || {})) s.priceOverrides[mapOldProductId(k)] = v;
  for (const [k, v] of Object.entries(raw.brandPrefs || {})) s.brandPrefs[k] = mapOldProductId(v);
  s.lastTicketSync = raw.lastTicketSync || null;
  return s;
}
