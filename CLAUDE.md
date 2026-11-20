# Cocotte (ex FitMus) : contexte projet

PWA mobile-first : planning repas, liste de courses multi-magasins, stock frigo / placards, recettes. Partageable : un onboarding adapte l'app (objectif prendre / garder / perdre, profil, magasins, matériel, goûts).
Utilisateur principal : UX/UI designer exigeant, objectif prise de poids, gestion de TCA. Il veut des propositions abouties, pas des esquisses.

## Règles produit

- **Bienveillance (TCA)** : jamais de rouge, jamais d'alerte culpabilisante, jamais "excès", "trop", "raté". Les kcal sont toujours affichées (choix de l'utilisateur) via une jauge neutre.
- "Je passe" affiche juste "Repas passé" (pas de badge "Écouté ma satiété", retiré à la demande).
- **Zéro friction / automatique** : ce qui peut être déduit l'est (ticket => stock rangé + prix réels + liste cochée, "Mangé" => stock déduit FIFO, "Tout mangé comme prévu" pour la veille). "Annuler" dans les toasts plutôt que des confirmations.
- **Préférences par paliers** : `prefs.ing[id]` et `prefs.recipe[id]` = `refuge | ok | doux | nogo`. No-go masqué partout. Les épices sont des ingrédients `cat: 'epice'`.
- Pas de sous-titre au-dessus des titres de pages.
- Rédaction : français, **jamais de tiret quadratin (—) ni demi-cadratin (–)**. Utiliser ":" "," ou "·".

## Identité (DA Cocotte)

- Référence : `brand/cocotte-da.html`. Symbole = cocotte vue de dessus (beurre sur laurier).
- Palette : laurier #1F4D3A, beurre #F7C948 (`.btn.primary`), faïence #EEF2EC (fond), abricot, lavande, fonte #17201C. Zéro rouge.
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

### Invariants

- Un produit est exprimé dans l'unité de son ingrédient (`size` en g, ml ou pièces). Produit perso sans ingrédient : non déduit par les recettes.
- kcal, protéines, coûts et objectif kcal sont **calculés**, jamais saisis en dur. L'objectif kcal suit poids actuel / visé / activité / rythme.
- Pas d'accès aux comptes magasins : les prix réels viennent des tickets importés.
