# Cocotte (ex FitMus) : contexte projet

PWA mobile-first : planning repas, liste de courses multi-magasins, stock frigo / placards, recettes. Partageable : un onboarding adapte l'app (objectif prendre / garder / perdre, profil, magasins, matériel, goûts).
Utilisateur principal : UX/UI designer exigeant, objectif prise de poids, gestion de TCA. Il veut des propositions abouties, pas des esquisses.

## Règles produit

- **Bienveillance (TCA)** : jamais de rouge, jamais d'alerte culpabilisante, jamais "excès", "trop", "raté". Les kcal sont affichées par défaut via une jauge neutre ; `profile.showNumbers = false` masque tous les chiffres (`showNumbers(s)` dans engine).
- "Je passe" affiche juste "Repas passé" (pas de badge "Écouté ma satiété", retiré à la demande).
- **Zéro friction / automatique** : ce qui peut être déduit l'est (ticket => stock rangé + prix réels + liste cochée, "Mangé" => stock déduit FIFO, "Tout mangé comme prévu" pour la veille). "Annuler" dans les toasts plutôt que des confirmations.
- **Préférences par paliers** : `prefs.ing[id]` et `prefs.recipe[id]` = `refuge | ok | doux | nogo`. No-go masqué partout. Les épices sont des ingrédients `cat: 'epice'`.
- Pas de sous-titre au-dessus des titres de pages.
- Rédaction : français, **jamais de tiret quadratin (—) ni demi-cadratin (–)**. Utiliser ":" "," ou "·".

## Identité (DA Cocotte)

- Référence : `brand/cocotte-da.html`. Symbole = cocotte vue de dessus (beurre sur laurier).
- Palette réduite à 5 familles (nuances autorisées) : laurier #1F4D3A (structure, positif, refuge), beurre #F7C948 (`.btn.primary`, défi doux), faïence #EEF2EC (fond, neutre, no-go), abricot #F4A06B (DLC proche, rappels doux), fonte #17201C (texte). Plus de lavande, ciel ni menthe (les variables CSS `--lav`, `--sky`, `--mint`, `--mute` pointent vers ces familles). Zéro rouge.
- Titres `.h1`/`.h2` en Bricolage Grotesque, interface en Plus Jakarta Sans (polices auto-hébergées dans `fonts/`).
- Garder les emojis et icônes actuels, ne pas les remplacer par des pictos dessinés.

## Stack (sans build, sans CDN)

