import { INGREDIENTS, ING } from './ingredients.js';

export const STORES = {
  leclerc: { name: 'Leclerc', color: '#1F5FA8', factor: 0.97, mdd: 'Marque Repère', eco: 'Eco+', bio: 'Bio Village' },
  carrefour: { name: 'Carrefour', color: '#2F6FB5', factor: 1.04, mdd: 'Carrefour', eco: 'Simpl', bio: 'Carrefour Bio' },
  lidl: { name: 'Lidl', color: '#0B4F9C', factor: 0.9, mdd: 'Marque Lidl', eco: null, bio: 'Lidl Bio' },
  auchan: { name: 'Auchan', color: '#C2410C', factor: 1, mdd: 'Auchan', eco: 'Pouce', bio: 'Auchan Bio' },
  intermarche: { name: 'Intermarché', color: '#B45309', factor: 1.02, mdd: 'Intermarché', eco: 'Top Budget', bio: 'Intermarché Bio' },
  superu: { name: 'Super U', color: '#1D4ED8', factor: 1, mdd: 'U', eco: 'Bien Vu', bio: 'U Bio' },
  aldi: { name: 'Aldi', color: '#1E3A8A', factor: 0.9, mdd: 'Marque Aldi', eco: null, bio: 'Aldi Bio' },
  monoprix: { name: 'Monoprix', color: '#111827', factor: 1.22, mdd: 'Monoprix', eco: 'Monoprix Essentiel', bio: 'Monoprix Bio' },
  casino: { name: 'Casino', color: '#047857', factor: 1.08, mdd: 'Casino', eco: 'Tous les jours', bio: 'Casino Bio' },
};

export const TIERS = {
  eco: { label: 'Premier prix', factor: 0.8 },
  mdd: { label: 'Marque magasin', factor: 1 },
  vrac: { label: 'Rayon frais', factor: 1 },
  bio: { label: 'Bio', factor: 1.45 },
  nat: { label: 'Grande marque', factor: 1.5 },
};

export const AISLES = [
  'Fruits & Légumes', 'Boulangerie', 'Boucherie & Volaille', 'Poissonnerie', 'Crèmerie & Œufs', 'Fromages',
  'Traiteur frais', 'Épicerie salée', 'Conserves', 'Petit-déjeuner', 'Épicerie sucrée', 'Boissons', 'Divers',
];

const norm = (x) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const round = (n) => Math.max(0.29, Math.round(n * 100) / 100 - 0.01);

export function packLabel(ing, size) {
  if (ing.unit === 'g') return size >= 1000 ? `${(size / 1000).toLocaleString('fr-FR')} kg` : `${size} g`;
  if (ing.unit === 'ml') return size >= 1000 ? `${(size / 1000).toLocaleString('fr-FR')} L` : `${size / 10} cl`;
  return `x${size}`;
}

let cache = null;

function build() {
  const list = [];
  for (const ing of INGREDIENTS) {
    const base = ing.pack.price;
    for (const [sid, st] of Object.entries(STORES)) {
      const tiers = ing.fresh ? ['vrac', 'bio'] : ['mdd', st.eco && 'eco', ing.cat !== 'epice' && 'bio'].filter(Boolean);
      for (const tier of tiers) {
        const brand = tier === 'vrac' ? st.name : st[tier];
        list.push(make(ing, sid, tier, brand, base * st.factor * TIERS[tier].factor));
      }
      ing.nat.forEach((brand, k) => list.push(make(ing, sid, k ? `nat${k}` : 'nat', brand, base * st.factor * (TIERS.nat.factor + k * 0.08))));
    }
  }
  const byId = Object.fromEntries(list.map((p) => [p.id, p]));
  const byIng = {};
  for (const p of list) (byIng[p.ing] = byIng[p.ing] || []).push(p);
  return { list, byId, byIng };
}

