export const CATEGORIES = {
  viande: { label: 'Viandes', emoji: '🍗', aisle: 'Boucherie & Volaille' },
  poisson: { label: 'Poissons', emoji: '🐟', aisle: 'Poissonnerie' },
  vegetal: { label: 'Protéines végétales', emoji: '🫘', aisle: 'Épicerie salée' },
  laitier: { label: 'Œufs & crèmerie', emoji: '🥛', aisle: 'Crèmerie & Œufs' },
  fromage: { label: 'Fromages', emoji: '🧀', aisle: 'Fromages' },
  feculent: { label: 'Féculents & pains', emoji: '🍝', aisle: 'Épicerie salée' },
  legume: { label: 'Légumes', emoji: '🥕', aisle: 'Fruits & Légumes' },
  fruit: { label: 'Fruits', emoji: '🍎', aisle: 'Fruits & Légumes' },
  sucre: { label: 'Sucré', emoji: '🍫', aisle: 'Épicerie sucrée' },
  sale: { label: 'Sauces & salé', emoji: '🫙', aisle: 'Épicerie salée' },
  epice: { label: 'Épices & herbes', emoji: '🧂', aisle: 'Épicerie salée' },
  boisson: { label: 'Boissons', emoji: '🧃', aisle: 'Boissons' },
};

