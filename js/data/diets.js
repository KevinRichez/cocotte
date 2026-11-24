import { ING } from './ingredients.js';

// Régimes et allergies : chaque entrée exclut des aliments, traités comme des no-go
// (recettes masquées ou ingrédient remplacé / retiré quand c'est un accompagnement).
const ids = (s) => s.split(' ');
const PORC = ids('cotes_porc saucisses chipolatas saucisses_strasbourg jambon jambon_cru bacon lardons chair_saucisse roti_porc chorizo saucisson rillettes pate_campagne cordon_bleu');
const LACTOSE = ids('lait lait_entier lait_ecreme fromage_blanc fromage_blanc0 skyr yaourt yaourt_grec creme_dessert creme creme_30 beurre lait_chocolat kefir whey creme_liquide beurre_demi_sel mascarpone ricotta cottage petits_suisses yaourt_fruits riz_au_lait brioche croissants pains_chocolat chocolat chocolat_blanc pate_tartiner gaufres madeleines cookies biscuits sauce_blanche cordon_bleu pizza lasagnes barres_proteinees boisson_proteinee puree_flocons');
const GLUTEN = ids('pates pates_completes semoule boulgour nouilles gnocchis pain_mie pain_complet pain pain_burger wraps brioche biscottes muesli granola cereales avoine pate_pizza pate_feuilletee farine pizza plat_prepare pates_fraiches raviolis lasagnes ble pain_campagne croissants pains_chocolat bagels pita corn_flakes biscuits madeleines cookies barres_cereales gaufres cordon_bleu nuggets poisson_pane seitan steak_vege sauce_soja bouillon surimi');
const OEUFS = ids('oeufs mayonnaise pates_fraiches brioche madeleines gaufres raviolis lasagnes sauce_blanche');
const COQUE = ids('amandes noix noix_cajou pistaches noisettes pate_tartiner pesto');
const ARACHIDE = ids('beurre_cac cacahuetes');
const MER = ids('crevettes moules calamars surimi');
const SOJA = ids('tofu lait_soja yaourt_soja sauce_soja edamame soja_texture steak_vege');
const SESAME = ids('sesame tahini houmous');
const ANIMAL_EXTRA = ids('miel mayonnaise tarama pesto pizza plat_prepare raviolis lasagnes pates_fraiches');

const cat = (id) => ING[id]?.cat;
const isMeat = (id) => cat(id) === 'viande';
const isFish = (id) => cat(id) === 'poisson';
const isDairy = (id) => (cat(id) === 'laitier' && !['lait_soja', 'yaourt_soja'].includes(id)) || cat(id) === 'fromage';

export const DIETS = {
  vegetarien: { label: 'Végétarien', emoji: '🥕', kind: 'diet', test: (id) => isMeat(id) || isFish(id) },
  vegan: { label: 'Végétalien', emoji: '🌿', kind: 'diet', test: (id) => isMeat(id) || isFish(id) || isDairy(id) || LACTOSE.includes(id) || OEUFS.includes(id) || ANIMAL_EXTRA.includes(id) },
  pescetarien: { label: 'Pescétarien', emoji: '🐟', kind: 'diet', test: (id) => isMeat(id) },
  sans_porc: { label: 'Sans porc', emoji: '🐖', kind: 'diet', test: (id) => PORC.includes(id) },
  halal: { label: 'Halal', emoji: '🌙', kind: 'diet', test: (id) => PORC.includes(id) },
  sans_gluten: { label: 'Sans gluten', emoji: '🌾', kind: 'diet', test: (id) => GLUTEN.includes(id) },
  sans_lactose: { label: 'Sans lactose', emoji: '🥛', kind: 'diet', test: (id) => LACTOSE.includes(id) || cat(id) === 'fromage' },
  a_arachide: { label: 'Arachide', emoji: '🥜', kind: 'allergy', test: (id) => ARACHIDE.includes(id) },
  a_coque: { label: 'Fruits à coque', emoji: '🌰', kind: 'allergy', test: (id) => COQUE.includes(id) },
  a_oeufs: { label: 'Œufs', emoji: '🥚', kind: 'allergy', test: (id) => OEUFS.includes(id) },
  a_lait: { label: 'Lait', emoji: '🍼', kind: 'allergy', test: (id) => isDairy(id) || LACTOSE.includes(id) },
  a_poisson: { label: 'Poisson', emoji: '🐠', kind: 'allergy', test: (id) => isFish(id) && !MER.includes(id) || id === 'tarama' },
  a_mer: { label: 'Crustacés et fruits de mer', emoji: '🦐', kind: 'allergy', test: (id) => MER.includes(id) },
  a_soja: { label: 'Soja', emoji: '🫘', kind: 'allergy', test: (id) => SOJA.includes(id) },
  a_sesame: { label: 'Sésame', emoji: '⚪', kind: 'allergy', test: (id) => SESAME.includes(id) },
  a_gluten: { label: 'Gluten (maladie cœliaque)', emoji: '🌾', kind: 'allergy', test: (id) => GLUTEN.includes(id) },
};
export const DIET_KEYS = Object.keys(DIETS).filter((k) => DIETS[k].kind === 'diet');
export const ALLERGY_KEYS = Object.keys(DIETS).filter((k) => DIETS[k].kind === 'allergy');

// Pour un profil donné : quel régime ou quelle allergie exclut cet aliment (null sinon)
const cache = new WeakMap();
export function dietBlock(profile, ingId) {
  const list = profile?.diets;
  if (!list?.length) return null;
  let map = cache.get(list);
  if (!map) { map = new Map(); cache.set(list, map); }
  if (!map.has(ingId)) {
    const hit = list.find((k) => DIETS[k]?.test(ingId));
    map.set(ingId, hit ? DIETS[hit] : null);
  }
  return map.get(ingId);
}
