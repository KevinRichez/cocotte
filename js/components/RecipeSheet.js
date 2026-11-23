import { html, useState, useEffect, useMemo } from '../lib/h.js';
import { Sheet, Chip, Badge, Icon, Stepper, TierPicker, RecipeThumb, PhotoButton } from './ui.js';
import { RecipeEditor } from './RecipeEditor.js';
import { useStore } from '../store.js';
import { EQUIPMENT, MEALS, MEAL_KEYS } from '../data/recipes.js';
import { ING, fmtQty } from '../data/ingredients.js';
import { today, addDays, dayShort, dayNum, relDay } from '../lib/dates.js';
import {
  recipeLines, nutrition, linesCost, stockQty, swapOptions, budgetLevel, budgetLabel, euro, kcalFmt, nextFreeSlot,
  getRecipe, recipeTier, ingTier, canCook, slotBudget, servingsFor, refProduct, photoFor, productTitle, fmtPortion, stockSubstitute, linkCandidates, pastStock, cleanName, nextMainSlot, autoSwaps, removedIngs, blockReason,
} from '../lib/engine.js';
import { planRecipe, addIngsToList, setTier, deleteRecipe, relinkStockItem, setSlotServings, planLeftover } from '../actions.js';
import { confirmAction } from '../lib/confirm.js';