const ROWS = [
  ['poulet', 'Blanc de poulet', '🍗', 'viande', 'g', 110, 23, 'frigo', 4, 500, 6.29, { sizes: [250, 500, 1000], portion: 150, kw: 'filet filets aiguillettes escalope poulet', nat: 'Le Gaulois' }],
  ['cuisse_poulet', 'Cuisses de poulet', '🍗', 'viande', 'g', 190, 18, 'frigo', 4, 1000, 4.99, { portion: 250, kw: 'cuisse cuisses pilon pilons', nat: 'Le Gaulois' }],
  ['dinde', 'Escalope de dinde', '🦃', 'viande', 'g', 105, 23, 'frigo', 4, 400, 4.59, { portion: 150, kw: 'escalope escalopes dinde', nat: 'Le Gaulois' }],
  ['steak5', 'Steak haché 5 %', '🥩', 'viande', 'pc', 125, 21, 'frigo', 4, 4, 4.49, { sizes: [1, 2, 4, 8], portion: 2, unitLabel: 'steak', kw: 'steak steaks hache haches 5%', nat: 'Charal' }],
  ['steak15', 'Steak haché 15 %', '🥩', 'viande', 'pc', 215, 17, 'frigo', 4, 4, 3.79, { sizes: [1, 2, 4, 8], portion: 2, unitLabel: 'steak', kw: 'steak steaks hache haches 15%', nat: 'Charal' }],
  ['steak20', 'Steak haché 20 %', '🥩', 'viande', 'pc', 250, 17, 'frigo', 4, 4, 3.49, { sizes: [2, 4, 8], portion: 2, unitLabel: 'steak', kw: 'steak steaks hache haches 20%', nat: 'Charal' }],
  ['emince_boeuf', 'Émincé de bœuf', '🥩', 'viande', 'g', 140, 22, 'frigo', 3, 400, 7.9, { portion: 150, kw: 'emince boeuf bœuf lanieres', nat: 'Charal' }],
  ['cotes_porc', 'Côtes de porc', '🥩', 'viande', 'pc', 250, 26, 'frigo', 4, 2, 3.99, { sizes: [1, 2, 4], portion: 1, unitLabel: 'côte', kw: 'cote cotes porc echine' }],
  ['saucisses', 'Saucisses de Toulouse', '🌭', 'viande', 'pc', 330, 16, 'frigo', 7, 6, 4.29, { sizes: [4, 6, 12], portion: 2, unitLabel: 'saucisse', kw: 'saucisse saucisses toulouse' }],
  ['merguez', 'Merguez', '🌭', 'viande', 'pc', 190, 9, 'frigo', 7, 6, 3.49, { portion: 3, kw: 'merguez' }],
  ['chipolatas', 'Chipolatas', '🌭', 'viande', 'pc', 150, 7, 'frigo', 7, 6, 3.29, { portion: 3, unitLabel: 'chipolata', kw: 'chipolata chipolatas' }],
  ['saucisses_strasbourg', 'Saucisses de Strasbourg', '🌭', 'viande', 'pc', 120, 5.5, 'frigo', 21, 10, 2.39, { portion: 2, unitLabel: 'saucisse', kw: 'strasbourg knack knacks', nat: 'Herta' }],
  ['jambon', 'Jambon blanc', '🥓', 'viande', 'pc', 45, 8, 'frigo', 7, 4, 1.95, { sizes: [2, 4, 6, 8], portion: 2, unitLabel: 'tranche', kw: 'jambon blanc tranches paris sel reduit', nat: 'Herta|Fleury Michon' }],
  ['jambon_cru', 'Jambon cru', '🥓', 'viande', 'pc', 40, 5, 'frigo', 14, 6, 2.49, { portion: 3, unitLabel: 'tranche', kw: 'jambon cru serrano bayonne' }],
  ['blanc_dinde', 'Blanc de dinde en tranches', '🦃', 'viande', 'pc', 30, 6, 'frigo', 7, 6, 1.89, { portion: 3, unitLabel: 'tranche', kw: 'blanc dinde tranches', nat: 'Herta' }],
  ['bacon', 'Bacon', '🥓', 'viande', 'pc', 30, 3.5, 'frigo', 21, 10, 1.99, { portion: 3, unitLabel: 'tranche', kw: 'bacon' }],
  ['lardons', 'Lardons fumés', '🥓', 'viande', 'g', 270, 15, 'frigo', 14, 200, 1.89, { portion: 100, kw: 'lardons allumettes fumes fumees fumee', nat: 'Herta' }],
  ['cordon_bleu', 'Cordon bleu', '🍗', 'viande', 'pc', 230, 13, 'frigo', 10, 4, 3.29, { sizes: [2, 4, 8], portion: 1, unitLabel: 'cordon bleu', kw: 'cordon bleu cordons', nat: 'Le Gaulois' }],
  ['nuggets', 'Nuggets de poulet', '🍗', 'viande', 'g', 250, 14, 'frigo', 10, 400, 3.49, { portion: 180, kw: 'nuggets', nat: 'Père Dodu' }],

  ['saumon', 'Pavé de saumon', '🐟', 'poisson', 'g', 200, 20, 'frigo', 3, 250, 5.49, { portion: 125, kw: 'saumon pave paves' }],
  ['saumon_fume', 'Saumon fumé', '🐟', 'poisson', 'pc', 50, 6, 'frigo', 14, 4, 4.99, { portion: 3, unitLabel: 'tranche', kw: 'saumon fume', nat: 'Labeyrie' }],
  ['cabillaud', 'Dos de cabillaud', '🐟', 'poisson', 'g', 80, 18, 'frigo', 3, 400, 6.99, { portion: 150, kw: 'cabillaud dos' }],
  ['poisson_blanc', 'Filet de colin', '🐟', 'poisson', 'g', 80, 17, 'frigo', 3, 400, 5.49, { portion: 150, kw: 'colin lieu merlu filet poisson' }],
  ['poisson_pane', 'Poisson pané', '🐟', 'poisson', 'pc', 120, 7, 'frigo', 10, 4, 2.49, { portion: 2, unitLabel: 'pièce', kw: 'pane panes poisson' }],
  ['thon', 'Thon au naturel', '🐟', 'poisson', 'g', 110, 26, 'placard', 900, 140, 1.89, { portion: 100, kw: 'thon naturel', nat: 'Petit Navire' }],
  ['sardines', "Sardines à l'huile", '🐟', 'poisson', 'g', 210, 24, 'placard', 900, 135, 1.49, { portion: 100, kw: 'sardine sardines', nat: 'Connétable' }],
  ['maquereau', 'Maquereaux en conserve', '🐟', 'poisson', 'g', 200, 18, 'placard', 900, 176, 1.79, { portion: 100, kw: 'maquereau maquereaux' }],
  ['crevettes', 'Crevettes cuites', '🦐', 'poisson', 'g', 100, 21, 'frigo', 3, 200, 4.49, { portion: 120, kw: 'crevette crevettes' }],
  ['surimi', 'Surimi', '🦀', 'poisson', 'pc', 16, 1.2, 'frigo', 14, 16, 1.99, { portion: 6, unitLabel: 'bâtonnet', kw: 'surimi batonnets' }],

  ['tofu', 'Tofu nature', '🧈', 'vegetal', 'g', 120, 13, 'frigo', 21, 400, 2.49, { portion: 150, kw: 'tofu' }],
  ['steak_vege', 'Steak végétal', '🌱', 'vegetal', 'pc', 200, 15, 'frigo', 10, 2, 2.99, { portion: 1, unitLabel: 'steak', kw: 'vegetal vegetarien soja' }],
  ['lentilles', 'Lentilles vertes', '🫘', 'vegetal', 'g', 330, 24, 'placard', 600, 500, 1.59, { portion: 80, kw: 'lentilles vertes' }],
  ['lentilles_corail', 'Lentilles corail', '🫘', 'vegetal', 'g', 340, 24, 'placard', 600, 500, 1.79, { portion: 80, kw: 'lentilles corail' }],
  ['pois_chiches', 'Pois chiches', '🫛', 'vegetal', 'g', 120, 7, 'placard', 900, 265, 0.85, { portion: 150, kw: 'pois chiches' }],
  ['haricots_rouges', 'Haricots rouges', '🫘', 'vegetal', 'g', 110, 8, 'placard', 900, 250, 0.89, { portion: 120, kw: 'haricots rouges' }],
  ['haricots_blancs', 'Haricots blancs', '🫘', 'vegetal', 'g', 100, 7, 'placard', 900, 265, 0.85, { portion: 120, kw: 'haricots blancs lingots' }],
  ['houmous', 'Houmous', '🫓', 'vegetal', 'g', 300, 7, 'frigo', 14, 200, 1.79, { kw: 'houmous hummus' }],

  ['oeufs', 'Œufs', '🥚', 'laitier', 'pc', 75, 6.5, 'frigo', 24, 12, 3.49, { sizes: [6, 12, 30], portion: 3, unitLabel: 'œuf', kw: 'oeuf oeufs plein air', nat: 'Matines' }],
  ['lait', 'Lait demi-écrémé', '🥛', 'laitier', 'ml', 46, 3.2, 'placard', 90, 1000, 0.99, { sizes: [500, 1000, 6000], kw: 'lait demi ecreme uht hdf haute distinction', nat: 'Lactel' }],
  ['lait_entier', 'Lait entier', '🥛', 'laitier', 'ml', 64, 3.2, 'placard', 90, 1000, 1.15, { kw: 'lait entier', nat: 'Lactel' }],
  ['lait_ecreme', 'Lait écrémé', '🥛', 'laitier', 'ml', 34, 3.3, 'placard', 90, 1000, 0.95, { kw: 'lait ecreme' }],
  ['lait_avoine', "Boisson à l'avoine", '🌾', 'laitier', 'ml', 45, 1, 'placard', 180, 1000, 1.59, { kw: 'boisson avoine vegetale', nat: 'Bjorg' }],
  ['fromage_blanc', 'Fromage blanc 3 %', '🥛', 'laitier', 'g', 75, 7.5, 'frigo', 18, 1000, 1.95, { kw: 'fromage blanc fbl', nat: 'Danone' }],
  ['fromage_blanc0', 'Fromage blanc 0 %', '🥛', 'laitier', 'g', 46, 7.5, 'frigo', 18, 1000, 1.75, { kw: 'fromage blanc 0%' }],
  ['skyr', 'Skyr nature', '🥛', 'laitier', 'g', 63, 11, 'frigo', 21, 500, 2.09, { kw: 'skyr', nat: 'Siggi’s' }],
  ['yaourt', 'Yaourt nature', '🥛', 'laitier', 'pc', 75, 4.5, 'frigo', 25, 12, 2.19, { sizes: [4, 8, 12], unitLabel: 'pot', kw: 'yaourt yaourts nature', nat: 'Danone' }],
  ['yaourt_grec', 'Yaourt à la grecque', '🥣', 'laitier', 'pc', 150, 4.5, 'frigo', 20, 4, 1.65, { sizes: [4, 8], unitLabel: 'pot', kw: 'yaourt grecque grec' }],
  ['creme_dessert', 'Crème dessert chocolat', '🍮', 'laitier', 'pc', 140, 4, 'frigo', 25, 4, 1.49, { unitLabel: 'pot', kw: 'creme dessert chocolat viennois liegeois', nat: 'Danette' }],
  ['creme', 'Crème fraîche 15 %', '🥛', 'laitier', 'ml', 160, 3, 'frigo', 21, 200, 1.09, { kw: 'creme fraiche epaisse legere', nat: 'Elle & Vire' }],
  ['creme_30', 'Crème fraîche 30 %', '🥛', 'laitier', 'ml', 290, 2.3, 'frigo', 21, 200, 1.29, { kw: 'creme fraiche entiere 30%' }],
  ['beurre', 'Beurre doux', '🧈', 'laitier', 'g', 740, 0.7, 'frigo', 45, 250, 2.39, { kw: 'beurre doux', nat: 'Président' }],

  ['emmental', 'Emmental râpé', '🧀', 'fromage', 'g', 380, 28, 'frigo', 30, 200, 1.85, { kw: 'emmental rape', nat: 'Président' }],
  ['comte', 'Comté', '🧀', 'fromage', 'g', 410, 27, 'frigo', 30, 200, 3.29, { kw: 'comte' }],
  ['mozzarella', 'Mozzarella', '🧀', 'fromage', 'g', 250, 18, 'frigo', 14, 125, 0.89, { kw: 'mozzarella mozza', nat: 'Galbani' }],
  ['feta', 'Feta', '🧀', 'fromage', 'g', 270, 15, 'frigo', 30, 200, 2.19, { kw: 'feta' }],
  ['chevre', 'Bûche de chèvre', '🧀', 'fromage', 'g', 300, 18, 'frigo', 21, 180, 1.99, { kw: 'chevre buche' }],
  ['camembert', 'Camembert', '🧀', 'fromage', 'g', 280, 20, 'frigo', 21, 250, 1.79, { kw: 'camembert', nat: 'Président' }],
  ['raclette', 'Fromage à raclette', '🧀', 'fromage', 'g', 340, 23, 'frigo', 21, 400, 4.49, { kw: 'raclette' }],
  ['parmesan', 'Parmesan râpé', '🧀', 'fromage', 'g', 400, 33, 'frigo', 60, 100, 2.49, { kw: 'parmesan parmigiano grana' }],
  ['fromage_frais', 'Fromage frais à tartiner', '🧀', 'fromage', 'g', 240, 7, 'frigo', 21, 150, 1.59, { kw: 'fromage frais tartiner ail fines herbes' }],
  ['cheddar', 'Cheddar en tranches', '🧀', 'fromage', 'pc', 70, 4, 'frigo', 30, 10, 1.99, { unitLabel: 'tranche', kw: 'cheddar tranches burger hamburg hamburger fine' }],

  ['pates', 'Pâtes', '🍝', 'feculent', 'g', 360, 12, 'placard', 540, 1000, 1.25, { portion: 125, kw: 'pates torsades spaghetti penne coquillettes macaroni fusilli tagliatelles farfalle', nat: 'Panzani|Barilla' }],
  ['pates_completes', 'Pâtes complètes', '🍝', 'feculent', 'g', 350, 13, 'placard', 540, 500, 0.99, { portion: 125, kw: 'pates completes' }],
  ['riz', 'Riz long', '🍚', 'feculent', 'g', 350, 7, 'placard', 540, 1000, 1.69, { portion: 100, kw: 'riz long grain', nat: 'Ben’s Original' }],
  ['riz_basmati', 'Riz basmati', '🍚', 'feculent', 'g', 355, 8, 'placard', 540, 1000, 2.29, { portion: 100, kw: 'riz basmati', nat: 'Taureau Ailé' }],
  ['riz_complet', 'Riz complet', '🍚', 'feculent', 'g', 350, 8, 'placard', 540, 1000, 1.99, { portion: 100, kw: 'riz complet' }],
  ['semoule', 'Semoule', '🥣', 'feculent', 'g', 360, 12, 'placard', 400, 1000, 1.39, { portion: 100, kw: 'semoule couscous', nat: 'Tipiak' }],
  ['boulgour', 'Boulgour', '🥣', 'feculent', 'g', 350, 12, 'placard', 400, 500, 1.39, { portion: 90, kw: 'boulgour' }],
  ['quinoa', 'Quinoa', '🥣', 'feculent', 'g', 370, 14, 'placard', 400, 400, 2.99, { portion: 80, kw: 'quinoa' }],
  ['nouilles', 'Nouilles chinoises', '🍜', 'feculent', 'g', 380, 11, 'placard', 400, 250, 1.29, { portion: 100, kw: 'nouilles' }],
  ['gnocchis', 'Gnocchis frais', '🥟', 'feculent', 'g', 160, 4, 'frigo', 30, 500, 1.29, { portion: 300, kw: 'gnocchi gnocchis', nat: 'Lustucru' }],
  ['pdt', 'Pommes de terre', '🥔', 'feculent', 'g', 80, 2, 'placard', 21, 2500, 2.99, { portion: 350, fresh: true, aisle: 'Fruits & Légumes', kw: 'pomme de terre pommes pdt p.d.terre' }],
  ['patate_douce', 'Patate douce', '🍠', 'feculent', 'g', 86, 1.6, 'placard', 21, 1000, 2.49, { portion: 300, fresh: true, aisle: 'Fruits & Légumes', kw: 'patate douce' }],
  ['puree_flocons', 'Purée en flocons', '🥔', 'feculent', 'g', 350, 8, 'placard', 300, 250, 1.29, { portion: 60, kw: 'puree flocons', nat: 'Mousline' }],
  ['pain_mie', 'Pain de mie', '🍞', 'feculent', 'pc', 70, 2.5, 'placard', 10, 20, 1.29, { portion: 4, unitLabel: 'tranche', aisle: 'Boulangerie', kw: 'pain de mie', nat: 'Harrys' }],
  ['pain_complet', 'Pain de mie complet', '🍞', 'feculent', 'pc', 65, 3, 'placard', 10, 16, 1.49, { portion: 3, unitLabel: 'tranche', aisle: 'Boulangerie', kw: 'pain complet cereales' }],
  ['pain', 'Baguette', '🥖', 'feculent', 'g', 270, 9, 'placard', 2, 250, 0.95, { portion: 100, aisle: 'Boulangerie', kw: 'baguette tradition pain' }],
  ['pain_burger', 'Pains burger', '🍔', 'feculent', 'pc', 150, 5, 'placard', 10, 6, 1.49, { portion: 1, unitLabel: 'pain', aisle: 'Boulangerie', kw: 'pain burger burgers buns brioch brioche', nat: 'Harrys' }],
  ['wraps', 'Tortillas de blé', '🌯', 'feculent', 'pc', 180, 5, 'placard', 30, 8, 1.59, { portion: 2, unitLabel: 'tortilla', aisle: 'Boulangerie', kw: 'tortilla tortillas wrap wraps', nat: 'Old El Paso' }],
  ['brioche', 'Brioche tranchée', '🍞', 'feculent', 'g', 360, 8, 'placard', 7, 500, 1.79, { aisle: 'Boulangerie', kw: 'brioche', nat: 'Pasquier' }],
  ['biscottes', 'Biscottes', '🍞', 'feculent', 'pc', 38, 1.2, 'placard', 180, 36, 1.49, { unitLabel: 'biscotte', aisle: 'Petit-déjeuner', kw: 'biscotte biscottes' }],
  ['avoine', "Flocons d'avoine", '🌾', 'feculent', 'g', 370, 13, 'placard', 300, 500, 0.99, { aisle: 'Petit-déjeuner', kw: 'flocons avoine', nat: 'Quaker' }],
  ['muesli', 'Muesli', '🥣', 'feculent', 'g', 380, 9, 'placard', 240, 500, 1.99, { aisle: 'Petit-déjeuner', kw: 'muesli' }],
  ['granola', 'Granola', '🥣', 'feculent', 'g', 450, 9, 'placard', 240, 375, 2.49, { aisle: 'Petit-déjeuner', kw: 'granola croustillant' }],
  ['cereales', 'Céréales chocolatées', '🥣', 'feculent', 'g', 390, 8, 'placard', 200, 750, 2.49, { aisle: 'Petit-déjeuner', kw: 'cereales petales chocolat', nat: 'Kellogg’s' }],
  ['pate_pizza', 'Pâte à pizza', '🍕', 'feculent', 'g', 270, 7, 'frigo', 21, 260, 1.19, { aisle: 'Traiteur frais', kw: 'pate pizza', nat: 'Herta' }],
  ['pate_feuilletee', 'Pâte feuilletée', '🥧', 'feculent', 'g', 380, 6, 'frigo', 21, 230, 0.99, { aisle: 'Traiteur frais', kw: 'pate feuilletee brisee', nat: 'Herta' }],
  ['farine', 'Farine de blé', '🌾', 'feculent', 'g', 345, 10, 'placard', 365, 1000, 0.85, { kw: 'farine' }],

  ['tomate', 'Tomates', '🍅', 'legume', 'pc', 20, 1, 'placard', 6, 7, 2.49, { unitLabel: 'tomate', fresh: true, kw: 'tomate tomates grappe ronde' }],
  ['tomates_cerises', 'Tomates cerises', '🍅', 'legume', 'g', 20, 1, 'frigo', 7, 250, 1.79, { fresh: true, kw: 'tomates cerises' }],
  ['tomates_pelees', 'Tomates pelées', '🥫', 'legume', 'g', 25, 1, 'placard', 700, 400, 0.69, { aisle: 'Conserves', kw: 'tomates pelees concassees entieres' }],
  ['sauce_tomate', 'Sauce tomate cuisinée', '🥫', 'legume', 'g', 55, 1.5, 'placard', 500, 500, 1.05, { kw: 'sauce tomate basilic', nat: 'Panzani' }],
  ['courgette', 'Courgettes', '🥒', 'legume', 'g', 17, 1.2, 'frigo', 7, 1000, 2.19, { fresh: true, kw: 'courgette courgettes' }],
  ['brocoli', 'Brocoli', '🥦', 'legume', 'g', 34, 2.8, 'frigo', 5, 500, 1.79, { fresh: true, kw: 'brocoli brocolis' }],
  ['chou_fleur', 'Chou-fleur', '🥦', 'legume', 'g', 25, 2, 'frigo', 6, 800, 1.99, { fresh: true, kw: 'chou fleur' }],
  ['oignon', 'Oignons jaunes', '🧅', 'legume', 'pc', 40, 1, 'placard', 30, 8, 1.39, { unitLabel: 'oignon', fresh: true, kw: 'oignon oignons' }],
  ['ail', 'Ail', '🧄', 'legume', 'pc', 4, 0.2, 'placard', 60, 30, 1.29, { unitLabel: 'gousse', fresh: true, staple: true, kw: 'ail gousse' }],
  ['carottes', 'Carottes', '🥕', 'legume', 'g', 40, 1, 'frigo', 14, 1000, 1.09, { fresh: true, kw: 'carotte carottes' }],
  ['poivron', 'Poivrons', '🫑', 'legume', 'pc', 30, 1, 'frigo', 8, 3, 2.29, { unitLabel: 'poivron', fresh: true, kw: 'poivron poivrons' }],
  ['champignons', 'Champignons de Paris', '🍄', 'legume', 'g', 22, 3, 'frigo', 5, 250, 1.49, { fresh: true, kw: 'champignon champignons paris' }],
  ['salade', 'Salade verte', '🥬', 'legume', 'g', 15, 1.3, 'frigo', 5, 200, 1.49, { fresh: true, kw: 'salade laitue mache roquette batavia' }],
  ['concombre', 'Concombre', '🥒', 'legume', 'pc', 40, 2, 'frigo', 7, 1, 0.99, { unitLabel: 'concombre', fresh: true, kw: 'concombre' }],
  ['epinards', 'Pousses d’épinards', '🥬', 'legume', 'g', 25, 3, 'frigo', 4, 300, 1.99, { fresh: true, kw: 'epinard epinards' }],
  ['aubergine', 'Aubergines', '🍆', 'legume', 'g', 25, 1, 'frigo', 7, 500, 1.99, { fresh: true, kw: 'aubergine aubergines' }],
  ['poireau', 'Poireaux', '🥬', 'legume', 'g', 30, 1.5, 'frigo', 10, 1000, 2.29, { fresh: true, kw: 'poireau poireaux' }],
  ['butternut', 'Courge butternut', '🎃', 'legume', 'g', 45, 1, 'placard', 30, 1500, 1.99, { fresh: true, kw: 'butternut courge potiron' }],
  ['haricots_verts', 'Haricots verts', '🫛', 'legume', 'g', 30, 2, 'placard', 700, 440, 1.09, { aisle: 'Conserves', kw: 'haricots verts' }],
  ['petits_pois', 'Petits pois', '🫛', 'legume', 'g', 70, 5, 'placard', 700, 280, 0.99, { aisle: 'Conserves', kw: 'petits pois' }],
  ['mais', 'Maïs doux', '🌽', 'legume', 'g', 80, 2.5, 'placard', 700, 285, 0.95, { aisle: 'Conserves', kw: 'mais doux', nat: 'Géant Vert' }],
  ['avocat', 'Avocat', '🥑', 'legume', 'pc', 230, 3, 'placard', 5, 2, 1.99, { unitLabel: 'avocat', fresh: true, kw: 'avocat avocats' }],

  ['banane', 'Bananes', '🍌', 'fruit', 'pc', 105, 1.3, 'placard', 6, 6, 1.79, { unitLabel: 'banane', fresh: true, kw: 'banane bananes' }],
  ['pomme', 'Pommes', '🍎', 'fruit', 'pc', 80, 0.4, 'placard', 20, 8, 2.49, { unitLabel: 'pomme', fresh: true, kw: 'pomme pommes gala golden' }],
  ['poire', 'Poires', '🍐', 'fruit', 'pc', 90, 0.6, 'placard', 10, 6, 2.49, { unitLabel: 'poire', fresh: true, kw: 'poire poires' }],
  ['orange', 'Oranges', '🍊', 'fruit', 'pc', 60, 1.2, 'placard', 20, 12, 2.99, { unitLabel: 'orange', fresh: true, kw: 'orange oranges' }],
  ['clementine', 'Clémentines', '🍊', 'fruit', 'pc', 35, 0.6, 'placard', 14, 14, 2.49, { unitLabel: 'clémentine', fresh: true, kw: 'clementine clementines mandarine' }],
  ['kiwi', 'Kiwis', '🥝', 'fruit', 'pc', 45, 0.8, 'placard', 14, 6, 1.99, { fresh: true, kw: 'kiwi kiwis' }],
  ['fraises', 'Fraises', '🍓', 'fruit', 'g', 32, 0.7, 'frigo', 3, 250, 2.99, { fresh: true, kw: 'fraise fraises' }],
  ['fruits_rouges', 'Fruits rouges', '🫐', 'fruit', 'g', 45, 1, 'frigo', 4, 250, 3.49, { fresh: true, kw: 'fruits rouges myrtilles framboises' }],
  ['raisin', 'Raisin', '🍇', 'fruit', 'g', 70, 0.7, 'frigo', 6, 500, 2.49, { fresh: true, kw: 'raisin' }],
  ['citron', 'Citrons', '🍋', 'fruit', 'pc', 20, 0.4, 'placard', 21, 4, 1.49, { unitLabel: 'citron', fresh: true, kw: 'citron citrons' }],
  ['mangue', 'Mangue', '🥭', 'fruit', 'pc', 200, 1.5, 'placard', 5, 1, 1.49, { unitLabel: 'mangue', fresh: true, kw: 'mangue' }],
  ['compote', 'Compote pomme', '🍏', 'fruit', 'pc', 70, 0.3, 'placard', 120, 4, 1.15, { unitLabel: 'pot', aisle: 'Épicerie sucrée', kw: 'compote gourde', nat: 'Andros' }],
  ['raisins_secs', 'Raisins secs', '🍇', 'fruit', 'g', 300, 3, 'placard', 300, 250, 1.69, { aisle: 'Épicerie sucrée', kw: 'raisins secs' }],
  ['dattes', 'Dattes', '🌴', 'fruit', 'g', 280, 2.5, 'placard', 300, 250, 2.29, { aisle: 'Épicerie sucrée', kw: 'dattes' }],

  ['miel', 'Miel', '🍯', 'sucre', 'g', 320, 0, 'placard', 700, 500, 3.79, { aisle: 'Petit-déjeuner', kw: 'miel' }],
  ['confiture', 'Confiture', '🍓', 'sucre', 'g', 250, 0.4, 'placard', 365, 370, 1.79, { aisle: 'Petit-déjeuner', kw: 'confiture', nat: 'Bonne Maman' }],
  ['pate_tartiner', 'Pâte à tartiner', '🌰', 'sucre', 'g', 540, 6, 'placard', 240, 750, 3.29, { aisle: 'Petit-déjeuner', kw: 'pate tartiner noisettes nutella', nat: 'Nutella' }],
  ['chocolat_poudre', 'Chocolat en poudre', '🍫', 'sucre', 'g', 380, 5, 'placard', 365, 450, 1.99, { aisle: 'Petit-déjeuner', kw: 'chocolat poudre cacao', nat: 'Nesquik' }],
  ['chocolat', 'Chocolat au lait', '🍫', 'sucre', 'g', 540, 7, 'placard', 270, 100, 0.79, { kw: 'chocolat lait tablette', nat: 'Milka' }],
  ['chocolat_noir', 'Chocolat noir', '🍫', 'sucre', 'g', 560, 8, 'placard', 365, 100, 0.99, { kw: 'chocolat noir', nat: 'Lindt' }],
  ['sucre', 'Sucre', '🍬', 'sucre', 'g', 400, 0, 'placard', 700, 1000, 1.15, { staple: true, kw: 'sucre' }],
  ['biscuits', 'Biscuits petit-déjeuner', '🍪', 'sucre', 'g', 450, 7, 'placard', 240, 400, 1.59, { kw: 'biscuits gateaux sables', nat: 'LU' }],
  ['madeleines', 'Madeleines', '🧁', 'sucre', 'pc', 110, 1.5, 'placard', 60, 12, 1.69, { unitLabel: 'madeleine', kw: 'madeleine madeleines', nat: 'St Michel' }],

  ['huile', 'Huile de tournesol', '🫒', 'sale', 'ml', 900, 0, 'placard', 500, 1000, 1.89, { staple: true, kw: 'huile tournesol', nat: 'Lesieur' }],
  ['huile_olive', "Huile d'olive", '🫒', 'sale', 'ml', 900, 0, 'placard', 500, 750, 5.49, { staple: true, kw: 'huile olive', nat: 'Puget' }],
  ['beurre_cac', 'Beurre de cacahuète', '🥜', 'sale', 'g', 600, 25, 'placard', 240, 340, 2.49, { aisle: 'Petit-déjeuner', kw: 'cacahuete peanut beurre cac', nat: 'Menguy’s' }],
  ['amandes', 'Amandes', '🌰', 'sale', 'g', 600, 21, 'placard', 240, 200, 2.49, { kw: 'amande amandes' }],
  ['noix', 'Cerneaux de noix', '🌰', 'sale', 'g', 700, 15, 'placard', 240, 125, 2.49, { kw: 'noix cerneaux' }],
  ['cacahuetes', 'Cacahuètes', '🥜', 'sale', 'g', 600, 25, 'placard', 240, 300, 1.79, { kw: 'cacahuetes' }],
  ['pesto', 'Pesto', '🌿', 'sale', 'g', 450, 5, 'placard', 300, 190, 1.79, { kw: 'pesto genovese', nat: 'Barilla' }],
  ['ketchup', 'Ketchup', '🍅', 'sale', 'g', 110, 1.5, 'placard', 365, 560, 1.99, { kw: 'ketchup', nat: 'Heinz' }],
  ['mayonnaise', 'Mayonnaise', '🥚', 'sale', 'g', 700, 1, 'placard', 180, 235, 1.29, { kw: 'mayonnaise mayo', nat: 'Amora' }],
  ['moutarde', 'Moutarde', '🟡', 'sale', 'g', 150, 7, 'placard', 365, 370, 0.99, { staple: true, kw: 'moutarde dijon', nat: 'Maille' }],
  ['sauce_soja', 'Sauce soja', '🥢', 'sale', 'ml', 60, 8, 'placard', 700, 250, 1.79, { staple: true, kw: 'sauce soja' }],
  ['bouillon', 'Bouillon cube', '🧊', 'sale', 'pc', 10, 0.5, 'placard', 700, 12, 1.19, { staple: true, unitLabel: 'cube', kw: 'bouillon cube', nat: 'Knorr' }],
  ['lait_coco', 'Lait de coco', '🥥', 'sale', 'ml', 170, 1.5, 'placard', 700, 400, 1.29, { aisle: 'Conserves', kw: 'lait coco' }],

  ['sel', 'Sel', '🧂', 'epice', 'g', 0, 0, 'placard', 1500, 1000, 0.59, { staple: true, kw: 'sel' }],
  ['poivre', 'Poivre', '🧂', 'epice', 'g', 0, 0, 'placard', 900, 50, 1.49, { staple: true, kw: 'poivre', nat: 'Ducros' }],
  ['epices', "Mélange d'épices", '🧂', 'epice', 'g', 0, 0, 'placard', 700, 40, 1.19, { staple: true, kw: 'epices melange' }],
  ['curry', 'Curry', '🟠', 'epice', 'g', 0, 0, 'placard', 700, 40, 1.19, { staple: true, kw: 'curry', nat: 'Ducros' }],
  ['paprika', 'Paprika', '🌶️', 'epice', 'g', 0, 0, 'placard', 700, 40, 1.19, { staple: true, kw: 'paprika', nat: 'Ducros' }],
  ['cumin', 'Cumin', '🟤', 'epice', 'g', 0, 0, 'placard', 700, 40, 1.19, { staple: true, kw: 'cumin', nat: 'Ducros' }],
  ['curcuma', 'Curcuma', '🟡', 'epice', 'g', 0, 0, 'placard', 700, 40, 1.29, { staple: true, kw: 'curcuma' }],
  ['gingembre', 'Gingembre', '🫚', 'epice', 'g', 0, 0, 'placard', 700, 40, 1.39, { staple: true, kw: 'gingembre' }],
  ['cannelle', 'Cannelle', '🟤', 'epice', 'g', 0, 0, 'placard', 700, 40, 1.29, { staple: true, kw: 'cannelle' }],
  ['piment', 'Piment', '🌶️', 'epice', 'g', 0, 0, 'placard', 700, 40, 1.39, { staple: true, kw: 'piment espelette chili' }],
  ['ras_el_hanout', 'Ras el hanout', '🟠', 'epice', 'g', 0, 0, 'placard', 700, 40, 1.39, { staple: true, kw: 'ras el hanout couscous' }],
  ['herbes_provence', 'Herbes de Provence', '🌿', 'epice', 'g', 0, 0, 'placard', 700, 30, 1.19, { staple: true, kw: 'herbes provence thym' }],
  ['origan', 'Origan', '🌿', 'epice', 'g', 0, 0, 'placard', 700, 20, 1.19, { staple: true, kw: 'origan' }],
  ['basilic', 'Basilic', '🌿', 'epice', 'g', 0, 0, 'placard', 700, 20, 1.19, { staple: true, kw: 'basilic' }],
  ['persil', 'Persil', '🌿', 'epice', 'g', 0, 0, 'placard', 700, 20, 1.19, { staple: true, kw: 'persil' }],
  ['ciboulette', 'Ciboulette', '🌿', 'epice', 'g', 0, 0, 'placard', 700, 20, 1.19, { staple: true, kw: 'ciboulette' }],
  ['muscade', 'Noix de muscade', '🟤', 'epice', 'g', 0, 0, 'placard', 900, 30, 1.69, { staple: true, kw: 'muscade' }],
  ['vanille', 'Sucre vanillé', '🍦', 'epice', 'g', 0, 0, 'placard', 900, 75, 0.99, { staple: true, kw: 'vanille vanilline' }],

  ['jus_orange', "Jus d'orange", '🧃', 'boisson', 'ml', 45, 0.7, 'placard', 120, 1000, 1.65, { kw: 'jus orange', nat: 'Tropicana' }],
  ['jus_pomme', 'Jus de pomme', '🧃', 'boisson', 'ml', 45, 0.1, 'placard', 120, 1000, 1.29, { kw: 'jus pomme' }],

  ['poulet_entier', 'Poulet entier', '🍗', 'viande', 'g', 200, 19, 'frigo', 4, 1300, 6.99, { kw: 'poulet entier fermier label' }],
  ['poulet_roti_cuit', 'Poulet rôti cuit', '🍗', 'viande', 'g', 190, 26, 'frigo', 3, 1000, 7.99, { aisle: 'Traiteur frais', kw: 'poulet roti cuit' }],
  ['emince_poulet_cuit', 'Émincés de poulet cuits', '🍗', 'viande', 'g', 130, 24, 'frigo', 7, 150, 2.49, { portion: 120, aisle: 'Traiteur frais', kw: 'emince emincés poulet cuit roti fume' }],
  ['hache_boeuf', 'Viande hachée 15 % (barquette)', '🥩', 'viande', 'g', 215, 17, 'frigo', 3, 500, 5.49, { portion: 150, kw: 'viande hachee boeuf haché vrac', nat: 'Charal' }],
  ['pizza', 'Pizza', '🍕', 'feculent', 'g', 250, 10, 'frigo', 5, 400, 3.49, { aisle: 'Traiteur frais', kw: 'pizza pepperoni pepperono margherita reine' }],
  ['plat_prepare', 'Plat préparé', '🥘', 'feculent', 'g', 150, 7, 'frigo', 4, 300, 3.49, { aisle: 'Traiteur frais', kw: 'welsh lasagnes hachis parmentier gratin tartiflette paella couscous plat' }],
  ['navet', 'Navets', '🥬', 'legume', 'g', 28, 1, 'frigo', 14, 1000, 1.99, { fresh: true, kw: 'navet navets' }],
  ['chair_saucisse', 'Chair à saucisse', '🥩', 'viande', 'g', 280, 15, 'frigo', 3, 500, 4.49, { portion: 150, kw: 'chair saucisse farce farcir' }],
  ['boulettes','Boulettes de bœuf', '🥩', 'viande', 'g', 230, 16, 'frigo', 7, 300, 3.49, { portion: 150, kw: 'boulettes' }],
  ['boeuf_bourguignon', 'Bœuf à bourguignon', '🥩', 'viande', 'g', 160, 26, 'frigo', 3, 600, 8.99, { portion: 180, kw: 'bourguignon pot au feu braiser' }],
  ['entrecote', 'Entrecôte', '🥩', 'viande', 'g', 200, 21, 'frigo', 3, 300, 7.49, { portion: 200, kw: 'entrecote faux filet bavette rumsteck' }],
  ['veau', 'Escalope de veau', '🥩', 'viande', 'g', 110, 22, 'frigo', 3, 300, 8.9, { portion: 150, kw: 'veau escalope' }],
  ['roti_porc', 'Rôti de porc', '🥩', 'viande', 'g', 160, 25, 'frigo', 4, 800, 7.49, { portion: 150, kw: 'roti porc filet mignon' }],
  ['agneau', "Côtelettes d'agneau", '🥩', 'viande', 'g', 250, 18, 'frigo', 3, 400, 8.99, { portion: 180, kw: 'agneau cotelettes gigot' }],
  ['canard', 'Magret de canard', '🦆', 'viande', 'g', 200, 20, 'frigo', 5, 400, 8.49, { portion: 180, kw: 'canard magret aiguillettes' }],
  ['chorizo', 'Chorizo', '🌶️', 'viande', 'g', 450, 24, 'frigo', 30, 200, 2.49, { kw: 'chorizo' }],
  ['saucisson', 'Saucisson sec', '🥓', 'viande', 'g', 420, 26, 'placard', 60, 250, 3.49, { kw: 'saucisson sec' }],
  ['rillettes', 'Rillettes', '🥓', 'viande', 'g', 400, 15, 'frigo', 21, 220, 1.99, { aisle: 'Traiteur frais', kw: 'rillettes' }],
  ['pate_campagne', 'Pâté de campagne', '🥓', 'viande', 'g', 290, 14, 'frigo', 14, 250, 1.69, { aisle: 'Traiteur frais', kw: 'pate campagne terrine mousse' }],
  ['dinde_hachee', 'Dinde hachée', '🦃', 'viande', 'g', 140, 21, 'frigo', 3, 400, 4.49, { portion: 150, kw: 'dinde hachee' }],

  ['thon_huile', "Thon à l'huile", '🐟', 'poisson', 'g', 190, 26, 'placard', 900, 160, 2.29, { kw: 'thon huile olive', nat: 'Petit Navire' }],
  ['truite_fumee', 'Truite fumée', '🐟', 'poisson', 'pc', 50, 6, 'frigo', 14, 4, 3.99, { unitLabel: 'tranche', kw: 'truite fumee' }],
  ['moules', 'Moules', '🦪', 'poisson', 'g', 70, 12, 'frigo', 2, 1000, 4.99, { kw: 'moules' }],
  ['calamars', 'Calamars', '🦑', 'poisson', 'g', 90, 16, 'frigo', 3, 300, 4.49, { kw: 'calamar calamars encornets' }],
  ['tarama', 'Tarama', '🐟', 'poisson', 'g', 500, 6, 'frigo', 21, 100, 1.79, { aisle: 'Traiteur frais', kw: 'tarama' }],
  ['saumon_cuit', 'Saumon cuit en conserve', '🐟', 'poisson', 'g', 150, 22, 'placard', 900, 210, 3.49, { kw: 'saumon rose conserve' }],

  ['seitan', 'Seitan', '🌱', 'vegetal', 'g', 140, 25, 'frigo', 21, 250, 2.99, { portion: 120, kw: 'seitan' }],
  ['falafels', 'Falafels', '🧆', 'vegetal', 'pc', 60, 2.5, 'frigo', 14, 12, 2.49, { portion: 5, unitLabel: 'falafel', aisle: 'Traiteur frais', kw: 'falafel falafels' }],
  ['flageolets', 'Flageolets', '🫘', 'vegetal', 'g', 100, 7, 'placard', 900, 265, 0.99, { kw: 'flageolets' }],
  ['pois_casses', 'Pois cassés', '🫛', 'vegetal', 'g', 330, 22, 'placard', 600, 500, 1.39, { portion: 80, kw: 'pois casses' }],
  ['soja_texture', 'Protéines de soja texturées', '🌱', 'vegetal', 'g', 340, 50, 'placard', 365, 200, 2.49, { portion: 50, kw: 'soja texture pst' }],
  ['edamame', 'Edamame', '🫛', 'vegetal', 'g', 120, 11, 'frigo', 5, 300, 2.99, { kw: 'edamame feves soja' }],

  ['lait_soja', 'Boisson au soja', '🥛', 'laitier', 'ml', 40, 3.5, 'placard', 180, 1000, 1.49, { kw: 'boisson soja lait soja', nat: 'Bjorg' }],
  ['lait_amande', "Boisson à l'amande", '🥛', 'laitier', 'ml', 25, 0.5, 'placard', 180, 1000, 1.79, { kw: 'boisson amande lait amande', nat: 'Bjorg' }],
  ['lait_chocolat', 'Lait chocolaté', '🥛', 'laitier', 'ml', 75, 3.2, 'placard', 180, 1000, 1.59, { kw: 'lait chocolate cacao' }],
  ['kefir', 'Kéfir', '🥛', 'laitier', 'ml', 60, 3.4, 'frigo', 21, 1000, 2.49, { kw: 'kefir lait fermente ribot' }],
  ['whey', 'Protéine en poudre (whey)', '💪', 'laitier', 'g', 380, 75, 'placard', 365, 500, 14.9, { aisle: 'Petit-déjeuner', kw: 'whey proteine poudre' }],
  ['blancs_oeufs', "Blancs d'œufs", '🥚', 'laitier', 'ml', 48, 10.5, 'frigo', 21, 500, 3.49, { kw: 'blancs oeufs' }],
  ['creme_liquide', 'Crème liquide 30 %', '🥛', 'laitier', 'ml', 290, 2.3, 'frigo', 21, 200, 1.19, { kw: 'creme liquide entiere fleurette cuisine' }],
  ['beurre_demi_sel', 'Beurre demi-sel', '🧈', 'laitier', 'g', 740, 0.7, 'frigo', 45, 250, 2.49, { kw: 'beurre demi sel', nat: 'Président' }],
  ['mascarpone', 'Mascarpone', '🥛', 'laitier', 'g', 420, 5, 'frigo', 21, 250, 1.99, { kw: 'mascarpone' }],
  ['ricotta', 'Ricotta', '🥛', 'laitier', 'g', 140, 9, 'frigo', 14, 250, 1.89, { kw: 'ricotta' }],
  ['cottage', 'Cottage cheese', '🥛', 'laitier', 'g', 100, 11, 'frigo', 14, 200, 1.79, { kw: 'cottage cheese' }],
  ['petits_suisses', 'Petits-suisses', '🥛', 'laitier', 'pc', 80, 5, 'frigo', 21, 6, 1.49, { sizes: [6, 12], unitLabel: 'pot', kw: 'petits suisses' }],
  ['yaourt_fruits', 'Yaourts aux fruits', '🍓', 'laitier', 'pc', 120, 4, 'frigo', 25, 8, 2.49, { sizes: [4, 8, 16], unitLabel: 'pot', kw: 'yaourt fruits aromatise', nat: 'Danone' }],
  ['yaourt_soja', 'Yaourts au soja', '🌱', 'laitier', 'pc', 70, 4, 'frigo', 25, 4, 1.99, { unitLabel: 'pot', kw: 'yaourt soja vegetal', nat: 'Sojasun' }],
  ['riz_au_lait', 'Riz au lait', '🍮', 'laitier', 'pc', 140, 3.5, 'frigo', 21, 4, 1.69, { unitLabel: 'pot', kw: 'riz au lait', nat: 'La Laitière' }],

  ['reblochon', 'Reblochon', '🧀', 'fromage', 'g', 330, 20, 'frigo', 21, 450, 5.49, { kw: 'reblochon tartiflette' }],
  ['brie', 'Brie', '🧀', 'fromage', 'g', 330, 20, 'frigo', 21, 200, 2.29, { kw: 'brie coulommiers' }],
  ['gouda', 'Gouda', '🧀', 'fromage', 'g', 360, 25, 'frigo', 30, 200, 2.49, { kw: 'gouda edam mimolette' }],
  ['roquefort', 'Roquefort', '🧀', 'fromage', 'g', 370, 19, 'frigo', 30, 100, 2.49, { kw: 'roquefort bleu' }],
  ['mozza_rapee', 'Mozzarella râpée', '🧀', 'fromage', 'g', 290, 22, 'frigo', 21, 200, 1.99, { kw: 'mozzarella rapee pizza' }],
  ['halloumi', 'Halloumi', '🧀', 'fromage', 'g', 320, 21, 'frigo', 30, 225, 2.99, { kw: 'halloumi griller' }],
  ['mini_fromages', 'Mini fromages', '🧀', 'fromage', 'pc', 60, 4.5, 'frigo', 30, 12, 3.49, { unitLabel: 'portion', kw: 'mini fromages babybel', nat: 'Babybel' }],
  ['fromage_fondu', 'Portions de fromage fondu', '🧀', 'fromage', 'pc', 50, 1.7, 'frigo', 60, 8, 1.69, { unitLabel: 'portion', kw: 'fromage fondu portions kiri vache', nat: 'La Vache qui rit' }],

  ['pates_fraiches', 'Pâtes fraîches', '🍝', 'feculent', 'g', 280, 11, 'frigo', 21, 400, 1.99, { portion: 150, aisle: 'Traiteur frais', kw: 'pates fraiches tagliatelles fraiches', nat: 'Lustucru' }],
  ['raviolis', 'Raviolis frais', '🥟', 'feculent', 'g', 260, 11, 'frigo', 21, 300, 2.29, { portion: 200, aisle: 'Traiteur frais', kw: 'raviolis ravioles tortellini', nat: 'Giovanni Rana' }],
  ['lasagnes', 'Feuilles de lasagne', '🍝', 'feculent', 'g', 360, 12, 'placard', 540, 500, 1.39, { portion: 90, kw: 'lasagne lasagnes feuilles' }],
  ['riz_thai', 'Riz thaï', '🍚', 'feculent', 'g', 350, 7, 'placard', 540, 1000, 2.19, { portion: 100, kw: 'riz thai parfume jasmin' }],
  ['ble', 'Blé précuit', '🌾', 'feculent', 'g', 350, 12, 'placard', 400, 500, 1.79, { portion: 90, kw: 'ble precuit ebly', nat: 'Ebly' }],
  ['polenta', 'Polenta', '🌽', 'feculent', 'g', 360, 8, 'placard', 400, 500, 1.49, { portion: 80, kw: 'polenta' }],
  ['pain_campagne', 'Pain de campagne', '🍞', 'feculent', 'g', 260, 9, 'placard', 4, 500, 2.19, { aisle: 'Boulangerie', kw: 'pain campagne cereales seigle' }],
  ['croissants', 'Croissants', '🥐', 'feculent', 'pc', 180, 4, 'placard', 3, 6, 2.49, { sizes: [4, 6, 10], unitLabel: 'croissant', aisle: 'Boulangerie', kw: 'croissant croissants' }],
  ['pains_chocolat', 'Pains au chocolat', '🥐', 'feculent', 'pc', 220, 4, 'placard', 3, 6, 2.69, { sizes: [4, 6, 10], unitLabel: 'pain au chocolat', aisle: 'Boulangerie', kw: 'pain au chocolat chocolatine' }],
  ['bagels', 'Bagels', '🥯', 'feculent', 'pc', 230, 9, 'placard', 10, 4, 1.99, { unitLabel: 'bagel', aisle: 'Boulangerie', kw: 'bagel bagels' }],
  ['pita', 'Pains pita', '🫓', 'feculent', 'pc', 160, 5.5, 'placard', 10, 6, 1.29, { unitLabel: 'pita', aisle: 'Boulangerie', kw: 'pita pitas pain libanais' }],
  ['galettes_riz', 'Galettes de riz soufflé', '🍘', 'feculent', 'pc', 28, 0.6, 'placard', 180, 20, 1.29, { unitLabel: 'galette', aisle: 'Petit-déjeuner', kw: 'galettes riz souffle' }],
  ['corn_flakes', 'Pétales de maïs', '🥣', 'feculent', 'g', 380, 7, 'placard', 240, 500, 1.99, { aisle: 'Petit-déjeuner', kw: 'corn flakes petales mais', nat: 'Kellogg’s' }],

  ['pulpe_tomate', 'Pulpe ou passata de tomate', '🥫', 'legume', 'g', 30, 1.4, 'placard', 700, 500, 0.99, { aisle: 'Conserves', kw: 'pulpe passata coulis tomate fine', nat: 'Mutti' }],
  ['concentre_tomate', 'Concentré de tomate', '🥫', 'legume', 'g', 85, 4.5, 'placard', 700, 140, 0.69, { aisle: 'Conserves', kw: 'concentre tomate double' }],
  ['ratatouille', 'Ratatouille cuisinée', '🥫', 'legume', 'g', 70, 1.3, 'placard', 700, 375, 1.99, { aisle: 'Conserves', kw: 'ratatouille' }],
  ['chou', 'Chou vert', '🥬', 'legume', 'g', 25, 1.5, 'frigo', 14, 1000, 1.49, { fresh: true, kw: 'chou vert blanc rouge' }],
  ['betterave', 'Betteraves cuites', '🟣', 'legume', 'g', 45, 1.5, 'frigo', 7, 500, 1.29, { kw: 'betterave betteraves' }],
  ['radis', 'Radis', '🌸', 'legume', 'g', 15, 1, 'frigo', 5, 250, 1.29, { fresh: true, kw: 'radis' }],
  ['fenouil', 'Fenouil', '🌿', 'legume', 'g', 20, 1.2, 'frigo', 7, 500, 1.99, { fresh: true, kw: 'fenouil' }],
  ['endive', 'Endives', '🥬', 'legume', 'g', 17, 1, 'frigo', 7, 1000, 2.49, { fresh: true, kw: 'endive endives chicon' }],
  ['echalote', 'Échalotes', '🧅', 'legume', 'pc', 10, 0.3, 'placard', 30, 10, 1.49, { unitLabel: 'échalote', fresh: true, kw: 'echalote echalotes' }],
  ['patate_chips', 'Chips', '🥔', 'sale', 'g', 540, 6, 'placard', 180, 150, 1.29, { kw: 'chips', nat: 'Lay’s' }],
  ['olives', 'Olives', '🫒', 'sale', 'g', 150, 1, 'placard', 365, 150, 1.49, { kw: 'olives vertes noires' }],
  ['cornichons', 'Cornichons', '🥒', 'sale', 'g', 15, 0.5, 'placard', 365, 200, 1.29, { kw: 'cornichons' }],
  ['legumes_poeles', 'Poêlée de légumes', '🥦', 'legume', 'g', 45, 2, 'frigo', 5, 600, 2.49, { kw: 'poelee legumes wok' }],

  ['peche', 'Pêches', '🍑', 'fruit', 'pc', 50, 1, 'placard', 5, 6, 2.49, { unitLabel: 'pêche', fresh: true, kw: 'peche peches nectarine brugnon abricot' }],
  ['ananas', 'Ananas', '🍍', 'fruit', 'g', 50, 0.5, 'placard', 6, 1000, 1.99, { fresh: true, kw: 'ananas' }],
  ['melon', 'Melon', '🍈', 'fruit', 'g', 35, 0.8, 'placard', 5, 1000, 2.49, { fresh: true, kw: 'melon pasteque' }],
  ['cerises', 'Cerises', '🍒', 'fruit', 'g', 63, 1, 'frigo', 4, 500, 3.99, { fresh: true, kw: 'cerise cerises' }],
  ['pamplemousse', 'Pamplemousses', '🍊', 'fruit', 'pc', 80, 1.5, 'placard', 14, 2, 1.29, { unitLabel: 'pamplemousse', fresh: true, kw: 'pamplemousse pomelo' }],
  ['citron_vert', 'Citrons verts', '🍋', 'fruit', 'pc', 20, 0.4, 'placard', 21, 3, 1.29, { unitLabel: 'citron vert', fresh: true, kw: 'citron vert lime' }],
  ['abricots_secs', 'Abricots secs', '🍑', 'fruit', 'g', 240, 3.5, 'placard', 300, 250, 2.49, { aisle: 'Épicerie sucrée', kw: 'abricots secs pruneaux figues sechees' }],
  ['fruits_sirop', 'Fruits au sirop', '🍑', 'fruit', 'g', 70, 0.4, 'placard', 700, 410, 1.49, { aisle: 'Conserves', kw: 'fruits sirop cocktail peches poires au sirop' }],

  ['cookies', 'Cookies', '🍪', 'sucre', 'g', 490, 6, 'placard', 180, 200, 1.49, { kw: 'cookies', nat: 'Granola' }],
  ['barres_cereales', 'Barres de céréales', '🍫', 'sucre', 'pc', 90, 1.5, 'placard', 180, 6, 1.49, { unitLabel: 'barre', kw: 'barre barres cereales' }],
  ['barres_proteinees', 'Barres protéinées', '💪', 'sucre', 'pc', 200, 20, 'placard', 270, 4, 4.99, { unitLabel: 'barre', kw: 'barre proteinee protein bar' }],
  ['gaufres', 'Gaufres', '🧇', 'sucre', 'pc', 140, 2, 'placard', 30, 10, 1.99, { unitLabel: 'gaufre', kw: 'gaufre gaufres' }],
  ['pain_epices', "Pain d'épices", '🍞', 'sucre', 'g', 330, 4, 'placard', 60, 300, 1.69, { kw: 'pain epices' }],
  ['chocolat_blanc', 'Chocolat blanc', '🍫', 'sucre', 'g', 550, 6, 'placard', 270, 100, 1.19, { kw: 'chocolat blanc' }],
  ['pepites_chocolat', 'Pépites de chocolat', '🍫', 'sucre', 'g', 500, 6, 'placard', 365, 100, 1.49, { kw: 'pepites chocolat patissier' }],
  ['sirop_erable', "Sirop d'érable", '🍁', 'sucre', 'g', 260, 0, 'placard', 365, 250, 4.99, { aisle: 'Petit-déjeuner', kw: 'sirop erable agave' }],
  ['bicarbonate', 'Bicarbonate alimentaire', '🧂', 'sucre', 'g', 0, 0, 'placard', 900, 500, 1.29, { staple: true, kw: 'bicarbonate soude' }],
  ['levure', 'Levure chimique', '🧁', 'sucre', 'g', 0, 0, 'placard', 700, 50, 0.89, { staple: true, kw: 'levure chimique boulanger' }],

  ['vinaigre', 'Vinaigre balsamique', '🫙', 'sale', 'ml', 100, 0.5, 'placard', 700, 250, 1.79, { staple: true, kw: 'vinaigre balsamique cidre vin' }],
  ['vinaigrette', 'Vinaigrette', '🥗', 'sale', 'ml', 300, 0.3, 'placard', 180, 500, 1.49, { kw: 'vinaigrette sauce salade', nat: 'Lesieur' }],
  ['sauce_bbq', 'Sauce barbecue', '🍖', 'sale', 'g', 150, 1, 'placard', 365, 400, 1.79, { kw: 'sauce barbecue bbq', nat: 'Heinz' }],
  ['sauce_blanche', 'Sauce blanche / samouraï', '🥙', 'sale', 'g', 450, 1, 'placard', 180, 300, 1.69, { kw: 'sauce blanche samourai algerienne kebab', nat: 'Amora' }],
  ['harissa', 'Harissa', '🌶️', 'sale', 'g', 70, 2, 'placard', 365, 135, 1.29, { staple: true, kw: 'harissa' }],
  ['tahini', 'Purée de sésame (tahini)', '🫙', 'sale', 'g', 600, 18, 'placard', 365, 250, 3.49, { kw: 'tahini tahin sesame puree' }],
  ['puree_amande', "Purée d'amandes", '🌰', 'sale', 'g', 630, 22, 'placard', 365, 250, 4.99, { aisle: 'Petit-déjeuner', kw: 'puree amande cajou noisette' }],
  ['noix_cajou', 'Noix de cajou', '🥜', 'sale', 'g', 600, 18, 'placard', 240, 200, 2.99, { kw: 'noix cajou' }],
  ['pistaches', 'Pistaches', '🥜', 'sale', 'g', 600, 20, 'placard', 240, 200, 3.49, { kw: 'pistaches' }],
  ['noisettes', 'Noisettes', '🌰', 'sale', 'g', 650, 15, 'placard', 240, 200, 2.79, { kw: 'noisettes' }],
  ['graines_chia', 'Graines de chia', '🌱', 'sale', 'g', 490, 17, 'placard', 365, 200, 2.99, { aisle: 'Petit-déjeuner', kw: 'chia lin graines' }],
  ['sesame', 'Graines de sésame', '🌱', 'sale', 'g', 600, 18, 'placard', 365, 100, 1.49, { staple: true, kw: 'sesame graines' }],
  ['tapenade', 'Tapenade', '🫒', 'sale', 'g', 300, 2, 'placard', 365, 90, 1.79, { kw: 'tapenade' }],
  ['pate_curry', 'Pâte de curry', '🍛', 'sale', 'g', 150, 3, 'placard', 365, 100, 2.29, { staple: true, kw: 'pate curry rouge vert thai' }],
  ['mais_popcorn', 'Maïs à pop-corn', '🍿', 'sale', 'g', 380, 12, 'placard', 365, 500, 1.49, { kw: 'pop corn popcorn' }],

  ['cajun', 'Épices cajun', '🌶️', 'epice', 'g', 0, 0, 'placard', 700, 40, 1.29, { staple: true, kw: 'cajun' }],
  ['epices_poulet', 'Assaisonnement poulet rôti', '🍗', 'epice', 'g', 0, 0, 'placard', 700, 40, 1.29, { staple: true, kw: 'poulet roti assaisonnement' }],
  ['aneth', 'Aneth', '🌿', 'epice', 'g', 0, 0, 'placard', 700, 15, 1.39, { staple: true, kw: 'aneth' }],
  ['coriandre', 'Coriandre', '🌿', 'epice', 'g', 0, 0, 'placard', 700, 15, 1.29, { staple: true, kw: 'coriandre' }],
  ['estragon', 'Estragon', '🌿', 'epice', 'g', 0, 0, 'placard', 700, 15, 1.39, { staple: true, kw: 'estragon' }],
  ['romarin', 'Romarin', '🌿', 'epice', 'g', 0, 0, 'placard', 700, 20, 1.19, { staple: true, kw: 'romarin' }],
  ['thym', 'Thym', '🌿', 'epice', 'g', 0, 0, 'placard', 700, 20, 1.19, { staple: true, kw: 'thym' }],
  ['laurier', 'Laurier', '🍃', 'epice', 'g', 0, 0, 'placard', 900, 10, 1.19, { staple: true, kw: 'laurier' }],
  ['sauge', 'Sauge', '🌿', 'epice', 'g', 0, 0, 'placard', 700, 15, 1.29, { staple: true, kw: 'sauge' }],
  ['menthe', 'Menthe', '🌿', 'epice', 'g', 0, 0, 'placard', 700, 15, 1.29, { staple: true, kw: 'menthe' }],
  ['herbes_italiennes', 'Herbes italiennes', '🌿', 'epice', 'g', 0, 0, 'placard', 700, 25, 1.29, { staple: true, kw: 'herbes italiennes pizza' }],
  ['fines_herbes', 'Fines herbes', '🌿', 'epice', 'g', 0, 0, 'placard', 700, 20, 1.29, { staple: true, kw: 'fines herbes' }],
  ['paprika_fume', 'Paprika fumé', '🌶️', 'epice', 'g', 0, 0, 'placard', 700, 40, 1.49, { staple: true, kw: 'paprika fume' }],
  ['espelette', "Piment d'Espelette", '🌶️', 'epice', 'g', 0, 0, 'placard', 700, 30, 3.49, { staple: true, kw: 'espelette' }],
  ['cayenne', 'Piment de Cayenne', '🌶️', 'epice', 'g', 0, 0, 'placard', 700, 40, 1.29, { staple: true, kw: 'cayenne' }],
  ['chili', 'Chili en poudre', '🌶️', 'epice', 'g', 0, 0, 'placard', 700, 40, 1.29, { staple: true, kw: 'chili con carne poudre' }],
  ['garam_masala', 'Garam masala', '🟠', 'epice', 'g', 0, 0, 'placard', 700, 40, 1.49, { staple: true, kw: 'garam masala' }],
  ['tandoori', 'Tandoori', '🟠', 'epice', 'g', 0, 0, 'placard', 700, 40, 1.49, { staple: true, kw: 'tandoori tikka' }],
  ['colombo', 'Colombo', '🟡', 'epice', 'g', 0, 0, 'placard', 700, 40, 1.49, { staple: true, kw: 'colombo' }],
  ['epices_tacos', 'Épices tacos et fajitas', '🌮', 'epice', 'g', 0, 0, 'placard', 700, 30, 1.49, { staple: true, kw: 'tacos fajitas mexicain' }],
  ['epices_kebab', 'Épices kebab', '🥙', 'epice', 'g', 0, 0, 'placard', 700, 30, 1.49, { staple: true, kw: 'kebab gyros shawarma' }],
  ['epices_bbq', 'Épices barbecue', '🍖', 'epice', 'g', 0, 0, 'placard', 700, 40, 1.49, { staple: true, kw: 'barbecue grill' }],
  ['quatre_epices', 'Quatre-épices', '🟤', 'epice', 'g', 0, 0, 'placard', 700, 30, 1.39, { staple: true, kw: 'quatre epices' }],
  ['cinq_baies', 'Poivre cinq baies', '🧂', 'epice', 'g', 0, 0, 'placard', 900, 40, 2.29, { staple: true, kw: 'cinq baies poivre' }],
  ['cardamome', 'Cardamome', '🟢', 'epice', 'g', 0, 0, 'placard', 900, 25, 2.49, { staple: true, kw: 'cardamome' }],
  ['clou_girofle', 'Clous de girofle', '🟤', 'epice', 'g', 0, 0, 'placard', 900, 25, 1.69, { staple: true, kw: 'clou girofle' }],
  ['badiane', 'Badiane', '⭐', 'epice', 'g', 0, 0, 'placard', 900, 20, 1.99, { staple: true, kw: 'badiane anis etoile' }],
  ['safran', 'Safran', '🟠', 'epice', 'g', 0, 0, 'placard', 900, 1, 3.99, { staple: true, kw: 'safran' }],
  ['sumac', 'Sumac', '🔴', 'epice', 'g', 0, 0, 'placard', 900, 30, 2.49, { staple: true, kw: 'sumac' }],
  ['zaatar', 'Zaatar', '🌿', 'epice', 'g', 0, 0, 'placard', 900, 30, 2.49, { staple: true, kw: 'zaatar zatar' }],
  ['ail_poudre', 'Ail en poudre', '🧄', 'epice', 'g', 0, 0, 'placard', 900, 40, 1.29, { staple: true, kw: 'ail poudre semoule' }],
  ['oignon_poudre', 'Oignon en poudre', '🧅', 'epice', 'g', 0, 0, 'placard', 900, 40, 1.29, { staple: true, kw: 'oignon poudre' }],
  ['sel_ail', "Sel à l'ail", '🧂', 'epice', 'g', 0, 0, 'placard', 900, 100, 1.29, { staple: true, kw: 'sel ail' }],
  ['fleur_sel', 'Fleur de sel', '🧂', 'epice', 'g', 0, 0, 'placard', 1500, 125, 2.49, { staple: true, kw: 'fleur de sel' }],
  ['gingembre_frais', 'Gingembre frais', '🫚', 'epice', 'g', 0, 0, 'frigo', 21, 100, 0.99, { staple: true, kw: 'gingembre frais racine' }],

  ['jus_multifruit', 'Jus multifruit', '🧃', 'boisson', 'ml', 50, 0.4, 'placard', 120, 1000, 1.49, { kw: 'jus multifruit multivitamine ace' }],
  ['smoothie', 'Smoothie', '🥤', 'boisson', 'ml', 60, 0.6, 'frigo', 14, 750, 2.49, { kw: 'smoothie' }],
  ['soda', 'Soda', '🥤', 'boisson', 'ml', 42, 0, 'placard', 365, 1500, 1.49, { kw: 'soda cola coca limonade orangina' }],
  ['sirop', 'Sirop à diluer', '🧃', 'boisson', 'ml', 270, 0, 'placard', 365, 750, 1.99, { kw: 'sirop grenadine menthe' }],
  ['cafe', 'Café', '☕', 'boisson', 'g', 0, 0, 'placard', 365, 250, 2.99, { staple: true, kw: 'cafe moulu capsules' }],
  ['the', 'Thé', '🍵', 'boisson', 'g', 0, 0, 'placard', 700, 50, 1.99, { staple: true, kw: 'the infusion tisane' }],
  ['boisson_proteinee', 'Boisson protéinée', '💪', 'boisson', 'ml', 70, 8, 'placard', 180, 330, 2.49, { kw: 'boisson proteinee milkshake' }],
];

