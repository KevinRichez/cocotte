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
  ['poulet', 'Blanc de poulet', '🍗', 'viande', 'g', 110, 23, 'frigo', 4, 500, 6.29, { portion: 150, kw: 'filet filets aiguillettes escalope poulet', nat: 'Le Gaulois' }],
  ['cuisse_poulet', 'Cuisses de poulet', '🍗', 'viande', 'g', 190, 18, 'frigo', 4, 1000, 4.99, { portion: 250, kw: 'cuisse cuisses pilon pilons', nat: 'Le Gaulois' }],
  ['dinde', 'Escalope de dinde', '🦃', 'viande', 'g', 105, 23, 'frigo', 4, 400, 4.59, { portion: 150, kw: 'escalope escalopes dinde', nat: 'Le Gaulois' }],
  ['steak5', 'Steak haché 5 %', '🥩', 'viande', 'pc', 125, 21, 'frigo', 4, 4, 4.49, { portion: 2, unitLabel: 'steak', kw: 'steak steaks hache haches 5%', nat: 'Charal' }],
  ['steak15', 'Steak haché 15 %', '🥩', 'viande', 'pc', 215, 17, 'frigo', 4, 4, 3.79, { portion: 2, unitLabel: 'steak', kw: 'steak steaks hache haches 15%', nat: 'Charal' }],
  ['steak20', 'Steak haché 20 %', '🥩', 'viande', 'pc', 250, 17, 'frigo', 4, 4, 3.49, { portion: 2, unitLabel: 'steak', kw: 'steak steaks hache haches 20%', nat: 'Charal' }],
  ['emince_boeuf', 'Émincé de bœuf', '🥩', 'viande', 'g', 140, 22, 'frigo', 3, 400, 7.9, { portion: 150, kw: 'emince boeuf bœuf lanieres', nat: 'Charal' }],
  ['cotes_porc', 'Côtes de porc', '🥩', 'viande', 'pc', 250, 26, 'frigo', 4, 2, 3.99, { portion: 1, unitLabel: 'côte', kw: 'cote cotes porc echine' }],
  ['saucisses', 'Saucisses de Toulouse', '🌭', 'viande', 'pc', 330, 16, 'frigo', 7, 6, 4.29, { portion: 2, unitLabel: 'saucisse', kw: 'saucisse saucisses toulouse' }],
  ['merguez', 'Merguez', '🌭', 'viande', 'pc', 190, 9, 'frigo', 7, 6, 3.49, { portion: 3, kw: 'merguez' }],
  ['chipolatas', 'Chipolatas', '🌭', 'viande', 'pc', 150, 7, 'frigo', 7, 6, 3.29, { portion: 3, unitLabel: 'chipolata', kw: 'chipolata chipolatas' }],
  ['saucisses_strasbourg', 'Saucisses de Strasbourg', '🌭', 'viande', 'pc', 120, 5.5, 'frigo', 21, 10, 2.39, { portion: 2, unitLabel: 'saucisse', kw: 'strasbourg knack knacks', nat: 'Herta' }],
  ['jambon', 'Jambon blanc', '🥓', 'viande', 'pc', 45, 8, 'frigo', 7, 4, 1.95, { portion: 2, unitLabel: 'tranche', kw: 'jambon blanc tranches', nat: 'Herta|Fleury Michon' }],
  ['jambon_cru', 'Jambon cru', '🥓', 'viande', 'pc', 40, 5, 'frigo', 14, 6, 2.49, { portion: 3, unitLabel: 'tranche', kw: 'jambon cru serrano bayonne' }],
  ['blanc_dinde', 'Blanc de dinde en tranches', '🦃', 'viande', 'pc', 30, 6, 'frigo', 7, 6, 1.89, { portion: 3, unitLabel: 'tranche', kw: 'blanc dinde tranches', nat: 'Herta' }],
  ['bacon', 'Bacon', '🥓', 'viande', 'pc', 30, 3.5, 'frigo', 21, 10, 1.99, { portion: 3, unitLabel: 'tranche', kw: 'bacon' }],
  ['lardons', 'Lardons fumés', '🥓', 'viande', 'g', 270, 15, 'frigo', 14, 200, 1.89, { portion: 100, kw: 'lardons allumettes fumes', nat: 'Herta' }],
  ['cordon_bleu', 'Cordon bleu', '🍗', 'viande', 'pc', 230, 13, 'frigo', 10, 4, 3.29, { portion: 1, unitLabel: 'cordon bleu', kw: 'cordon bleu cordons', nat: 'Le Gaulois' }],
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

  ['oeufs', 'Œufs', '🥚', 'laitier', 'pc', 75, 6.5, 'frigo', 24, 12, 3.49, { portion: 3, unitLabel: 'œuf', kw: 'oeuf oeufs plein air', nat: 'Matines' }],
  ['lait', 'Lait demi-écrémé', '🥛', 'laitier', 'ml', 46, 3.2, 'placard', 90, 1000, 0.99, { kw: 'lait demi ecreme uht', nat: 'Lactel' }],
  ['lait_entier', 'Lait entier', '🥛', 'laitier', 'ml', 64, 3.2, 'placard', 90, 1000, 1.15, { kw: 'lait entier', nat: 'Lactel' }],
  ['lait_ecreme', 'Lait écrémé', '🥛', 'laitier', 'ml', 34, 3.3, 'placard', 90, 1000, 0.95, { kw: 'lait ecreme' }],
  ['lait_avoine', "Boisson à l'avoine", '🌾', 'laitier', 'ml', 45, 1, 'placard', 180, 1000, 1.59, { kw: 'boisson avoine vegetale', nat: 'Bjorg' }],
  ['fromage_blanc', 'Fromage blanc 3 %', '🥛', 'laitier', 'g', 75, 7.5, 'frigo', 18, 1000, 1.95, { kw: 'fromage blanc fbl', nat: 'Danone' }],
  ['fromage_blanc0', 'Fromage blanc 0 %', '🥛', 'laitier', 'g', 46, 7.5, 'frigo', 18, 1000, 1.75, { kw: 'fromage blanc 0%' }],
  ['skyr', 'Skyr nature', '🥛', 'laitier', 'g', 63, 11, 'frigo', 21, 500, 2.09, { kw: 'skyr', nat: 'Siggi’s' }],
  ['yaourt', 'Yaourt nature', '🥛', 'laitier', 'pc', 75, 4.5, 'frigo', 25, 12, 2.19, { unitLabel: 'pot', kw: 'yaourt yaourts nature', nat: 'Danone' }],
  ['yaourt_grec', 'Yaourt à la grecque', '🥣', 'laitier', 'pc', 150, 4.5, 'frigo', 20, 4, 1.65, { unitLabel: 'pot', kw: 'yaourt grecque grec' }],
  ['creme_dessert', 'Crème dessert chocolat', '🍮', 'laitier', 'pc', 140, 4, 'frigo', 25, 4, 1.49, { unitLabel: 'pot', kw: 'creme dessert chocolat', nat: 'Danette' }],
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
  ['cheddar', 'Cheddar en tranches', '🧀', 'fromage', 'pc', 70, 4, 'frigo', 30, 10, 1.99, { unitLabel: 'tranche', kw: 'cheddar tranches burger' }],

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
  ['pain_burger', 'Pains burger', '🍔', 'feculent', 'pc', 150, 5, 'placard', 10, 6, 1.49, { portion: 1, unitLabel: 'pain', aisle: 'Boulangerie', kw: 'pain burger buns hamburger', nat: 'Harrys' }],
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

  ['tomate', 'Tomates', '🍅', 'legume', 'pc', 20, 1, 'placard', 6, 7, 2.49, { unitLabel: 'tomate', fresh: true, kw: 'tomate tomates grappe' }],
  ['tomates_cerises', 'Tomates cerises', '🍅', 'legume', 'g', 20, 1, 'frigo', 7, 250, 1.79, { fresh: true, kw: 'tomates cerises' }],
  ['tomates_pelees', 'Tomates pelées', '🥫', 'legume', 'g', 25, 1, 'placard', 700, 400, 0.69, { aisle: 'Conserves', kw: 'tomates pelees concassees' }],
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
];

const norm = (x) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const INGREDIENTS = ROWS.map(([id, name, emoji, cat, unit, kcal, prot, storage, shelf, packSize, packPrice, o = {}]) => ({
  id, name, emoji, cat, unit, kcal, prot, storage, shelf,
  pack: { size: packSize, price: packPrice },
  portion: o.portion, unitLabel: o.unitLabel, staple: !!o.staple, fresh: !!o.fresh,
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

export function guessIngredient(text) {
  const t = norm(text || '');
  if (!t.trim()) return null;
  let best = null;
  for (const ing of INGREDIENTS) {
    let score = 0;
    for (const w of new Set(ing.keys.split(/[\s-]+/))) if (w.length > 2 && t.includes(w)) score += w.length > 5 ? 2 : 1;
    const pct = t.match(/(\d+)\s?%/);
    if (pct && ing.keys.includes(`${pct[1]}%`)) score += 3;
    if (score && (!best || score > best.score)) best = { ing, score };
  }
  return best && best.score >= 2 ? best.ing.id : null;
}