export function RecipeSheet({ recipeId, onClose, target, slot: slotCtx }) {
  const s = useStore();
  const r = getRecipe(s, recipeId);
  const [swaps, setSwaps] = useState({});
  const [servings, setServings] = useState(1);
  const [swapIdx, setSwapIdx] = useState(null);
  const [picking, setPicking] = useState(false);
  const [pick, setPick] = useState(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setSwapIdx(null); setPicking(false); setEditing(false);
    if (!r) return;
    const planned = slotCtx && s.plan[slotCtx.date]?.[slotCtx.meal];
    if (planned?.recipeId === r.id) { setSwaps(planned.swaps || {}); setServings(planned.servings || 1); setPick(slotCtx); return; }
    setSwaps(autoSwaps(s, r));
    const slot = target || nextFreeSlot(s, r) || { date: today(), meal: r.meals[0] };
    setPick(slot);
    const { budget, dir } = slotBudget(s, slot.date, slot.meal);
    setServings(s.profile.autoPortions ? servingsFor(nutrition(recipeLines(r), s).kcal, budget, dir) : 1);
  }, [recipeId]);

  const slotOver = slotCtx && s.plan[slotCtx.date]?.[slotCtx.meal]?.recipeId === recipeId ? s.plan[slotCtx.date][slotCtx.meal].over : null;
  const lines = useMemo(() => (r ? recipeLines(r, swaps, servings, slotOver) : []), [r, swaps, servings, slotOver]);
  if (!r) return null;
  const base = recipeLines(r, swaps);
  const per = nutrition(base, s);
  const cost = linesCost(s, base);
  const missing = lines.filter((l) => !ING[l.ing].staple && stockQty(s, l.ing) < l.qty).map((l) => l.ing);
  const tier = recipeTier(s, r.id);
  const plannedHere = slotCtx && s.plan[slotCtx.date]?.[slotCtx.meal]?.recipeId === r.id ? slotCtx : null;
  const confirm = () => { planRecipe(pick.date, pick.meal, r.id, swaps, servings); onClose(); };
  const changeServings = (v) => { setServings(v); if (plannedHere) setSlotServings(plannedHere.date, plannedHere.meal, v); };
  const nextSlot = plannedHere && nextMainSlot(plannedHere.date, plannedHere.meal);
  const days = Array.from({ length: 7 }, (_, i) => addDays(today(), i));

  const footer = picking
    ? html`<div class="stack">
        <div class="chips scroll">${days.map((d) => html`<${Chip} sm active=${pick?.date === d} onClick=${() => setPick({ ...pick, date: d })}>${dayLabel(d)}</${Chip}>`)}</div>
        <div class="chips">${MEAL_KEYS.map((m) => html`<${Chip} sm active=${pick?.meal === m} onClick=${() => setPick({ ...pick, meal: m })}>${MEALS[m].emoji} ${MEALS[m].label}${s.plan[pick?.date]?.[m] ? ' ·' : ''}</${Chip}>`)}</div>
        ${s.plan[pick?.date]?.[pick?.meal] && html`<div class="subtle">Ce créneau a déjà un repas : il sera remplacé.</div>`}
        <div class="row"><button type="button" class="btn ghost" onClick=${() => setPicking(false)}>Retour</button>
          <button type="button" class="btn primary grow" disabled=${!pick} onClick=${confirm}><${Icon} name="check" size=${18} />Valider</button></div>
      </div>`
    : plannedHere ? html`<div class="stack" style="gap:8px">
        ${plannedHere.meal === 'dej' && html`<button type="button" class="btn ghost block" onClick=${() => { planLeftover(plannedHere.date, 'dej', { date: plannedHere.date, meal: 'diner' }); onClose(); }}><${Icon} name="refresh" size=${16} />En double : ce soir</button>`}
        ${(plannedHere.meal === 'dej' || plannedHere.meal === 'diner') && html`<button type="button" class="btn ghost block" onClick=${() => { planLeftover(plannedHere.date, plannedHere.meal, { date: addDays(plannedHere.date, 1), meal: 'dej' }); onClose(); }}><${Icon} name="refresh" size=${16} />En double : demain midi</button>`}
        ${(plannedHere.meal === 'dej' || plannedHere.meal === 'diner') && html`<button type="button" class="btn ghost block" onClick=${() => { planLeftover(plannedHere.date, plannedHere.meal, { date: addDays(plannedHere.date, 1), meal: 'diner' }); onClose(); }}><${Icon} name="refresh" size=${16} />En double : demain soir</button>`}
        <button type="button" class="btn primary block lg" onClick=${onClose}><${Icon} name="check" size=${18} />OK</button>
      </div>`
    : html`<div class="row">
        ${missing.length > 0 && html`<button type="button" class="btn ghost" onClick=${() => addIngsToList(missing)} aria-label="Ajouter les manquants à la liste"><${Icon} name="cart" size=${18} />${missing.length}</button>`}
        ${target
          ? html`<button type="button" class="btn primary grow lg" onClick=${confirm}><${Icon} name="check" size=${18} />Placer : ${relDay(target.date).toLowerCase()}, ${MEALS[target.meal].label.toLowerCase()}</button>`
          : html`<button type="button" class="btn primary grow lg" onClick=${() => setPicking(true)}><${Icon} name="calendar" size=${18} />Ajouter à ma semaine</button>`}
      </div>`;

  return html`<${Sheet} open=${!!recipeId} onClose=${onClose} footer=${footer}>
    <div style="position:relative"><${RecipeThumb} r=${r} cls="thumb lg" /><span class="photo-fab"><${PhotoButton} recipeId=${r.id} label="Photo" /></span></div>
    <div style="margin:14px 2px 6px">
      <div class="row wrap" style="gap:6px;margin-bottom:8px">
        ${r.custom && html`<${Badge} tone="slate">${r.override ? 'Modifiée par toi' : 'Ma recette'}</${Badge}>`}
        ${missing.length === 0 && html`<${Badge} tone="sage">✓ Tout en stock</${Badge}>`}
        ${!canCook(s, r) && html`<${Badge} tone="mute">Matériel manquant</${Badge}>`}
      </div>
      <div class="row" style="align-items:flex-start">
        <h2 class="h1 grow" style="font-size:24px">${r.name}</h2>
        <button type="button" class="icon-btn sm" aria-label="Modifier la recette" onClick=${() => setEditing(true)}><${Icon} name="edit" size=${16} /></button>
      </div>
    </div>
    <div class="label" style="margin-top:6px">Pour toi, cette recette est</div>
    <${TierPicker} value=${tier} onChange=${(v) => setTier('recipe', r.id, v)} />
    <div class="stat-grid" style="margin:14px 0 12px">
      ${r.prep != null || r.cook != null
        ? html`<div class="stat"><b>${r.prep || 0}+${r.cook || 0}′</b><span>Prépa + cuisson</span></div>`
        : html`<div class="stat"><b>${r.time} min</b><span>Temps</span></div>`}
      <div class="stat"><b>${kcalFmt(per.kcal)}</b><span>kcal / pers.</span></div>
      <div class="stat"><b>${Math.round(per.prot)} g</b><span>Protéines</span></div>
      <div class="stat"><b>${budgetLabel(budgetLevel(cost))}</b><span>${euro(cost)}</span></div>
    </div>
    <div class="chips" style="margin-bottom:6px">${r.equipment.map((e) => html`<span class="badge neutral" style="height:28px">${EQUIPMENT[e]?.emoji} ${EQUIPMENT[e]?.label}</span>`)}</div>

    ${servings !== 1 && s.profile.autoPortions && !plannedHere && html`<div class="card tint-sage small" style="margin-top:4px">Pour ton objectif : <b>${fmtPortion(servings)}</b>, soit ${kcalFmt(per.kcal * servings)} kcal pour ce repas. C’est une seule portion, ${servings > 1 ? 'un peu plus grande' : 'un peu plus petite'} que la normale. Modifiable ci-dessous.</div>`}
    ${blockReason(s, r, swaps) && html`<div class="card tint-slate small" style="margin-top:4px">Recette habituellement masquée : ${blockReason(s, r, swaps).label.toLowerCase()}.</div>`}
    ${removedIngs(r, swaps).length > 0 && html`<div class="subtle small" style="margin:8px 2px 0">Sans ${removedIngs(r, swaps).map((i) => ING[i].name.toLowerCase()).join(', ')} (tes no-go)</div>`}
    <div class="section-title"><div class="h2">Ingrédients</div>
      <${Stepper} value=${servings} min=${0.25} max=${12} step=${0.25} onChange=${changeServings} format=${fmtPortion} />
    </div>
    <div class="list">
      ${lines.map((l) => {
        const ing = ING[l.ing];
        const have = stockQty(s, l.ing);
        const status = ing.staple ? (have > 0 ? 'ok' : 'no') : have >= l.qty ? 'ok' : have > 0 ? 'part' : 'no';
        const opts = l.swap ? swapOptions(r.ingredients[l.idx], s) : [];
        const it = ingTier(s, l.ing);
        const ref = refProduct(s, l.ing);
        return html`<div key=${l.idx}>
          <div class="list-item" style="min-height:56px">
            ${(ref?.image || photoFor(l.ing))
              ? html`<img class="thumb-img thumb sm" src=${ref?.image || photoFor(l.ing)} alt="" loading="lazy" referrerpolicy="no-referrer" />`
              : html`<span class="thumb sm" style="background:var(--surface-2)">${ing.emoji}</span>`}
            <div class="grow" style="min-width:0">
              <div class="strong small">${ref ? productTitle(ref) : ing.name}${it === 'refuge' ? ' 💙' : it === 'doux' ? ' 🌱' : ''}</div>
              <div class="subtle row" style="gap:6px"><span class=${`dot ${status}`}></span>
                ${status === 'ok' ? 'En stock' : status === 'part' ? `En partie (${fmtQty(have, ing.unit, l.ing)})` : 'À acheter'}
                ${l.swapped && html`<span>· remplace ${ING[l.swapped].name.toLowerCase()}</span>`}
                ${status !== 'no' && stockSubstitute(s, l.ing, l.qty) && html`<span>· avec ton ${stockSubstitute(s, l.ing, l.qty).toLowerCase()}</span>`}</div>
            </div>
            <span class="small strong num">${ing.staple ? 'un peu' : fmtQty(l.qty, ing.unit, l.ing)}</span>
            ${opts.length > 1 && html`<button type="button" class="icon-btn sm" aria-label="Échanger" onClick=${() => setSwapIdx(swapIdx === l.idx ? null : l.idx)}><${Icon} name="swap" size=${15} /></button>`}
          </div>
          ${status !== 'ok' && !ing.staple && (() => {
            const cand = linkCandidates(s, l.ing)[0];
            const past = pastStock(s, l.ing);
            if (cand) return html`<div class="link-hint">Tu as « ${cleanName(cand.name)} » ?
              <button type="button" class="btn soft sm" onClick=${() => relinkStockItem(cand.id, { ing: l.ing })}>Le compter comme ${ing.name.toLowerCase()}</button></div>`;
            if (past.length) return html`<div class="link-hint">Tu en as, mais avec une date passée : vérifie-la dans ton stock.</div>`;
            return null;
          })()}
          ${swapIdx === l.idx && html`<div style="padding:0 14px 12px">
            <div class="chips">${opts.map((o) => html`<${Chip} sm active=${l.ing === o}
              onClick=${() => { setSwaps({ ...swaps, [l.idx]: o === r.ingredients[l.idx].ing ? undefined : o }); setSwapIdx(null); }}>
              ${ING[o].emoji} ${ING[o].name}${ingTier(s, o) === 'refuge' ? ' 💙' : ''}</${Chip}>`)}</div>
          </div>`}
        </div>`;
      })}
    </div>

    ${r.steps?.length > 0 && html`<div class="section-title"><div class="h2">Étapes</div></div>
    <ol class="steps">${r.steps.map((st) => html`<li><span>${st}</span></li>`)}</ol>`}

    ${r.custom && !r.override && html`<button type="button" class="btn ghost block" style="margin-top:14px" onClick=${async () => { if (await confirmAction({ title: 'Supprimer cette recette ?', confirm: 'Supprimer' })) { deleteRecipe(r.id); onClose(); } }}><${Icon} name="trash" size=${16} />Supprimer cette recette</button>`}
    ${r.override && html`<button type="button" class="btn ghost block" style="margin-top:14px" onClick=${async () => { if (await confirmAction({ title: 'Rétablir la recette d’origine ?', message: 'Tes modifications seront perdues.', confirm: 'Rétablir' })) deleteRecipe(r.id, { restoreOriginal: true }); }}><${Icon} name="refresh" size=${16} />Rétablir la recette d’origine</button>`}
    <${RecipeEditor} open=${editing} recipe=${r} onClose=${() => setEditing(false)} />
  </${Sheet}>`;
}

function dayLabel(d) {
  const rel = relDay(d);
  return rel === "Aujourd'hui" || rel === 'Demain' ? rel : `${dayShort(d)} ${dayNum(d)}`;
}
