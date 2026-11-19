// Référentiel d'ingrédients génériques.
// unit : 'g' | 'ml' | 'pc'. kcal/prot : pour 100 g/ml, ou par pièce si unit = 'pc'.
// storage : 'placard' | 'frigo'. shelf : DLC estimée en jours à partir de l'achat (produit fermé).
// portion : quantité "standard" pour une personne, utilisée pour les swaps.
// staple : produit de base (huile, épices), non quantifié dans la liste de courses.

export const CATEGORIES = {
  proteine: { label: 'Protéines', emoji: '🍗' },
  feculent: { label: 'Féculents', emoji: '🍝' },
  laitier: { label: 'Crèmerie', emoji: '🧀' },
  legume: { label: 'Légumes', emoji: '🥕' },
  fruit: { label: 'Fruits', emoji: '🍌' },
  epicerie: { label: 'Épicerie', emoji: '🫙' },
};

const I = (id, name, emoji, cat, unit, kcal, prot, storage, shelf, extra = {}) =>
  ({ id, name, emoji, cat, unit, kcal, prot, storage, shelf, ...extra });

export const INGREDIENTS = [
  // Protéines
  I('poulet', 'Blanc de poulet', '🍗', 'proteine', 'g', 110, 23, 'frigo', 4, { portion: 150 }),
  I('dinde', 'Escalope de dinde', '🦃', 'proteine', 'g', 105, 23, 'frigo', 4, { portion: 150 }),
  I('steak15', 'Steak haché 15 %', '🥩', 'proteine', 'pc', 215, 17, 'frigo', 4, { portion: 2, unitLabel: 'steak' }),
  I('oeufs', 'Œufs', '🥚', 'proteine', 'pc', 75, 6.5, 'frigo', 24, { portion: 3, unitLabel: 'œuf' }),
  I('jambon', 'Jambon blanc', '🥓', 'proteine', 'pc', 45, 8, 'frigo', 7, { portion: 3, unitLabel: 'tranche' }),
  I('lardons', 'Lardons fumés', '🥓', 'proteine', 'g', 270, 15, 'frigo', 14, { portion: 100 }),
  I('saumon', 'Pavé de saumon', '🐟', 'proteine', 'g', 200, 20, 'frigo', 3, { portion: 125 }),
  I('thon', 'Thon au naturel', '🐟', 'proteine', 'g', 110, 26, 'placard', 900, { portion: 100 }),
  I('lentilles', 'Lentilles vertes', '🫘', 'feculent', 'g', 330, 24, 'placard', 600, { portion: 80 }),
  I('pois_chiches', 'Pois chiches', '🫛', 'proteine', 'g', 120, 7, 'placard', 900, { portion: 150 }),

  // Crèmerie
  I('fromage_blanc', 'Fromage blanc 3 %', '🥛', 'laitier', 'g', 75, 7.5, 'frigo', 18),
  I('yaourt_grec', 'Yaourt à la grecque', '🥣', 'laitier', 'pc', 150, 4.5, 'frigo', 20, { unitLabel: 'pot' }),
  I('lait', 'Lait demi-écrémé', '🥛', 'laitier', 'ml', 46, 3.2, 'placard', 90),
  I('beurre', 'Beurre doux', '🧈', 'laitier', 'g', 740, 0.7, 'frigo', 45),
  I('creme', 'Crème fraîche 15 %', '🥛', 'laitier', 'ml', 160, 3, 'frigo', 21),
  I('emmental', 'Emmental râpé', '🧀', 'laitier', 'g', 380, 28, 'frigo', 30),
  I('mozzarella', 'Mozzarella', '🧀', 'laitier', 'g', 250, 18, 'frigo', 14),

  // Féculents
  I('pates', 'Pâtes', '🍝', 'feculent', 'g', 360, 12, 'placard', 540, { portion: 125 }),
  I('riz', 'Riz long', '🍚', 'feculent', 'g', 350, 7, 'placard', 540, { portion: 100 }),
  I('semoule', 'Semoule', '🥣', 'feculent', 'g', 360, 12, 'placard', 400, { portion: 100 }),
  I('gnocchis', 'Gnocchis frais', '🥟', 'feculent', 'g', 160, 4, 'frigo', 30, { portion: 300 }),
  I('pdt', 'Pommes de terre', '🥔', 'feculent', 'g', 80, 2, 'placard', 21, { portion: 350 }),
  I('pain_mie', 'Pain de mie', '🍞', 'feculent', 'pc', 70, 2.5, 'placard', 10, { portion: 4, unitLabel: 'tranche' }),
  I('pain', 'Baguette', '🥖', 'feculent', 'g', 270, 9, 'placard', 2, { portion: 100 }),
  I('wraps', 'Tortillas de blé', '🌯', 'feculent', 'pc', 180, 5, 'placard', 30, { portion: 2, unitLabel: 'tortilla' }),
  I('avoine', "Flocons d'avoine", '🌾', 'feculent', 'g', 370, 13, 'placard', 300),
  I('cereales', 'Céréales chocolatées', '🥣', 'feculent', 'g', 390, 8, 'placard', 200),

  // Légumes
  I('tomate', 'Tomates', '🍅', 'legume', 'pc', 20, 1, 'placard', 6, { unitLabel: 'tomate' }),
  I('tomates_pelees', 'Tomates pelées', '🥫', 'legume', 'g', 25, 1, 'placard', 700),
  I('sauce_tomate', 'Sauce tomate cuisinée', '🥫', 'legume', 'g', 55, 1.5, 'placard', 500),
  I('courgette', 'Courgettes', '🥒', 'legume', 'g', 17, 1.2, 'frigo', 7),
  I('brocoli', 'Brocoli', '🥦', 'legume', 'g', 34, 2.8, 'frigo', 5),
  I('oignon', 'Oignons jaunes', '🧅', 'legume', 'pc', 40, 1, 'placard', 30, { unitLabel: 'oignon' }),
  I('carottes', 'Carottes', '🥕', 'legume', 'g', 40, 1, 'frigo', 14),
  I('poivron', 'Poivrons', '🫑', 'legume', 'pc', 30, 1, 'frigo', 8, { unitLabel: 'poivron' }),
  I('champignons', 'Champignons de Paris', '🍄', 'legume', 'g', 22, 3, 'frigo', 5),
  I('mais', 'Maïs doux', '🌽', 'legume', 'g', 80, 2.5, 'placard', 700),
  I('avocat', 'Avocat', '🥑', 'legume', 'pc', 230, 3, 'placard', 5, { unitLabel: 'avocat' }),

  // Fruits
  I('banane', 'Bananes', '🍌', 'fruit', 'pc', 105, 1.3, 'placard', 6, { unitLabel: 'banane' }),
  I('pomme', 'Pommes', '🍎', 'fruit', 'pc', 80, 0.4, 'placard', 20, { unitLabel: 'pomme' }),
  I('compote', 'Compote pomme', '🍏', 'fruit', 'pc', 70, 0.3, 'placard', 120, { unitLabel: 'pot' }),
  I('jus_orange', "Jus d'orange", '🧃', 'fruit', 'ml', 45, 0.7, 'placard', 120),

  // Épicerie
  I('beurre_cac', 'Beurre de cacahuète', '🥜', 'epicerie', 'g', 600, 25, 'placard', 240),
  I('miel', 'Miel', '🍯', 'epicerie', 'g', 320, 0, 'placard', 700),
  I('chocolat', 'Chocolat au lait', '🍫', 'epicerie', 'g', 540, 7, 'placard', 270),
  I('pate_tartiner', 'Pâte à tartiner', '🌰', 'epicerie', 'g', 540, 6, 'placard', 240),
  I('pesto', 'Pesto', '🌿', 'epicerie', 'g', 450, 5, 'placard', 300),
  I('huile', 'Huile de tournesol', '🫒', 'epicerie', 'ml', 900, 0, 'placard', 500, { staple: true }),
  I('epices', 'Épices (curry, paprika)', '🧂', 'epicerie', 'g', 0, 0, 'placard', 700, { staple: true }),
];

export const ING = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));

/** Groupes interchangeables pour le swap rapide dans les fiches recettes. */
export const SWAP_GROUPS = {
  feculent: ['pates', 'riz', 'semoule', 'gnocchis', 'pdt'],
  proteine: ['poulet', 'dinde', 'steak15', 'oeufs', 'jambon', 'lardons', 'saumon'],
};

export function fmtQty(qty, unit, ingId) {
  const q = Math.round(qty * 10) / 10;
  if (unit === 'g') return q >= 1000 ? `${(q / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} kg` : `${Math.round(q)} g`;
  if (unit === 'ml') return q >= 1000 ? `${(q / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} L` : `${Math.round(q)} ml`;
  const ing = ING[ingId];
  const label = ing?.unitLabel;
  const n = q.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
  if (!label) return `× ${n}`;
  return `${n} ${label}${q > 1 && !label.endsWith('s') ? 's' : ''}`;
}
