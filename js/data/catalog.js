// Catalogue E.Leclerc (prix indicatifs, base locale).
// Les prix réels se synchronisent via l'import de ticket (state.priceOverrides).
// Chaque produit est relié à un ingrédient générique (ing) et exprimé dans l'unité de cet ingrédient.

export const BRANDS = {
  'Marque Repère': { short: 'MR', cls: 'mr' },
  'Eco+': { short: 'Eco+', cls: 'eco' },
  'Bio Village': { short: 'Bio', cls: 'bio' },
  'Rayon frais': { short: 'Vrac', cls: 'vrac' },
};

// Ordre de parcours du magasin (utilisé pour grouper la liste active).
export const AISLES = [
  'Fruits & Légumes',
  'Boulangerie',
  'Boucherie & Volaille',
  'Poissonnerie',
  'Crèmerie & Œufs',
  'Fromages',
  'Traiteur frais',
  'Épicerie salée',
  'Conserves',
  'Petit-déjeuner',
  'Épicerie sucrée',
  'Boissons',
  'Divers',
];

// p(id, ing, nom, marque, contenance, prix, rayon, mots-clés ticket)
const p = (id, ing, name, brand, size, price, aisle, keywords = [], extra = {}) =>
  ({ id, ing, name, brand, size, price, aisle, keywords, ...extra });