function make(ing, store, tier, brand, price) {
  const tierKey = tier.startsWith('nat') ? 'nat' : tier;
  const name = `${ing.name} ${packLabel(ing, ing.pack.size)}`;
  return {
    id: `${store}.${ing.id}.${tier}`, ing: ing.id, store, tier: tierKey, brand, name,
    size: ing.pack.size, price: round(price), aisle: ing.aisle, emoji: ing.emoji,
    search: norm(`${name} ${brand} ${ing.keys}`),
  };
}

export const bank = () => (cache || (cache = build()));
export const bankProduct = (id) => bank().byId[id] || null;
export const bankForIng = (ing) => bank().byIng[ing] || [];

const OLD_IDS = {
  banane_vrac: 'banane.vrac', banane_bio: 'banane.bio', pomme_gala: 'pomme.vrac', tomate_grappe: 'tomate.vrac', courgette_kg: 'courgette.vrac',
  brocoli_pc: 'brocoli.vrac', oignon_kg: 'oignon.vrac', carottes_kg: 'carottes.vrac', pdt_25: 'pdt.vrac', poivron_x3: 'poivron.vrac',
  champi_250: 'champignons.vrac', avocat_x2: 'avocat.vrac', pain_mie_mr: 'pain_mie.mdd', pain_mie_bio: 'pain_complet.bio', baguette: 'pain.mdd',
  wraps_mr: 'wraps.mdd', poulet_mr: 'poulet.mdd', poulet_eco: 'poulet.eco', dinde_mr: 'dinde.mdd', steak15_mr: 'steak15.mdd', steak15_eco: 'steak15.eco',
  lardons_mr: 'lardons.mdd', jambon_mr: 'jambon.mdd', jambon_eco: 'jambon.eco', saumon_mr: 'saumon.mdd', oeufs_mr: 'oeufs.mdd', oeufs_eco: 'oeufs.eco',
  oeufs_bio: 'oeufs.bio', fb_mr: 'fromage_blanc.mdd', fb_eco: 'fromage_blanc.eco', yaourt_grec_mr: 'yaourt_grec.mdd', lait_mr: 'lait.mdd', lait_bio: 'lait.bio',
  beurre_mr: 'beurre.mdd', creme_mr: 'creme.mdd', emmental_mr: 'emmental.mdd', emmental_eco: 'emmental.eco', mozza_mr: 'mozzarella.mdd',
  gnocchis_mr: 'gnocchis.mdd', pates_mr: 'pates.mdd', pates_eco: 'pates.eco', pates_bio: 'pates.bio', riz_mr: 'riz.mdd', riz_eco: 'riz.eco',
  semoule_mr: 'semoule.mdd', sauce_tomate_mr: 'sauce_tomate.mdd', pesto_mr: 'pesto.mdd', huile_mr: 'huile.mdd', curry_mr: 'curry.mdd',
  lentilles_mr: 'lentilles.mdd', tomates_pelees_eco: 'tomates_pelees.eco', mais_mr: 'mais.mdd', pois_chiches_mr: 'pois_chiches.mdd',
  thon_mr: 'thon.mdd', avoine_mr: 'avoine.mdd', avoine_bio: 'avoine.bio', cereales_mr: 'cereales.mdd', beurre_cac_mr: 'beurre_cac.mdd',
  miel_mr: 'miel.mdd', pate_tartiner_mr: 'pate_tartiner.mdd', chocolat_eco: 'chocolat.eco', compote_mr: 'compote.mdd', jus_orange_mr: 'jus_orange.mdd',
};
export const mapOldProductId = (id) => (OLD_IDS[id] ? `leclerc.${OLD_IDS[id]}` : id);

export function storeLabel(p) {
  if (!p) return '';
  const st = STORES[p.store]?.name;
  if (p.custom) return [st, p.brand].filter(Boolean).join(' · ') || 'Produit perso';
  if (p.tier === 'vrac') return `${st} · rayon frais`;
  if (p.tier === 'eco') return `${st} · ${p.brand} · premier prix`;
  return `${st} · ${p.brand && p.brand !== st ? p.brand : 'marque magasin'}`;
}

export { ING };
