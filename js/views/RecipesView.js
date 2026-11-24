import { html, useState, useMemo } from '../lib/h.js';
import { useStore } from '../store.js';
import { Icon, Chip, Badge, Empty, Sheet, Seg, RecipeThumb } from '../components/ui.js';
import { setProfile } from '../actions.js';
import { RecipeSheet } from '../components/RecipeSheet.js';
import { RecipeEditor } from '../components/RecipeEditor.js';
import { RecipeImport } from '../components/RecipeImport.js';
import { MEALS, MEAL_KEYS, EQUIPMENT } from '../data/recipes.js';
import { ING } from '../data/ingredients.js';
import { recipeStats, stockMatch, isBlocked, budgetLevel, budgetLabel, kcalFmt, allRecipes, recipeTier, TIER_META, norm, euro, blockReason } from '../lib/engine.js';

const NO_FILTERS = { time: null, budget: null, stock: false, tier: null, mine: false, showBlocked: false };

export function RecipesView() {
  const s = useStore();
  const [q, setQ] = useState('');
  const [meal, setMeal] = useState('all');
  const [f, setF] = useState(NO_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [open, setOpen] = useState(null);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);

  const enriched = useMemo(() => allRecipes(s).map((r) => {
    const st = recipeStats(s, r);
    const why = blockReason(s, r);
    return { r, ...st, match: stockMatch(s, st.lines), tier: recipeTier(s, r.id), blocked: !!why, why, budget: budgetLevel(st.cost) };
  }), [s.inventory, s.prefs, s.priceOverrides, s.customRecipes, s.profile.equipment, s.profile.stores]);

  const nq = norm(q);
  const list = enriched.filter((x) => (!x.blocked || (f.showBlocked && x.why?.type === 'equip'))
    && (!nq || norm(x.r.name).includes(nq) || x.lines.some((l) => norm(ING[l.ing].name).includes(nq)))
    && (meal === 'all' || x.r.meals.includes(meal))
    && (!f.time || x.r.time <= f.time)
    && (!f.budget || x.cost <= f.budget)
    && (!f.stock || x.match.ratio >= 0.75)
    && (!f.tier || x.tier === f.tier)
    && (!f.mine || x.r.custom))
    .sort((a, b) => tierRank(a.tier) - tierRank(b.tier) || (f.stock ? b.match.ratio - a.match.ratio : 0) || a.r.time - b.r.time);
  const hiddenList = enriched.filter((x) => x.blocked && (!nq || norm(x.r.name).includes(nq) || x.lines.some((l) => norm(ING[l.ing].name).includes(nq))) && (meal === 'all' || x.r.meals.includes(meal)));
  const hidden = enriched.filter((x) => x.blocked).length;
  const [showHidden, setShowHidden] = useState(false);
  const missingEquip = [...new Set(enriched.filter((x) => x.why?.type === 'equip').flatMap((x) => x.why.missing))];
  const active = [
    f.time && { k: 'time', label: `${f.time} min max` },
    f.budget && { k: 'budget', label: `${euro(f.budget)} max / portion` },
    f.stock && { k: 'stock', label: 'Avec mon stock' },
    f.tier && { k: 'tier', label: `${TIER_META[f.tier].emoji} ${TIER_META[f.tier].label}` },
    f.mine && { k: 'mine', label: 'Mes recettes' },
    f.showBlocked && { k: 'showBlocked', label: 'Matériel manquant affiché' },
  ].filter(Boolean);

  return html`<div class="screen">
    <header class="topbar">
      <h1 class="h1">Recettes</h1>
      <div class="row" style="gap:6px">
        <button type="button" class="btn outline sm" onClick=${() => setImporting(true)}><${Icon} name="download" size=${15} />Importer</button>
        <button type="button" class="btn soft sm" onClick=${() => setCreating(true)}><${Icon} name="plus" size=${16} />Créer</button>
      </div>
    </header>

    <div class="row" style="gap:8px">
      <div class="search grow"><${Icon} name="search" size=${18} />
        <input class="field" type="search" placeholder="Recette ou ingrédient" value=${q} onInput=${(e) => setQ(e.currentTarget.value)} /></div>
      <button type="button" class=${`icon-btn lgx ${active.length ? 'has-dot' : ''}`} aria-label="Filtres" onClick=${() => setFiltersOpen(true)}><${Icon} name="sliders" size=${19} /></button>
    </div>

    <div class="meal-tabs">
      ${[['all', 'Tout'], ...MEAL_KEYS.map((m) => [m, MEALS[m].label])].map(([k, label]) => html`<button type="button" class=${meal === k ? 'on' : ''} onClick=${() => setMeal(k)}>${label}</button>`)}
    </div>

    ${active.length > 0 && html`<div class="chips" style="margin-top:10px">
      ${active.map((a) => html`<${Chip} sm active onClick=${() => setF({ ...f, [a.k]: NO_FILTERS[a.k] })}>${a.label}<span class="x"><${Icon} name="x" size=${13} /></span></${Chip}>`)}
    </div>`}

    <p class="subtle" style="margin:12px 2px 0">${list.length} recette${list.length > 1 ? 's' : ''}</p>
    ${list.length === 0 && html`<${Empty} emoji="🔎" title="Aucune recette ici">Retire un filtre ou crée la tienne.</${Empty}>`}

    <div class="recipe-grid" style="margin-top:10px">
      ${list.map((x) => html`<button type="button" class="rcard" key=${x.r.id} onClick=${() => setOpen(x.r.id)}>
        <${RecipeThumb} r=${x.r} cls="rthumb">
          ${x.tier ? html`<${Badge} tone=${TIER_META[x.tier].tone}>${TIER_META[x.tier].emoji} ${TIER_META[x.tier].label}</${Badge}>`
            : x.match.ratio === 1 ? html`<${Badge} tone="sage">✓ En stock</${Badge}>` : null}
        </${RecipeThumb}>
        <div class="rbody">
          <div class="rname">${x.r.name}</div>
          <div class="meal-meta" style="margin-top:auto;padding-top:4px">
            <span><${Icon} name="clock" size=${12} />${x.r.time} min</span>
            <span>${kcalFmt(x.kcal)} kcal</span>
            <span>${budgetLabel(x.budget)}</span>
          </div>
        </div>
      </button>`)}
    </div>
    ${hidden > 0 && html`<div class="card flat" style="margin-top:16px">
      <button type="button" class="row between" style="width:100%" onClick=${() => setShowHidden(!showHidden)}>
        <span class="small strong">${hidden} recette${hidden > 1 ? 's' : ''} masquée${hidden > 1 ? 's' : ''}${nq && hiddenList.length ? ` · ${hiddenList.length} pour « ${q.trim()} »` : ''}</span>
        <${Icon} name=${showHidden || (nq && hiddenList.length) ? 'chevU' : 'chevD'} size=${16} /></button>
      ${missingEquip.length > 0 && html`<div class="subtle xs" style="margin-top:6px">Matériel qui débloquerait des recettes :</div>
        <div class="chips" style="margin-top:6px">${missingEquip.map((e) => html`<${Chip} sm onClick=${() => setProfile({ equipment: [...(s.profile.equipment || []), e] })}>+ J’ai : ${EQUIPMENT[e]?.emoji} ${EQUIPMENT[e]?.label || e}</${Chip}>`)}</div>`}
      ${(showHidden || (nq && hiddenList.length > 0)) && html`<div class="list" style="margin-top:10px">${hiddenList.map((x) => html`<button type="button" class="list-item" style="width:100%;text-align:left" key=${x.r.id} onClick=${() => setOpen(x.r.id)}>
        <${RecipeThumb} r=${x.r} cls="thumb sm" />
        <div class="grow" style="min-width:0"><div class="small strong clamp2">${x.r.name}</div><div class="subtle xs">${x.why.label}</div></div>
      </button>`)}</div>`}
    </div>`}

    <${FiltersSheet} open=${filtersOpen} f=${f} setF=${setF} onClose=${() => setFiltersOpen(false)} count=${list.length} />
    <${RecipeSheet} recipeId=${open} onClose=${() => setOpen(null)} />
    <${RecipeEditor} open=${creating} onClose=${() => setCreating(false)} onSaved=${(id) => setOpen(id)} />
    ${importing && html`<${RecipeImport} open=${true} onClose=${() => setImporting(false)} onSaved=${(id) => { setImporting(false); setOpen(id); }} />`}
  </div>`;
}