export const CATALOG = [
  // Fruits & Légumes
  p('banane_vrac', 'banane', 'Bananes (≈ 6)', 'Rayon frais', 6, 1.79, 'Fruits & Légumes', ['banane', 'bananes']),
  p('banane_bio', 'banane', 'Bananes bio x5', 'Bio Village', 5, 2.29, 'Fruits & Légumes', ['banane', 'bio']),
  p('pomme_gala', 'pomme', 'Pommes Gala 1,5 kg (≈ 8)', 'Marque Repère', 8, 2.49, 'Fruits & Légumes', ['pomme', 'pommes', 'gala']),
  p('tomate_grappe', 'tomate', 'Tomates grappe 1 kg (≈ 7)', 'Rayon frais', 7, 2.49, 'Fruits & Légumes', ['tomate', 'tomates', 'grappe']),
  p('courgette_kg', 'courgette', 'Courgettes 1 kg', 'Rayon frais', 1000, 2.19, 'Fruits & Légumes', ['courgette', 'courgettes']),
  p('brocoli_pc', 'brocoli', 'Brocoli (pièce ≈ 500 g)', 'Rayon frais', 500, 1.79, 'Fruits & Légumes', ['brocoli']),
  p('oignon_kg', 'oignon', 'Oignons jaunes 1 kg (≈ 8)', 'Marque Repère', 8, 1.39, 'Fruits & Légumes', ['oignon', 'oignons']),
  p('carottes_kg', 'carottes', 'Carottes 1 kg', 'Eco+', 1000, 1.09, 'Fruits & Légumes', ['carotte', 'carottes']),
  p('pdt_25', 'pdt', 'Pommes de terre 2,5 kg', 'Eco+', 2500, 2.99, 'Fruits & Légumes', ['pomme de terre', 'pdt', 'p.d.terre', 'pommes de terre']),
  p('poivron_x3', 'poivron', 'Poivrons tricolores x3', 'Marque Repère', 3, 2.29, 'Fruits & Légumes', ['poivron', 'poivrons']),
  p('champi_250', 'champignons', 'Champignons de Paris 250 g', 'Marque Repère', 250, 1.49, 'Fruits & Légumes', ['champignon', 'champignons', 'paris'], { shelf: 5 }),
  p('avocat_x2', 'avocat', 'Avocats x2', 'Rayon frais', 2, 1.99, 'Fruits & Légumes', ['avocat', 'avocats']),

  // Boulangerie
  p('pain_mie_mr', 'pain_mie', 'Pain de mie nature 500 g (20 tr.)', 'Marque Repère', 20, 1.29, 'Boulangerie', ['pain de mie', 'mie']),
  p('pain_mie_bio', 'pain_mie', 'Pain de mie complet bio (16 tr.)', 'Bio Village', 16, 1.99, 'Boulangerie', ['pain de mie', 'complet', 'bio']),
  p('baguette', 'pain', 'Baguette tradition 250 g', 'Rayon frais', 250, 0.95, 'Boulangerie', ['baguette', 'tradition']),
  p('wraps_mr', 'wraps', 'Tortillas de blé x8', 'Marque Repère', 8, 1.59, 'Boulangerie', ['tortilla', 'tortillas', 'wrap', 'wraps']),

  // Boucherie & Volaille
  p('poulet_mr', 'poulet', 'Filets de poulet x4 (500 g)', 'Marque Repère', 500, 6.29, 'Boucherie & Volaille', ['filet', 'filets', 'poulet']),
  p('poulet_eco', 'poulet', 'Aiguillettes de poulet 400 g', 'Eco+', 400, 4.19, 'Boucherie & Volaille', ['aiguillettes', 'poulet']),
  p('dinde_mr', 'dinde', 'Escalopes de dinde 400 g', 'Marque Repère', 400, 4.59, 'Boucherie & Volaille', ['escalope', 'escalopes', 'dinde']),
  p('steak15_mr', 'steak15', 'Steaks hachés 15 % x4 (400 g)', 'Marque Repère', 4, 3.79, 'Boucherie & Volaille', ['steak', 'steaks', 'hache', 'haches', '15%']),
  p('steak15_eco', 'steak15', 'Steaks hachés 15 % x2 (200 g)', 'Eco+', 2, 1.89, 'Boucherie & Volaille', ['steak', 'steaks', 'hache', '15%']),
  p('lardons_mr', 'lardons', 'Allumettes de lardons fumés 2x100 g', 'Marque Repère', 200, 1.89, 'Boucherie & Volaille', ['lardons', 'allumettes', 'fumes']),
  p('jambon_mr', 'jambon', 'Jambon blanc x4 tranches', 'Marque Repère', 4, 1.95, 'Boucherie & Volaille', ['jambon', 'blanc']),
  p('jambon_eco', 'jambon', 'Jambon blanc x6 tranches', 'Eco+', 6, 1.79, 'Boucherie & Volaille', ['jambon', 'blanc']),

  // Poissonnerie
  p('saumon_mr', 'saumon', 'Pavés de saumon x2 (250 g)', 'Marque Repère', 250, 5.49, 'Poissonnerie', ['saumon', 'paves', 'pave']),

  // Crèmerie & Œufs
  p('oeufs_mr', 'oeufs', 'Œufs plein air x12', 'Marque Repère', 12, 3.49, 'Crèmerie & Œufs', ['oeufs', 'oeuf', 'plein air', 'x12']),
  p('oeufs_eco', 'oeufs', 'Œufs x6', 'Eco+', 6, 1.39, 'Crèmerie & Œufs', ['oeufs', 'oeuf', 'x6']),
  p('oeufs_bio', 'oeufs', 'Œufs bio x6', 'Bio Village', 6, 2.59, 'Crèmerie & Œufs', ['oeufs', 'bio']),
  p('fb_mr', 'fromage_blanc', 'Fromage blanc 3,2 % 1 kg', 'Marque Repère', 1000, 1.95, 'Crèmerie & Œufs', ['fromage blanc', 'fromage', 'blanc', 'fr.blanc', 'fbl']),
  p('fb_eco', 'fromage_blanc', 'Fromage blanc nature 1 kg', 'Eco+', 1000, 1.55, 'Crèmerie & Œufs', ['fromage blanc', 'fromage', 'blanc', 'fr.blanc']),
  p('yaourt_grec_mr', 'yaourt_grec', 'Yaourts à la grecque x4', 'Marque Repère', 4, 1.65, 'Crèmerie & Œufs', ['yaourt', 'yaourts', 'grecque', 'grec']),
  p('lait_mr', 'lait', 'Lait demi-écrémé UHT 1 L', 'Marque Repère', 1000, 0.99, 'Crèmerie & Œufs', ['lait', 'demi', 'ecreme', 'uht']),
  p('lait_bio', 'lait', 'Lait demi-écrémé bio 1 L', 'Bio Village', 1000, 1.25, 'Crèmerie & Œufs', ['lait', 'bio']),
  p('beurre_mr', 'beurre', 'Beurre doux 250 g', 'Marque Repère', 250, 2.39, 'Crèmerie & Œufs', ['beurre', 'doux']),
  p('creme_mr', 'creme', 'Crème fraîche épaisse 15 % 20 cl', 'Marque Repère', 200, 1.09, 'Crèmerie & Œufs', ['creme', 'fraiche', 'epaisse']),

  // Fromages
  p('emmental_mr', 'emmental', 'Emmental râpé 200 g', 'Marque Repère', 200, 1.85, 'Fromages', ['emmental', 'rape', 'rapé']),
  p('emmental_eco', 'emmental', 'Emmental râpé 200 g', 'Eco+', 200, 1.49, 'Fromages', ['emmental', 'rape']),
  p('mozza_mr', 'mozzarella', 'Mozzarella 125 g', 'Marque Repère', 125, 0.89, 'Fromages', ['mozzarella', 'mozza']),

  // Traiteur frais
  p('gnocchis_mr', 'gnocchis', 'Gnocchis à poêler 500 g', 'Marque Repère', 500, 1.29, 'Traiteur frais', ['gnocchi', 'gnocchis']),

  // Épicerie salée
  p('pates_mr', 'pates', 'Torsades 1 kg', 'Marque Repère', 1000, 1.25, 'Épicerie salée', ['torsades', 'pates', 'pâtes']),
  p('pates_eco', 'pates', 'Spaghetti 500 g', 'Eco+', 500, 0.55, 'Épicerie salée', ['spaghetti', 'pates']),
  p('pates_bio', 'pates', 'Penne rigate bio 500 g', 'Bio Village', 500, 1.15, 'Épicerie salée', ['penne', 'bio', 'pates']),
  p('riz_mr', 'riz', 'Riz long grain 1 kg', 'Marque Repère', 1000, 1.69, 'Épicerie salée', ['riz', 'long']),
  p('riz_eco', 'riz', 'Riz long 1 kg', 'Eco+', 1000, 1.25, 'Épicerie salée', ['riz', 'long']),
  p('semoule_mr', 'semoule', 'Semoule moyenne 1 kg', 'Marque Repère', 1000, 1.39, 'Épicerie salée', ['semoule']),
  p('sauce_tomate_mr', 'sauce_tomate', 'Sauce tomate basilic 500 g', 'Marque Repère', 500, 1.05, 'Épicerie salée', ['sauce', 'tomate', 'basilic']),
  p('pesto_mr', 'pesto', 'Pesto alla genovese 190 g', 'Marque Repère', 190, 1.79, 'Épicerie salée', ['pesto', 'genovese']),
  p('huile_mr', 'huile', 'Huile de tournesol 1 L', 'Marque Repère', 1000, 1.89, 'Épicerie salée', ['huile', 'tournesol']),
  p('curry_mr', 'epices', 'Curry en poudre 40 g', 'Marque Repère', 40, 1.19, 'Épicerie salée', ['curry', 'epices', 'paprika']),
  p('lentilles_mr', 'lentilles', 'Lentilles vertes 500 g', 'Marque Repère', 500, 1.59, 'Épicerie salée', ['lentilles']),

  // Conserves
  p('tomates_pelees_eco', 'tomates_pelees', 'Tomates pelées 400 g', 'Eco+', 400, 0.69, 'Conserves', ['tomates', 'pelees', 'pelées']),
  p('mais_mr', 'mais', 'Maïs doux 285 g', 'Marque Repère', 285, 0.95, 'Conserves', ['mais', 'maïs', 'doux']),
  p('pois_chiches_mr', 'pois_chiches', 'Pois chiches 400 g (265 g égoutté)', 'Marque Repère', 265, 0.85, 'Conserves', ['pois', 'chiches']),
  p('thon_mr', 'thon', 'Thon entier au naturel 140 g', 'Marque Repère', 140, 1.89, 'Conserves', ['thon', 'naturel']),

  // Petit-déjeuner
  p('avoine_mr', 'avoine', "Flocons d'avoine 500 g", 'Marque Repère', 500, 0.99, 'Petit-déjeuner', ['flocons', 'avoine']),
  p('avoine_bio', 'avoine', "Flocons d'avoine bio 500 g", 'Bio Village', 500, 1.49, 'Petit-déjeuner', ['flocons', 'avoine', 'bio']),
  p('cereales_mr', 'cereales', 'Pétales chocolatés 750 g', 'Marque Repère', 750, 2.49, 'Petit-déjeuner', ['petales', 'cereales', 'chocolat']),
  p('beurre_cac_mr', 'beurre_cac', 'Beurre de cacahuète crunchy 340 g', 'Marque Repère', 340, 2.49, 'Petit-déjeuner', ['cacahuete', 'cacahuète', 'peanut', 'beurre cac']),
  p('miel_mr', 'miel', 'Miel toutes fleurs 500 g', 'Marque Repère', 500, 3.79, 'Petit-déjeuner', ['miel']),
  p('pate_tartiner_mr', 'pate_tartiner', 'Pâte à tartiner noisettes 750 g', 'Marque Repère', 750, 3.29, 'Petit-déjeuner', ['pate', 'tartiner', 'noisettes']),

  // Épicerie sucrée
  p('chocolat_eco', 'chocolat', 'Chocolat au lait 100 g', 'Eco+', 100, 0.79, 'Épicerie sucrée', ['chocolat', 'lait']),
  p('compote_mr', 'compote', 'Compote pomme nature x4', 'Marque Repère', 4, 1.15, 'Épicerie sucrée', ['compote', 'pomme']),

  // Boissons
  p('jus_orange_mr', 'jus_orange', "Pur jus d'orange 1 L", 'Marque Repère', 1000, 1.65, 'Boissons', ['jus', 'orange']),
];

export const PRODUCT = Object.fromEntries(CATALOG.map((x) => [x.id, x]));

/** Produit par défaut (le moins cher au kilo, hors bio) pour chaque ingrédient. */
export const DEFAULT_PRODUCT = (() => {
  const map = {};
  for (const prod of CATALOG) {
    const cur = map[prod.ing];
    const unitPrice = prod.price / prod.size;
    const curPrice = cur ? cur.price / cur.size : Infinity;
    if (prod.brand === 'Bio Village' && cur) continue;
    if (!cur || unitPrice < curPrice || cur.brand === 'Bio Village') map[prod.ing] = prod;
  }
  return Object.fromEntries(Object.entries(map).map(([k, v]) => [k, v.id]));
})();