- Node absent : modules ES natifs. Preact, hooks et htm **vendorisés** dans `vendor/` (import relatif, pas d'import map). ZXing (`vendor/zxing.min.js`) chargé à la demande si `BarcodeDetector` est absent.
- CSP stricte dans `index.html` (`script-src 'self'`, `style-src 'self'`, connect uniquement Open Food Facts). Aucun script inline : `js/boot.js` gère erreurs et service worker.
- Lancer : `python -m http.server 5173` (config `.claude/launch.json`, nom `fitmus`). Le navigateur met les modules en cache : recharger avec `?v=N` après une modif.
- Persistance : `localStorage` clé `fitmus:v1` (gardée pour ne pas perdre les données). `SEED_VERSION = 2` ; toute nouvelle forme d'état passe par `migrate()` dans `js/data/seed.js`, et `sanitize()` dans `store.js` valide au chargement.
- Service worker `sw.js` : stale-while-revalidate sur les fichiers locaux. Ajouter tout nouveau fichier à `SHELL` et bumper `VERSION`.
- Publication : GitHub Pages, dépôt public `KevinRichez/cocotte`, branche `main`. `git push` republie.

## Architecture

```
js/
  main.js, boot.js          App, nav, onboarding si !profile.onboarded
  store.js                  état, update(mutator) sur brouillon cloné, restore(), sanitize, sauvegarde différée
  actions.js                TOUTES les mutations (planning, liste, stock, ticket, produits/recettes perso, paliers)
  lib/engine.js             logique pure : targets() (Mifflin-St Jeor + objectif), suggestions selon objectif, recherche produits, coûts, stock
  lib/off.js                Open Food Facts : code-barres et recherche (limite 1 recherche / 6 s, cache)
  lib/scanner.js            caméra : BarcodeDetector ou ZXing, décodage photo
  lib/ticket.js             parseur de ticket (détecte le magasin, mappe via guessIngredient)
  data/ingredients.js       ~160 aliments (kcal/prot, unité, conservation, pack typique, marques nationales, mots-clés)
  data/products.js          9 magasins x paliers (premier prix, marque magasin, bio, grande marque) générés à la volée (~4 000 produits), prix indicatifs
  data/recipes.js           ~80 recettes, quantités pour 1 portion
  data/seed.js              état vide, démo, migration v1 -> v2
  components/               ui (KcalGauge, TierPicker, Sheet...), ProductSearch (liste déroulante, en ligne, scan, création), RecipeSheet, RecipeEditor
  views/                    Onboarding, WeekView, ShoppingView, RecipesView, ProfileView
```

### Détails métier

- Objectif kcal : TDEE ± (150 + 40 kcal par kg d'écart au poids visé, max 700), x1,3 en rythme "Plus rapide".
- Créneau planifié : `{ recipeId, swaps, status, servings? }`. Les suggestions visent le reste de kcal du jour (`slotBudget`) et proposent une portion x1 à x2 (`servingsFor`).
- Recettes intégrées modifiables : la version modifiée est stockée dans `customRecipes` avec le même id et `override: true` ("Rétablir la recette d’origine" la supprime). Champs `prep` et `cook` optionnels.
- Formats : `sizes` par ingrédient (x1, x2, x4, à l'unité...). L'id du format par défaut reste `magasin.ingredient.palier`, les autres ajoutent `.sN`. La liste générée choisit le plus petit format suffisant.
- Produits scannés : photo, grammage (`unit` g ou ml) et nutrition Open Food Facts. `ingNutri()` utilise ces vraies valeurs dans les calculs de kcal quand l'aliment est en stock.
- Les logos officiels des marques ne sont pas utilisés (droits) : pastilles colorées par type de marque (`BrandPill`).
- Ticket : noms nettoyés (`prettyName` : sans grammage, abréviations développées, accents), grammage à part. Boissons, snacks (chips, sodas, eau, alcool) et non-alimentaire sont « ignorés » : comptés dans le budget, pas rangés, réactivables dans la liste repliée en bas de l'aperçu. Mémoire par `ticketKey` dans `customProducts`.
- Scan d'un produit (stock ou aperçu de ticket) : `enrichFromScan` met à jour la fiche (photo, nutrition, code-barres, grammage si même unité que l'aliment). Produit catalogue : `productOverrides[productId]` ; produit perso : modifié directement. Titres via `productTitle()`, grammage via `productSize()`.

- Portions allégées : réglage personnel `profile.light` (~75 %, `LIGHT_RECIPES` dans recipes.js). `getRecipe`/`allRecipes` renvoient la version allégée si actif ; `cookLines` ajoute les parts du foyer en quantités normales. Les profils existants avant v30 avec `flags.lightV1` l'ont activé.
- Relecture nutrition : `REVIEW_V2` (quantités normales revues selon PNNS / ANSES, légumes ajoutés en fin de liste pour tous). Les portions allégées gardent les quantités d'avant. `freezeReviewV2` met `over[idx] = 0` sur les légumes ajoutés des repas passés ; `over === 0` retire la ligne.
- Restes : la fiche du repas cuisiné affiche « À cuisiner » = sa portion + les restes prévus (`leftoverSlotsFor` dans engine, aussi utilisé par `eatInDraft`). La fiche d'un reste indique qu'il n'y a rien à préparer.
- `planRecipe` : le même plat qu'au repas principal d'avant devient automatiquement un reste (`planLeftover`).
- Foyer : `profile.household = { adults, kids }` (enfant = 0,6 part). `cookLines()` = ta portion + celles du foyer, utilisé pour le stock déduit et les courses ; la jauge reste personnelle.
- Régimes et allergies : `profile.diets` (clés de `js/data/diets.js`). `ingTier()` renvoie `nogo` pour un aliment exclu ; pour un régime, l'aliment vedette (viande, poisson, 1er ingrédient, cité dans le nom) n'est jamais remplacé : la recette est masquée.
- Priorités : `profile.priorities` (equilibre, budget, antigaspi, rapide, proteine) pondèrent `suggest()`.
- Rappels : `profile.reminders`, `js/lib/reminders.js` (message à l'ouverture) et `periodicsync` dans `sw.js` sur une copie dans le cache `cocotte-rappels` (garder les deux logiques alignées).
- Produits à acheter : « Je l'ai » (choix du vrai produit, rangé en stock) et « Pas besoin » écrivent `needsSkip[ing] = dernier jour de la semaine`.

### Invariants

- Un produit est exprimé dans l'unité de son ingrédient (`size` en g, ml ou pièces). Produit perso sans ingrédient : non déduit par les recettes.
- kcal, protéines, coûts et objectif kcal sont **calculés**, jamais saisis en dur. L'objectif kcal suit poids actuel / visé / activité / rythme.
- Pas d'accès aux comptes magasins : les prix réels viennent des tickets importés.
