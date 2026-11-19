// Données de démo réalistes, toutes relatives à la date du jour pour rester cohérentes.
import { today, addDays, mondayOf } from '../lib/dates.js';
import { PRODUCT } from './catalog.js';
import { ING } from './ingredients.js';
import { uid } from '../lib/engine.js';

export const SEED_VERSION = 1;

export function createSeed() {
  const t = today();
  const monday = mondayOf(t);

  // Planning de la semaine en cours
  const pattern = [
    ['porridge_banane_cac', 'pates_poulet_creme', 'fb_miel_flocons', 'omelette_jambon'],
    ['tartines_cac_banane', 'bowl_steak_riz', 'yaourt_compote_choco', { outside: ['kebab'], note: 'Kebab avec les collègues' }],
    ['porridge_banane_cac', 'poulet_curry_riz', { skipped: true }, 'croque_monsieur'],
    ['oeufs_brouilles_tartines', 'wrap_poulet_curry', 'fb_miel_flocons', 'gnocchis_tomate_mozza'],
    ['bol_cereales', 'pates_pesto_poulet', 'pomme_cac', 'steak_puree'],
    ['pain_perdu', null, 'tartines_cac_banane', 'carbo_express'],
    ['porridge_banane_cac', 'gratin_pates_jambon', null, null],
  ];
  const meals = ['petitdej', 'dej', 'collation', 'diner'];
  const plan = {};
  pattern.forEach((day, i) => {
    const date = addDays(monday, i);
    const past = date < t;
    plan[date] = {};
    day.forEach((cell, j) => {
      if (!cell) return;
      const meal = meals[j];
      if (typeof cell === 'string') {
        plan[date][meal] = { recipeId: cell, swaps: {}, status: past ? 'eaten' : 'planned' };
      } else if (cell.outside) {
        if (past) plan[date][meal] = { status: 'outside', outside: { tags: cell.outside, note: cell.note } };
        else plan[date][meal] = { recipeId: 'omelette_jambon', swaps: {}, status: 'planned' };
      } else if (cell.skipped) {
        plan[date][meal] = past ? { status: 'skipped' } : { recipeId: 'yaourt_compote_choco', swaps: {}, status: 'planned' };
      }
    });
  });

  // Stock de base
  const inv = (ing, qty, days, extra = {}) => ({ id: uid(), ing, name: ING[ing].name, qty, dlc: addDays(t, days), location: ING[ing].storage, addedAt: addDays(t, -4), ...extra });
  const inventory = [
    inv('poulet', 300, 1),
    inv('fromage_blanc', 600, 2),
    inv('oeufs', 8, 14),
    inv('emmental', 120, 18),
    inv('jambon', 2, 3),
    inv('creme', 150, 9),
    inv('yaourt_grec', 2, 10),
    inv('beurre', 180, 30),
    inv('champignons', 120, -1),
    inv('carottes', 500, 8),
    inv('mozzarella', 125, 5),
    inv('pates', 800, 300),
    inv('riz', 600, 400),
    inv('avoine', 350, 200),
    inv('beurre_cac', 200, 150),
    inv('miel', 380, 600),
    inv('huile', 700, 400),
    inv('epices', 30, 500),
    inv('sauce_tomate', 500, 300),
    inv('banane', 3, 3),
    inv('pain_mie', 10, 4),
    inv('lait', 1500, 60),
    inv('mais', 285, 500),
    inv('compote', 2, 90),
    inv('cereales', 400, 120),
  ];

  // Historique : 2 courses passées
  const trip = (daysAgo, lines) => {
    const items = lines.map(([pid, qty]) => {
      const p = PRODUCT[pid];
      return { productId: pid, name: p.name, brand: p.brand, aisle: p.aisle, qty, price: p.price };
    });
    const total = items.reduce((s, it) => s + it.price * it.qty, 0);
    return { id: uid(), date: addDays(t, -daysAgo), total: Math.round(total * 100) / 100, count: items.reduce((n, it) => n + it.qty, 0), items, source: 'app' };
  };
  const history = [
    trip(4, [['poulet_mr', 1], ['steak15_mr', 1], ['oeufs_mr', 1], ['fb_mr', 1], ['banane_vrac', 1], ['pain_mie_mr', 1], ['emmental_mr', 1], ['jambon_eco', 1], ['creme_mr', 1], ['mozza_mr', 1], ['champi_250', 1], ['carottes_kg', 1]]),
    trip(11, [['pates_mr', 2], ['riz_eco', 1], ['avoine_mr', 1], ['beurre_cac_mr', 1], ['lait_mr', 2], ['poulet_eco', 1], ['oeufs_eco', 1], ['yaourt_grec_mr', 1], ['sauce_tomate_mr', 1], ['beurre_mr', 1], ['cereales_mr', 1], ['compote_mr', 1], ['mais_mr', 1], ['huile_mr', 1]]),
  ];

  return {
    version: SEED_VERSION,
    ui: { tab: 'week', shopTab: 'list', profileTab: 'stock' },
    profile: { kcalTarget: 2500, showKcal: true, weightGoal: 50, showWeight: true, storeMode: false },
    prefs: {
      refuges: ['poulet', 'oeufs', 'steak15', 'fromage_blanc', 'pates'],
      defis: ['brocoli', 'saumon', 'pois_chiches', 'avocat'],
      nogo: ['thon', 'lentilles'],
    },
    inventory,
    plan,
    deferred: [],
    shoppingList: [
      { id: uid(), productId: 'wraps_mr', qty: 1, checked: false, source: 'manual' },
      { id: uid(), productId: 'jus_orange_mr', qty: 1, checked: false, source: 'manual' },
      { id: uid(), productId: 'chocolat_eco', qty: 2, checked: false, source: 'manual' },
      { id: uid(), productId: 'pomme_gala', qty: 1, checked: false, source: 'manual' },
    ],
    history,
    priceOverrides: {},
    brandPrefs: {},
    lastTicketSync: null,
  };
}