function RangeFilter({ label, min, max, step, value, onChange, format, anyLabel }) {
  const v = value ?? max;
  const pct = ((v - min) / (max - min)) * 100;
  return html`<div class="filter-group">
    <div class="row between"><span class="label" style="margin:0">${label}</span><b class="small num">${value ? format(value) : anyLabel}</b></div>
    <input type="range" class="range" min=${min} max=${max} step=${step} value=${v} style=${{ '--p': `${pct}%` }} aria-label=${label}
      onInput=${(e) => { const n = +e.currentTarget.value; onChange(n >= max ? null : n); }} />
    <div class="range-scale"><span>${format(min).replace(' max', '')}</span><span>${anyLabel}</span></div>
  </div>`;
}

const tierRank = (t) => ({ refuge: 0, ok: 1, doux: 2 }[t] ?? 1.5);

function FiltersSheet({ open, f, setF, onClose, count }) {
  const set = (k, v) => setF({ ...f, [k]: f[k] === v ? NO_FILTERS[k] : v });
  return html`<${Sheet} open=${open} onClose=${onClose} title="Filtres"
    footer=${html`<div class="row"><button type="button" class="btn ghost" onClick=${() => setF(NO_FILTERS)}>Tout effacer</button>
      <button type="button" class="btn primary grow" onClick=${onClose}>Voir ${count} recette${count > 1 ? 's' : ''}</button></div>`}>
    <${RangeFilter} label="Temps total" min=${5} max=${60} step=${5} value=${f.time} onChange=${(v) => setF({ ...f, time: v })}
      format=${(v) => `${v} min max`} anyLabel="Peu importe" />
    <${RangeFilter} label="Budget par portion" min=${0.5} max=${5} step=${0.25} value=${f.budget} onChange=${(v) => setF({ ...f, budget: v })}
      format=${(v) => `${euro(v)} max`} anyLabel="Peu importe" />
    <div class="filter-group"><div class="label">Mes préférences</div>
      <div class="chips">${['refuge', 'ok', 'doux'].map((k) => html`<${Chip} active=${f.tier === k} onClick=${() => set('tier', k)}>${TIER_META[k].emoji} ${TIER_META[k].label}</${Chip}>`)}
        <${Chip} active=${f.mine} onClick=${() => setF({ ...f, mine: !f.mine })}>✍️ Mes recettes</${Chip}></div></div>
    <div class="filter-group"><div class="label">Stock</div>
      <div class="chips"><${Chip} active=${f.stock} onClick=${() => setF({ ...f, stock: !f.stock })}>Faisable avec ce que j’ai</${Chip}></div></div>
    <div class="filter-group"><div class="label">Matériel</div>
      <p class="subtle" style="margin:0 2px 8px">Les recettes qui demandent du matériel que tu n’as pas sont masquées.</p>
      <div class="chips"><${Chip} active=${f.showBlocked} onClick=${() => setF({ ...f, showBlocked: !f.showBlocked })}>${f.showBlocked ? '✓ ' : ''}Les afficher quand même</${Chip}></div></div>
  </${Sheet}>`;
}
