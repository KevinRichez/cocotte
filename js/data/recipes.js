// Recettes rapides prise de masse, adaptées au matériel (pas de congélateur, pas de blender).
// Les quantités sont pour 1 portion. kcal, protéines et coût sont calculés à partir des ingrédients.
// swap : 'feculent' | 'proteine' permet l'échange rapide dans la fiche recette.

export const EQUIPMENT = {
  plaques: { label: 'Plaques', emoji: '🔥' },
  poele: { label: 'Poêle', emoji: '🍳' },
  casserole: { label: 'Casserole', emoji: '🥘' },
  four: { label: 'Four', emoji: '♨️' },
  'micro-ondes': { label: 'Micro-ondes', emoji: '📡' },
  'grille-pain': { label: 'Grille-pain', emoji: '🍞' },
  aucun: { label: 'Sans cuisson', emoji: '🥄' },
};

export const MEALS = {
  petitdej: { label: 'Petit-déj', emoji: '☀️' },
  dej: { label: 'Déjeuner', emoji: '🍽️' },
  collation: { label: 'Collation', emoji: '🍎' },
  diner: { label: 'Dîner', emoji: '🌙' },
};
export const MEAL_KEYS = ['petitdej', 'dej', 'collation', 'diner'];

const R = (id, name, emoji, color, time, equipment, meals, ingredients, steps) =>
  ({ id, name, emoji, color, time, equipment, meals, ingredients, steps });
const i = (ing, qty, swap) => (swap ? { ing, qty, swap } : { ing, qty });

