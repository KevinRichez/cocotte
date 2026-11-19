import { html, useState, useEffect, useMemo } from '../lib/h.js';
import { Sheet, Chip, Badge, Icon, Stepper } from './ui.js';
import { useStore } from '../store.js';
import { RECIPE, EQUIPMENT, MEALS, MEAL_KEYS } from '../data/recipes.js';
import { ING, fmtQty } from '../data/ingredients.js';
import { today, addDays, dayShort, dayNum, relDay } from '../lib/dates.js';
import {
  recipeLines, nutrition, linesCost, stockQty, swapOptions, budgetLevel, budgetLabel, euro, kcalFmt, nextFreeSlot, isSlotPast,
} from '../lib/engine.js';
import { planRecipe, addIngsToList } from '../actions.js';

/** Fiche recette détaillée : swaps rapides, stock, étapes, ajout au planning. */
export function RecipeSheet({ recipeId, onClose, target }) {
  const s = useStore();
  const r = RECIPE[recipeId];
  const [swaps, setSwaps] = useState({});
  const [servings, setServings] = useState(1);
  const [swapIdx, setSwapIdx] = useState(null);
  const [picking, setPicking] = useState(false);
  const [pick, setPick] = useState(null);

  useEffect(() => {
    setSwaps({}); setServings(1); setSwapIdx(null); setPicking(false);
    if (r) setPick(target || nextFreeSlot(s, r) || { date: today(), meal: r.meals[0] });
  }, [recipeId]);

  const lines = useMemo(() => (r ? recipeLines(r, swaps, servings) : []), [r, swaps, servings]);
  if (!r) return null;
  const per = nutrition(recipeLines(r, swaps));
  const cost = linesCost(s, recipeLines(r, swaps));
  const missing = lines.filter((l) => !ING[l.ing].staple && stockQty(s, l.ing) < l.qty).map((l) => l.ing);
  const refugeCount = lines.filter((l) => s.prefs.refuges.includes(l.ing)).length;
  const defi = lines.find((l) => s.prefs.defis.includes(l.ing));

  const confirm = () => {
    planRecipe(pick.date, pick.meal, r.id, swaps);
    onClose();
  };
  const days = Array.from({ length: 7 }, (_, i) => addDays(today(), i));

  const footer = picking
    ? html`<div class="stack">
        <div class="chips scroll">${days.map((d) => html`<${Chip} sm active=${pick?.date === d} onClick=${() => setPick({ ...pick, date: d })}>${i18nDay(d)}</${Chip}>`)}</div>
        <div class="chips">${MEAL_KEYS.map((m) => {
          const taken = s.plan[pick?.date]?.[m];
          return html`<${Chip} sm active=${pick?.meal === m} onClick=${() => setPick({ ...pick, meal: m })}>${MEALS[m].emoji} ${MEALS[m].label}${taken ? ' ·' : ''}</${Chip}>`;
        })}</div>
        ${s.plan[pick?.date]?.[pick?.meal] && html`<div class="subtle">Ce créneau a déjà un repas : il sera remplacé.</div>`}
        <div class="row"><button class="btn ghost" onClick=${() => setPicking(false)}>Retour</button>
          <button class="btn primary grow" disabled=${!pick} onClick=${confirm}><${Icon} name="check" size=${18} />Valider</button></div>
      </div>`
    : html`<div class="row">
        ${missing.length > 0 && html`<button class="btn ghost" onClick=${() => addIngsToList(missing)} title="Ajouter les manquants à la liste"><${Icon} name="cart" size=${18} />${missing.length}</button>`}
        ${target
          ? html`<button class="btn primary grow lg" onClick=${confirm}><${Icon} name="check" size=${18} />Placer : ${relDay(target.date).toLowerCase()}, ${MEALS[target.meal].label.toLowerCase()}</button>`
          : html`<button class="btn primary grow lg" onClick=${() => setPicking(true)}><${Icon} name="calendar" size=${18} />Ajouter à ma semaine</button>`}
      </div>`;

  return html`<${Sheet} open=${!!recipeId} onClose=${onClose} footer=${footer}>
    <div class="thumb lg" style=${{ background: r.color }}>${r.emoji}</div>
    <div style="margin:14px 2px 6px">
      <div class="row wrap" style="gap:6px;margin-bottom:8px">
        ${refugeCount >= 2 && html`<${Badge} tone="sky">💙 Refuge</${Badge}>`}
        ${defi && html`<${Badge} tone="lav">🌱 Défi doux : ${ING[defi.ing].name.toLowerCase()}</${Badge}>`}
        ${missing.length === 0 && html`<${Badge} tone="sage">✓ Tout en stock</${Badge}>`}
      </div>
      <h2 class="h1" style="font-size:23px">${r.name}</h2>
    </div>
    <div class="stat-grid" style="margin:12px 0">
      <div class="stat"><b>${r.time} min</b><span>Temps</span></div>
      ${s.profile.showKcal
        ? html`<div class="stat"><b>${kcalFmt(per.kcal)}</b><span>kcal / pers.</span></div>`
        : html`<div class="stat"><b>${r.meals.length}</b><span>moments</span></div>`}
      <div class="stat"><b>${Math.round(per.prot)} g</b><span>Protéines</span></div>
      <div class="stat"><b>${budgetLabel(budgetLevel(cost))}</b><span>${euro(cost)}</span></div>
    </div>
    <div class="chips" style="margin-bottom:6px">
      ${r.equipment.map((e) => html`<span class="badge neutral" style="height:28px">${EQUIPMENT[e].emoji} ${EQUIPMENT[e].label}</span>`)}
    </div>

    <div class="section-title"><div class="h2">Ingrédients</div>
      <${Stepper} value=${servings} min=${1} onChange=${setServings} format=${(v) => `${v} pers.`} />
    </div>
    <div class="list">
      ${lines.map((l) => {
        const ing = ING[l.ing];
        const have = stockQty(s, l.ing);
        const status = ing.staple ? (have > 0 ? 'ok' : 'no') : have >= l.qty ? 'ok' : have > 0 ? 'part' : 'no';
        const opts = l.swap ? swapOptions(r.ingredients[l.idx], s.prefs) : [];
        return html`<div key=${l.idx}>
          <div class="list-item" style="min-height:56px">
            <span class="thumb sm" style="background:var(--surface-2)">${ing.emoji}</span>
            <div class="grow">
              <div class="strong small">${ing.name}</div>
              <div class="subtle row" style="gap:6px"><span class=${`dot ${status}`}></span>
                ${status === 'ok' ? 'En stock' : status === 'part' ? `En partie (${fmtQty(have, ing.unit, l.ing)})` : 'À acheter'}
                ${l.swapped && html`<span>· remplace ${ING[l.swapped].name.toLowerCase()}</span>`}</div>
            </div>
            <span class="small strong num">${ing.staple ? 'un peu' : fmtQty(l.qty, ing.unit, l.ing)}</span>
            ${opts.length > 1 && html`<button class="icon-btn sm" aria-label="Échanger" onClick=${() => setSwapIdx(swapIdx === l.idx ? null : l.idx)}><${Icon} name="swap" size=${15} /></button>`}
          </div>
          ${swapIdx === l.idx && html`<div style="padding:0 14px 12px">
            <div class="subtle" style="margin-bottom:8px">Échanger ${l.swap === 'feculent' ? 'le féculent' : 'la protéine'} :</div>
            <div class="chips">${opts.map((o) => html`<${Chip} sm tone="sage" active=${l.ing === o}
              onClick=${() => { setSwaps({ ...swaps, [l.idx]: o === r.ingredients[l.idx].ing ? undefined : o }); setSwapIdx(null); }}>
              ${ING[o].emoji} ${ING[o].name}${s.prefs.refuges.includes(o) ? ' 💙' : ''}</${Chip}>`)}</div>
          </div>`}
        </div>`;
      })}
    </div>

    <div class="section-title"><div class="h2">Étapes</div><span class="subtle">${r.steps.length} étapes</span></div>
    <ol class="steps">${r.steps.map((st) => html`<li><span>${st}</span></li>`)}</ol>
  </${Sheet}>`;
}

function i18nDay(d) {
  const rel = relDay(d);
  return rel === "Aujourd'hui" || rel === 'Demain' ? rel : `${dayShort(d)} ${dayNum(d)}`;
}

export { isSlotPast };