const norm = (x) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const INGREDIENTS = ROWS.map(([id, name, emoji, cat, unit, kcal, prot, storage, shelf, packSize, packPrice, o = {}]) => ({
  id, name, emoji, cat, unit, kcal, prot, storage, shelf,
  pack: { size: packSize, price: packPrice },
  portion: o.portion, unitLabel: o.unitLabel, staple: !!o.staple, fresh: !!o.fresh, sizes: o.sizes || null,
  aisle: o.aisle || CATEGORIES[cat].aisle,
  nat: o.nat ? o.nat.split('|') : [],
  keys: norm(`${name} ${o.kw || ''}`),
}));

export const ING = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));

export const SWAP_GROUPS = {
  feculent: ['pates', 'pates_completes', 'riz', 'riz_basmati', 'riz_complet', 'semoule', 'boulgour', 'quinoa', 'gnocchis', 'pdt', 'patate_douce'],
  proteine: ['poulet', 'dinde', 'steak5', 'steak15', 'emince_boeuf', 'oeufs', 'jambon', 'lardons', 'saumon', 'poisson_blanc', 'tofu', 'steak_vege'],
};

export function fmtQty(qty, unit, ingId) {
  const q = Math.round(qty * 10) / 10;
  if (unit === 'g') return q >= 1000 ? `${(q / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} kg` : `${Math.round(q)} g`;
  if (unit === 'ml') return q >= 1000 ? `${(q / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} L` : `${Math.round(q)} ml`;
  const label = ING[ingId]?.unitLabel;
  const n = q.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
  if (!label) return `× ${n}`;
  return `${n} ${label}${q > 1 && !label.endsWith('s') ? 's' : ''}`;
}