export const RECIPES = [
  R('pates_poulet_creme', 'Pâtes poulet, crème & champignons', '🍝', '#F6E9D7', 20,
    ['plaques', 'casserole', 'poele'], ['dej', 'diner'],
    [i('pates', 125, 'feculent'), i('poulet', 150, 'proteine'), i('creme', 50), i('champignons', 100), i('emmental', 20)],
    ['Cuire les pâtes dans une grande casserole d’eau salée.', 'Couper le poulet en dés, le dorer 6 min à la poêle.', 'Ajouter les champignons émincés, 3 min.', 'Verser la crème, mélanger avec les pâtes égouttées, parsemer d’emmental.']),

  R('carbo_express', 'Carbonara express aux lardons', '🥓', '#F3E6CF', 15,
    ['plaques', 'casserole', 'poele'], ['dej', 'diner'],
    [i('pates', 125, 'feculent'), i('lardons', 100, 'proteine'), i('oeufs', 1), i('creme', 40), i('emmental', 30)],
    ['Cuire les pâtes.', 'Faire revenir les lardons sans matière grasse.', 'Battre l’œuf avec la crème et l’emmental.', 'Hors du feu, mélanger pâtes chaudes, lardons et sauce.']),

  R('riz_saute_oeufs', 'Riz sauté aux œufs & légumes', '🍚', '#FBF0D2', 15,
    ['plaques', 'casserole', 'poele'], ['dej', 'diner'],
    [i('riz', 100, 'feculent'), i('oeufs', 2, 'proteine'), i('carottes', 80), i('poivron', 0.5), i('huile', 10)],
    ['Cuire le riz (ou utiliser un reste de la veille).', 'Faire sauter carottes et poivron en dés 4 min dans l’huile.', 'Pousser les légumes, brouiller les œufs dans la poêle.', 'Ajouter le riz, faire sauter 2 min, assaisonner.']),

  R('bowl_steak_riz', 'Bowl steak haché, riz & maïs', '🥩', '#F4DED6', 15,
    ['plaques', 'casserole', 'poele'], ['dej', 'diner'],
    [i('riz', 100, 'feculent'), i('steak15', 2, 'proteine'), i('mais', 80), i('tomate', 1)],
    ['Cuire le riz.', 'Cuire les steaks à la poêle 3 min par face.', 'Égoutter le maïs, couper la tomate.', 'Dresser en bol, ajouter une sauce si envie.']),

  R('omelette_jambon', 'Omelette jambon-fromage & pain', '🍳', '#FBF3D9', 8,
    ['plaques', 'poele'], ['petitdej', 'dej', 'diner'],
    [i('oeufs', 3, 'proteine'), i('jambon', 2), i('emmental', 30), i('pain', 80), i('beurre', 5)],
    ['Battre les œufs, saler, poivrer.', 'Fondre le beurre, verser les œufs.', 'Ajouter jambon et emmental, plier quand c’est pris.', 'Servir avec le pain.']),

  R('croque_monsieur', 'Croque-monsieur maison', '🥪', '#F5E8D3', 8,
    ['grille-pain'], ['dej', 'diner', 'collation'],
    [i('pain_mie', 4), i('jambon', 2, 'proteine'), i('emmental', 40), i('beurre', 10)],
    ['Beurrer légèrement le pain de mie.', 'Garnir de jambon et d’emmental.', 'Refermer et passer au grille-pain (position horizontale) ou 4 min à la poêle.']),

  R('porridge_banane_cac', 'Porridge banane & beurre de cacahuète', '🥣', '#EFE6D8', 5,
    ['micro-ondes'], ['petitdej'],
    [i('avoine', 70), i('lait', 250), i('banane', 1), i('beurre_cac', 20), i('miel', 10)],
    ['Mélanger flocons et lait dans un grand bol.', 'Micro-ondes 2 min, remuer, encore 1 min.', 'Ajouter banane en rondelles, beurre de cacahuète et miel.']),

  R('fb_miel_flocons', 'Fromage blanc, miel & flocons', '🍯', '#F7EEDC', 2,
    ['aucun'], ['petitdej', 'collation'],
    [i('fromage_blanc', 200), i('avoine', 30), i('miel', 15), i('banane', 1)],
    ['Verser le fromage blanc dans un bol.', 'Ajouter flocons, miel et banane coupée.']),

  R('tartines_cac_banane', 'Tartines cacahuète & banane', '🍞', '#F3E3CC', 4,
    ['grille-pain'], ['petitdej', 'collation'],
    [i('pain_mie', 3), i('beurre_cac', 25), i('banane', 1)],
    ['Griller le pain de mie.', 'Tartiner de beurre de cacahuète.', 'Ajouter des rondelles de banane.']),

  R('wrap_poulet_curry', 'Wrap poulet curry & fromage blanc', '🌯', '#F6E6C8', 12,
    ['plaques', 'poele'], ['dej', 'diner'],
    [i('wraps', 2, 'feculent'), i('poulet', 130, 'proteine'), i('fromage_blanc', 50), i('tomate', 1), i('epices', 2), i('huile', 5)],
    ['Émincer le poulet, le saisir 6 min avec le curry.', 'Mélanger le fromage blanc avec une pincée de sel : c’est la sauce.', 'Garnir les tortillas : sauce, poulet, tomate.', 'Rouler et dorer 1 min à la poêle.']),

  R('gnocchis_tomate_mozza', 'Gnocchis poêlés tomate-mozza', '🥟', '#F8DCD3', 12,
    ['plaques', 'poele'], ['dej', 'diner'],
    [i('gnocchis', 300, 'feculent'), i('sauce_tomate', 120), i('mozzarella', 60), i('huile', 5)],
    ['Dorer les gnocchis 6 min dans un filet d’huile.', 'Ajouter la sauce tomate, chauffer 2 min.', 'Déposer la mozzarella, couvrir 2 min pour qu’elle fonde.']),

  R('poulet_curry_riz', 'Poulet curry crémeux & riz', '🍛', '#F7E3BF', 25,
    ['plaques', 'casserole', 'poele'], ['dej', 'diner'],
    [i('riz', 100, 'feculent'), i('poulet', 150, 'proteine'), i('creme', 40), i('oignon', 0.5), i('epices', 3), i('huile', 5)],
    ['Lancer la cuisson du riz.', 'Faire revenir l’oignon émincé, puis le poulet en dés.', 'Ajouter le curry, puis la crème, laisser mijoter 5 min.', 'Servir sur le riz.']),

  R('gratin_pates_jambon', 'Gratin de pâtes au jambon', '🧀', '#F6E5C3', 30,
    ['four', 'plaques', 'casserole'], ['dej', 'diner'],
    [i('pates', 125, 'feculent'), i('jambon', 2, 'proteine'), i('creme', 50), i('emmental', 40)],
    ['Préchauffer le four à 200 °C, cuire les pâtes.', 'Mélanger pâtes, jambon coupé et crème dans un plat.', 'Couvrir d’emmental, enfourner 15 min.']),

  R('pdt_oeufs_plat', 'Pommes de terre sautées & œufs au plat', '🥔', '#F4E7C6', 25,
    ['plaques', 'poele'], ['dej', 'diner'],
    [i('pdt', 350, 'feculent'), i('oeufs', 2, 'proteine'), i('oignon', 0.5), i('huile', 15)],
    ['Couper les pommes de terre en petits dés.', 'Les cuire 15 min à la poêle couverte avec l’huile, puis 5 min à découvert.', 'Ajouter l’oignon, puis cuire les œufs au plat à côté.']),

  R('pates_pesto_poulet', 'Pâtes pesto & poulet', '🌿', '#E3EDD5', 15,
    ['plaques', 'casserole', 'poele'], ['dej', 'diner'],
    [i('pates', 125, 'feculent'), i('poulet', 120, 'proteine'), i('pesto', 30), i('emmental', 15)],
    ['Cuire les pâtes.', 'Dorer le poulet en lamelles.', 'Mélanger pâtes, poulet et pesto, ajouter l’emmental.']),

  R('salade_pates_thon', 'Salade de pâtes au thon', '🐟', '#DDEBF1', 15,
    ['plaques', 'casserole'], ['dej', 'diner'],
    [i('pates', 100, 'feculent'), i('thon', 100, 'proteine'), i('mais', 60), i('tomate', 1)],
    ['Cuire les pâtes, les refroidir.', 'Mélanger avec le thon émietté, le maïs et la tomate.']),

  R('dahl_lentilles', 'Dahl de lentilles express', '🫘', '#F1DEC8', 25,
    ['plaques', 'casserole'], ['dej', 'diner'],
    [i('lentilles', 80), i('tomates_pelees', 150), i('creme', 30), i('oignon', 0.5), i('epices', 3)],
    ['Faire revenir l’oignon et le curry.', 'Ajouter lentilles, tomates et 30 cl d’eau, cuire 20 min.', 'Finir avec la crème.']),

  R('saumon_riz_brocoli', 'Saumon, riz & brocoli', '🐟', '#F8DED6', 20,
    ['four', 'plaques', 'casserole'], ['dej', 'diner'],
    [i('saumon', 125, 'proteine'), i('riz', 100, 'feculent'), i('brocoli', 150), i('beurre', 10)],
    ['Four à 200 °C : saumon en papillote 15 min.', 'Cuire le riz, et le brocoli en fleurettes 8 min dans l’eau bouillante.', 'Servir avec une noisette de beurre.']),

  R('poelee_pois_chiches', 'Poêlée pois chiches, poulet & paprika', '🫛', '#F5E2C9', 15,
    ['plaques', 'poele'], ['dej', 'diner'],
    [i('pois_chiches', 120), i('poulet', 100, 'proteine'), i('poivron', 0.5), i('epices', 2), i('huile', 10), i('pain', 60)],
    ['Dorer le poulet en dés avec le paprika.', 'Ajouter poivron et pois chiches égouttés, 5 min.', 'Servir avec du pain pour saucer.']),

  R('steak_puree', 'Steak haché & purée maison', '🥔', '#F3E4CB', 25,
    ['plaques', 'casserole', 'poele'], ['dej', 'diner'],
    [i('pdt', 300, 'feculent'), i('steak15', 2, 'proteine'), i('lait', 80), i('beurre', 15)],
    ['Cuire les pommes de terre épluchées 20 min dans l’eau.', 'Écraser avec le lait chaud et le beurre.', 'Cuire les steaks 3 min par face.']),

  R('yaourt_compote_choco', 'Yaourt grec, compote & chocolat', '🍫', '#EEE2D8', 2,
    ['aucun'], ['collation', 'petitdej'],
    [i('yaourt_grec', 1), i('compote', 1), i('chocolat', 15)],
    ['Verser la compote sur le yaourt.', 'Ajouter quelques carrés de chocolat concassés.']),

  R('oeufs_brouilles_tartines', 'Œufs brouillés & tartines', '🍳', '#FBF1D3', 7,
    ['plaques', 'poele', 'grille-pain'], ['petitdej', 'dej'],
    [i('oeufs', 3, 'proteine'), i('pain_mie', 2), i('beurre', 10)],
    ['Griller le pain.', 'Fondre la moitié du beurre à feu doux, ajouter les œufs battus.', 'Remuer sans arrêt 2 min, retirer encore crémeux.']),

  R('bol_cereales', 'Bol de céréales, lait & banane', '🥣', '#F1E4D4', 2,
    ['aucun'], ['petitdej', 'collation'],
    [i('cereales', 60), i('lait', 250), i('banane', 1)],
    ['Verser céréales et lait, ajouter la banane.']),

  R('courgettes_farcies', 'Courgettes farcies au steak', '🥒', '#E3EDD5', 35,
    ['four', 'poele', 'plaques'], ['dej', 'diner'],
    [i('courgette', 300), i('steak15', 1, 'proteine'), i('sauce_tomate', 80), i('emmental', 30), i('riz', 60, 'feculent')],
    ['Four à 200 °C. Couper les courgettes en deux et les évider.', 'Émietter le steak à la poêle avec la chair de courgette et la sauce tomate.', 'Farcir, couvrir d’emmental, enfourner 20 min. Servir avec le riz.']),

  R('dinde_pates_tomate', 'Escalope de dinde, pâtes sauce tomate', '🍅', '#F7DDD3', 15,
    ['plaques', 'casserole', 'poele'], ['dej', 'diner'],
    [i('dinde', 150, 'proteine'), i('pates', 125, 'feculent'), i('sauce_tomate', 100), i('huile', 5)],
    ['Cuire les pâtes.', 'Saisir l’escalope 4 min par face.', 'Chauffer la sauce et napper le tout.']),

  R('pain_perdu', 'Pain perdu au micro-ondes', '🍮', '#F6E7CE', 6,
    ['micro-ondes'], ['petitdej', 'collation'],
    [i('pain_mie', 3), i('oeufs', 1), i('lait', 80), i('miel', 10)],
    ['Battre œuf et lait dans un bol, y tremper le pain coupé.', 'Micro-ondes 1 min 30.', 'Napper de miel.']),

  R('pomme_cac', 'Pomme & beurre de cacahuète', '🍎', '#F3E2D2', 2,
    ['aucun'], ['collation'],
    [i('pomme', 1), i('beurre_cac', 20)],
    ['Couper la pomme en quartiers, tremper dans le beurre de cacahuète.']),
];

export const RECIPE = Object.fromEntries(RECIPES.map((r) => [r.id, r]));
