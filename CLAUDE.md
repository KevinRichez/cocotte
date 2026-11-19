# FitMus : contexte projet

PWA mobile-first de gestion de courses (E.Leclerc), stock (placards / frigo) et recettes prise de masse, petit budget.
Utilisateur : UX/UI designer exigeant, objectif prise de masse, gestion de TCA.

## Règles produit non négociables

- **Approche bienveillante (TCA)** : jamais de rouge, jamais d'alerte culpabilisante, jamais de mot comme "excès", "trop", "objectif raté".
  Les calories sont des "repères souples", masquables (`profile.showKcal`). Sauter un repas = badge lavande neutre "Écouté ma satiété".
- **Zéro friction** : chips cliquables, swipes, actions en 1 tap, "Annuler" dans les toasts plutôt que des confirmations.
- **No-Go** (`prefs.nogo`) : totalement masqués des suggestions, recettes et swaps.
- **Conservation** : suivi par DLC par produit (`shelf` dans ingredients/catalog), pas de limite fixe. Alertes douces uniquement à J-2 ou moins.
- Matériel dispo : plaques, poêle, casseroles, four, micro-ondes, grille-pain. **Pas de congélateur, pas de blender.**
- Rédaction : français, **ne jamais utiliser de tiret quadratin (—) ni demi-cadratin (–)**. Utiliser ":" "," ou "·".

## Stack (sans build)

- Node n'est pas installé sur la machine : app en **modules ES natifs**, Preact 10 + htm via import map (unpkg, versions figées dans `index.html`).
- CSS maison avec tokens dans `css/app.css` (pas de Tailwind). Rayons : `--r` 16px (équivalent rounded-2xl).
- Lancer : `python -m http.server 5173` puis http://localhost:5173 (config `.claude/launch.json`, nom `fitmus`).
- Persistance : `localStorage` clé `fitmus:v1`. Changer la forme de l'état => incrémenter `SEED_VERSION` dans `js/data/seed.js`.
- Service worker `sw.js` : réseau d'abord pour les fichiers locaux, cache d'abord pour le CDN. Ajouter tout nouveau fichier JS à `SHELL` et bumper `VERSION`.

## Architecture

```
js/
  main.js               App + bottom nav (4 onglets) + toasts
  store.js              état global, update(mutator) sur brouillon cloné, restore() pour "Annuler"
  actions.js            TOUTES les mutations métier (planning, liste, stock, ticket, prefs)
  lib/engine.js         logique pure : nutrition, coûts, stock FIFO, suggestions, compileNeeds
  lib/ticket.js         parseur de ticket E.Leclerc texte -> produits catalogue
  lib/catalogProvider.js LocalCatalogProvider + LeclercApiProvider (stub) : point d'entrée pour une API
  lib/dates.js          dates locales "YYYY-MM-DD" (jamais d'UTC), dlcInfo()
  data/ingredients.js   ingrédients génériques (unit g/ml/pc, kcal/prot, storage, shelf, portion)
  data/catalog.js       produits Leclerc (Marque Repère, Eco+, Bio Village, Rayon frais), rayons ordonnés
  data/recipes.js       recettes (quantités pour 1 portion, swap: 'feculent'|'proteine')
  data/seed.js          démo relative à la date du jour (planning, stock, 2 courses passées, prefs)
  components/ui.js      Sheet, Swipeable, Chip, Seg, Stepper, Ring, Toggle, Toasts...
  components/RecipeSheet.js fiche recette partagée (swaps, stock, ajout au planning)
  views/                WeekView, ShoppingView, RecipesView, ProfileView
```

### Modèle de données (état)

- `plan[date][meal]` : `{ recipeId, swaps: {idx: ingId}, status: 'planned'|'eaten'|'outside'|'skipped', outside?: {tags, note} }`
- `deferred[]` : recettes mises de côté quand un repas est pris dehors / sauté, re-proposées ("À recaser").
- `inventory[]` : lots `{ id, ing, name, qty, dlc, location: 'frigo'|'placard', productId }`. Quantités dans l'unité de l'ingrédient.
- `shoppingList[]` : `{ id, productId | name, qty (nb de paquets), checked, source: 'plan'|'manual' }`
- `history[]` : courses archivées `{ date, total, count, items[], source: 'app'|'ticket' }`
- `priceOverrides[productId]` : prix réels issus des tickets. `brandPrefs[ing]` : produit préféré par ingrédient.

### Invariants

- Un produit catalogue est exprimé dans l'unité de son ingrédient (`size` en g, ml ou pièces).
- Les kcal, protéines et coûts des recettes sont **calculés**, jamais saisis en dur.
- Marquer "Mangé" décrémente le stock (FIFO par DLC). "J'ai fini mes courses" archive, ajoute au stock avec DLC estimée, vide la liste.

## Pistes suivantes

- OCR du scan de ticket (le bouton Scanner est prêt, il faut brancher un service).
- Implémenter `LeclercApiProvider.refreshPrices()` vers une vraie source de prix.
- Migration Vite + Tailwind possible sans réécrire les vues (htm -> JSX).