// Reconnaissance d'un aliment dans un libellé (ticket, scan, saisie).
// Priorité au nom complet le plus précis : « pâte à tartiner » ne devient jamais « pâtes »,
// « lait HDF demi-écrémé » donne « Lait demi-écrémé » et pas « Lait écrémé ».
const MSTOP = new Set(['ou', 'de', 'du', 'des', 'la', 'le', 'les', 'a', 'au', 'aux', 'en', 'et', 'pour', 'avec', 'sans', 'un', 'une', 'd', 'l']);
const ABBR = { ecr: 'ecreme', 'ecrem': 'ecreme', dem: 'demi', '1/2': 'demi', 'pdt': 'pomme de terre', choc: 'chocolat', fr: 'frais', fraich: 'fraiche', bl: 'blanc', vol: 'volaille', hach: 'hache', past: 'pasteurise', uht: 'uht' };
const sing = (w) => (w.length > 3 ? w.replace(/(s|x)$/, '') : w);
export function matchTokens(text) {
  const t = norm(String(text || '')).replace(/œ/g, 'oe').replace(/æ/g, 'ae').replace(/1\/2/g, ' demi ').replace(/['’\-_/.,()+]/g, ' ');
  return t.split(/\s+/).filter(Boolean).map((w) => ABBR[w] || w).join(' ').split(' ')
    .filter((w) => w && !MSTOP.has(w) && !/^\d+([.,]\d+)?(g|kg|cl|ml|l|x)?$/.test(w)).map(sing);
}
// Mots qui changent la nature du produit : « pâte brisée » n'est pas « pâtes », « lait de coco » n'est pas « lait »
const NOT_IF = {
  pates: ['tartiner', 'brisee', 'sablee', 'feuilletee', 'pizza', 'curry', 'fruit', 'amande', 'lasagne'],
  lait: ['coco', 'soja', 'amande', 'avoine', 'riz', 'corp', 'toilette', 'chocolate', 'chocolat', 'fromage', 'yaourt', 'dessert', 'creme', 'skyr', 'petit', 'suisse'],
  lait_entier: ['fromage', 'yaourt', 'dessert', 'creme', 'skyr', 'riz', 'chocolat', 'coco', 'petit', 'suisse'],
  lait_ecreme: ['fromage', 'yaourt', 'dessert', 'creme', 'skyr', 'riz', 'chocolat', 'coco', 'petit', 'suisse'],
  pomme: ['terre', 'jus', 'compote'], tomate: ['sauce', 'pulpe', 'concentre', 'pelee', 'passata', 'cerise'],
  beurre: ['cacahuete', 'demi', 'sale'], creme: ['dessert', 'glacee'], sucre: ['vanille'], chocolat: ['poudre', 'blanc', 'noir', 'pepite'],
  oignon: ['poudre'], ail: ['poudre'], riz: ['lait', 'galette'], poulet: ['roti', 'cuit', 'nugget', 'cordon'],
};
const M_INDEX = INGREDIENTS.map((ing) => {
  const name = matchTokens(ing.name).filter((w) => !/^\d/.test(w) && w !== '%');
  const kw = [...new Set(matchTokens(ing.keys))].filter((w) => w.length >= 3 && !name.includes(w) && !/\d/.test(w));
  return { ing, name, kw, pcts: ing.keys.match(/\d+%/g) || [], not: NOT_IF[ing.id] || [] };
});
export function matchIngredientText(text, { packaged } = {}) {
  const raw = norm(String(text || ''));
  const toks = matchTokens(text);
  if (!toks.length) return null;
  const set = new Set(toks);
  const pct = raw.match(/(\d+)\s?%/)?.[1];
  let best = null;
  for (const { ing, name, kw, pcts, not } of M_INDEX) {
    if (not.some((w) => set.has(w))) continue;
    const hits = name.filter((w) => set.has(w)).length;
    const full = name.length > 0 && hits === name.length;
    const near = !full && hits >= 2 && hits >= name.length - 1;
    let score = full ? 100 + 12 * name.length : near ? 90 + 12 * hits : hits * 8;
    if (!full && hits && name[0] && !set.has(name[0])) score -= 4;
    const kwHits = kw.filter((w) => set.has(w));
    if (!full && !near && toks.length - hits - kwHits.length >= 2) continue;
    score += Math.min(12, kwHits.reduce((n, w) => n + (w.length > 5 ? 6 : 3), 0)) + 5 * (hits + kwHits.length);
    if (pct && pcts.length) score += pcts.includes(`${pct}%`) ? 15 : -15;
    if (score > 0 && packaged) score += (ing.unit === 'pc' ? -0.5 : 0.5) - (ing.fresh ? 1 : 0);
    if (score >= 6 && (!best || score > best.score)) best = { id: ing.id, score };
  }
  return best?.id || null;
}
export function guessIngredient(text, opts) { return matchIngredientText(text, opts); }
