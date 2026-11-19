import { html, useState, useMemo } from '../lib/h.js';
import { useStore } from '../store.js';
import { Icon, Chip, Badge, Empty } from '../components/ui.js';
import { RecipeSheet } from '../components/RecipeSheet.js';
import { RECIPES, EQUIPMENT, MEALS, MEAL_KEYS } from '../data/recipes.js';
import { ING } from '../data/ingredients.js';
import { recipeStats, stockMatch, isBlocked, budgetLevel, budgetLabel, kcalFmt, euro } from '../lib/engine.js';

const norm = (x) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function RecipesView() {
  const s = useStore();
  const [q, setQ] = useState('');
  const [quick, setQuick] = useState(false);
  const [refuge, setRefuge] = useState(false);
  const [stockOnly, setStockOnly] = useState(false);
  const [budget, setBudget] = useState(null);
  const [equip, setEquip] = useState([]);
  const [meal, setMeal] = useState(null);
  const [open, setOpen] = useState(null);

  const enriched = useMemo(() => RECIPES.map((r) => {
    const st = recipeStats(s, r);
    const match = stockMatch(s, st.lines);
    const refuges = st.lines.filter((l) => s.prefs.refuges.includes(l.ing)).length;
    const defi = st.lines.find((l) => s.prefs.defis.includes(l.ing));
    return { r, ...st, match, refuges, defi, blocked: isBlocked(r, s.prefs), budget: budgetLevel(st.cost) };
  }), [s.inventory, s.prefs, s.priceOverrides]);

  const hidden = enriched.filter((x) => x.blocked).length;
  const list = enriched.filter((x) => !x.blocked
    && (!q || norm(x.r.name).includes(norm(q)) || x.lines.some((l) => norm(ING[l.ing].name).includes(norm(q))))
    && (!quick || x.r.time <= 10)
    && (!refuge || x.refuges >= 1)
    && (!stockOnly || x.match.ratio >= 0.75)
    && (!budget || x.budget <= budget)
    && (!equip.length || x.r.equipment.every((e) => equip.includes(e) || e === 'aucun'))
    && (!meal || x.r.meals.includes(meal)))
    .sort((a, b) => (stockOnly ? b.match.ratio - a.match.ratio : 0) || b.refuges - a.refuges || a.r.time - b.r.time);

  const toggleEquip = (e) => setEquip(equip.includes(e) ? equip.filter((x) => x !== e) : [...equip, e]);
  const activeCount = [quick, refuge, stockOnly, budget, equip.length, meal].filter(Boolean).length;
  const resetAll = () => { setQuick(false); setRefuge(false); setStockOnly(false); setBudget(null); setEquip([]); setMeal(null); setQ(''); };

  return html`<div class="screen">
    <header class="topbar">
      <div><div class="eyebrow">${list.length} idées pour toi</div><h1 class="h1">Recettes</h1></div>
      ${activeCount > 0 && html`<button class="btn ghost sm" onClick=${resetAll}>Effacer (${activeCount})</button>`}
    </header>

    <div class="search"><${Icon} name="search" size=${18} />
      <input class="field" placeholder="Recette ou ingrédient (ex : poulet)" value=${q} onInput=${(e) => setQ(e.currentTarget.value)} /></div>

    <div class="chips scroll" style="margin-top:12px">
      <${Chip} sm active=${quick} onClick=${() => setQuick(!quick)}>${'⚡ < 10 min'}</${Chip}>
      <${Chip} sm active=${stockOnly} onClick=${() => setStockOnly(!stockOnly)}>🧊 Avec mon stock</${Chip}>
      <${Chip} sm active=${refuge} onClick=${() => setRefuge(!refuge)}>💙 Refuges</${Chip}>
      ${[1, 2, 3].map((b) => html`<${Chip} sm active=${budget === b} onClick=${() => setBudget(budget === b ? null : b)}>${budgetLabel(b)}</${Chip}>`)}
    </div>
    <div class="chips scroll" style="margin-top:8px">
      ${MEAL_KEYS.map((m) => html`<${Chip} sm active=${meal === m} onClick=${() => setMeal(meal === m ? null : m)}>${MEALS[m].emoji} ${MEALS[m].label}</${Chip}>`)}
    </div>
    <div class="chips scroll" style="margin-top:8px">
      ${Object.entries(EQUIPMENT).filter(([k]) => k !== 'aucun').map(([k, e]) => html`<${Chip} sm tone="sage" active=${equip.includes(k)} onClick=${() => toggleEquip(k)}>${e.emoji} ${e.label}</${Chip}>`)}
    </div>
    ${equip.length > 0 && html`<p class="subtle" style="margin:8px 2px 0">Recettes réalisables uniquement avec le matériel sélectionné.</p>`}

    ${list.length === 0 && html`<${Empty} emoji="🔎" title="Aucune recette avec ces filtres">Essaie d’en retirer un ou deux.</${Empty}>`}

    <div class="recipe-grid" style="margin-top:16px">
      ${list.map((x) => html`<button class="rcard" key=${x.r.id} onClick=${() => setOpen(x.r.id)}>
        <div class="rthumb" style=${{ background: x.r.color }}>
          ${x.match.ratio === 1 ? html`<${Badge} tone="sage">✓ En stock</${Badge}>`
            : x.defi ? html`<${Badge} tone="lav">🌱 Défi</${Badge}>`
            : x.refuges >= 2 ? html`<${Badge} tone="sky">💙 Refuge</${Badge}>` : null}
          ${x.r.emoji}
        </div>
        <div class="rbody">
          <div class="rname">${x.r.name}</div>
          <div class="meal-meta" style="margin-top:auto;padding-top:4px">
            <span><${Icon} name="clock" size=${12} />${x.r.time}′</span>
            ${s.profile.showKcal && html`<span>${kcalFmt(x.kcal)} kcal</span>`}
            <span>${budgetLabel(x.budget)}</span>
          </div>
          <div class="bar" style="height:4px;margin-top:6px" title="Ingrédients en stock"><i style=${{ width: `${x.match.ratio * 100}%` }}></i></div>
        </div>
      </button>`)}
    </div>
    ${hidden > 0 && html`<p class="subtle center" style="margin-top:16px">🙈 ${hidden} recette${hidden > 1 ? 's' : ''} masquée${hidden > 1 ? 's' : ''} (tes No-Go)</p>`}

    <${RecipeSheet} recipeId=${open} onClose=${() => setOpen(null)} />
  </div>`;
}
