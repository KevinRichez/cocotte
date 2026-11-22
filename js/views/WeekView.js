import { html, useState, useMemo } from '../lib/h.js';
import { useStore } from '../store.js';
import { Icon, Chip, Badge, Sheet, KcalGauge } from '../components/ui.js';
import { RecipeSheet } from '../components/RecipeSheet.js';
import { MEALS, MEAL_KEYS } from '../data/recipes.js';
import { ING } from '../data/ingredients.js';
import { today, addDays, mondayOf, weekDays, dayShort, dayNum, relDay, dlcInfo } from '../lib/dates.js';
import {
  suggest, slotKcal, recipeLines, nutrition, kcalFmt, compileNeeds, isSlotPast, OUTSIDE_TAGS, urgentIngs,
  isBlocked, nextFreeSlot, getRecipe, allRecipes, targets, dayTotals, norm, slotBudget,
} from '../lib/engine.js';
import {
  markEaten, markDayEaten, adjustDayPortions, markOutside, skipSlot, resetSlot, clearSlot, planRecipe, placeDeferred, dropDeferred, generateList, autofillWeek,
} from '../actions.js';

export function WeekView() {
  const s = useStore();
  const t = today();
  const [monday, setMonday] = useState(mondayOf(t));
  const days = weekDays(monday);
  const [sel, setSel] = useState(t);
  const selected = days.includes(sel) ? sel : days[0];
  const [recipeOpen, setRecipeOpen] = useState(null);
  const [outside, setOutside] = useState(null);
  const [picker, setPicker] = useState(null);

  const shiftWeek = (n) => { const m = addDays(monday, n * 7); setMonday(m); setSel(weekDays(m).includes(t) ? t : m); };
  const futureDates = days.filter((d) => d >= t);
  const needs = useMemo(() => compileNeeds(s, futureDates), [s, monday]);

  return html`<div class="screen has-cta">
    <header class="topbar">
      <h1 class="h1">Ma semaine</h1>
      <div class="row" style="gap:6px">
        <button type="button" class="icon-btn" aria-label="Semaine précédente" onClick=${() => shiftWeek(-1)}><${Icon} name="chevL" /></button>
        <button type="button" class="icon-btn" aria-label="Semaine suivante" onClick=${() => shiftWeek(1)}><${Icon} name="chevR" /></button>
      </div>
    </header>

    <div class="days">
      ${days.map((d) => {
        const plan = s.plan[d] || {};
        return html`<button type="button" class=${`day ${d === t ? 'today' : ''} ${d === selected ? 'sel' : ''}`} onClick=${() => setSel(d)}>
          <span class="dname">${dayShort(d)}</span>
          <span class="dnum">${dayNum(d)}</span>
          <span class="dots">${MEAL_KEYS.map((m) => {
            const st = plan[m]?.status;
            return html`<i class=${st === 'outside' ? 'out' : st === 'skipped' ? 'skip' : st === 'eaten' ? 'on' : st ? 'plan' : ''}></i>`;
          })}</span>
        </button>`;
      })}
    </div>

    <${DaySummary} s=${s} date=${selected} />
    <${Nudges} s=${s} onOpen=${(id, target) => setRecipeOpen({ id, target })} />

    <div class="section-title">
      <div class="h2">${relDay(selected)}</div>
      ${futureDates.length > 0 && html`<button type="button" class="btn soft sm" onClick=${() => autofillWeek(futureDates, (d, date, meal) => (isSlotPast(date, meal) ? null : suggest(d, { meal, date, n: 1 })[0]))}>
        <${Icon} name="sparkles" size=${15} />Compléter</button>`}
    </div>

    <div class="stack">
      ${MEAL_KEYS.map((meal) => html`<${SlotCard} key=${selected + meal} s=${s} date=${selected} meal=${meal}
        onOpenRecipe=${(id) => setRecipeOpen({ id })}
        onOutside=${() => setOutside({ date: selected, meal })}
        onPick=${() => setPicker({ date: selected, meal })} />`)}
    </div>

    ${futureDates.length > 0 && html`<div class="floating-cta">
      <button type="button" class="btn primary block lg" onClick=${() => generateList(futureDates)}>
        <${Icon} name="cart" size=${19} />Générer ma liste de courses
        ${needs.length > 0 && html`<span class="badge cta-badge">${needs.length}</span>`}
      </button>
    </div>`}

    <${RecipeSheet} recipeId=${recipeOpen?.id} target=${recipeOpen?.target} onClose=${() => setRecipeOpen(null)} />
    <${OutsideSheet} ctx=${outside} s=${s} onClose=${() => setOutside(null)} />
    <${PickerSheet} ctx=${picker} s=${s} onClose=${() => setPicker(null)} onDetails=${(id, target) => { setPicker(null); setRecipeOpen({ id, target }); }} />
  </div>`;
}

function DaySummary({ s, date }) {
  const tg = targets(s.profile);
  const { eaten, planned, protEaten, protPlanned } = dayTotals(s, date);
  return html`<div class="card pad-lg" style="margin-top:14px">
    <${KcalGauge} eaten=${eaten} planned=${planned} target=${tg.kcal} />
    ${planned < tg.kcal - 50 && MEAL_KEYS.some((m) => s.plan[date]?.[m]?.status === 'planned' && !isSlotPast(date, m)) && html`<button type="button" class="btn soft sm block" style="margin-top:12px" onClick=${() => adjustDayPortions(date, tg.kcal)}>
      <${Icon} name="sparkles" size=${15} />Ajuster les portions pour atteindre ${kcalFmt(tg.kcal)} kcal</button>`}
    <div class="prot-line"><span>Protéines</span><b class="num">${Math.round(protEaten)} g</b></div>
  </div>`;
}

const fmtServ = (v) => String(v).replace('.', ',');

function shortDay(d) {
  const rel = relDay(d);
  return rel === "Aujourd'hui" || rel === 'Demain' ? rel.toLowerCase() : `${dayShort(d).toLowerCase()}. ${dayNum(d)}`;
}

function plannedBefore(s, ing, dlc) {
  for (let k = 0; k <= 3; k++) {
    const date = addDays(today(), k);
    if (date > dlc) break;
    for (const m of MEAL_KEYS) {
      const slot = s.plan[date]?.[m];
      const r = slot && getRecipe(s, slot.recipeId);
      if (slot?.status === 'planned' && r && !isSlotPast(date, m) && recipeLines(r, slot.swaps).some((l) => l.ing === ing)) return true;
    }
  }
  return false;
}

function Nudges({ s, onOpen }) {
  const items = [];
  const y = addDays(today(), -1);
  const pendingY = MEAL_KEYS.filter((m) => s.plan[y]?.[m]?.status === 'planned' && getRecipe(s, s.plan[y][m].recipeId));
  if (pendingY.length) {
    items.push(html`<div class="card tint-sage" key="yesterday">
      <div class="row">
        <span class="thumb sm" style="background:#fff">✅</span>
        <div class="grow"><div class="strong small">Hier, ${pendingY.length} repas prévu${pendingY.length > 1 ? 's' : ''} pas encore validé${pendingY.length > 1 ? 's' : ''}</div>
          <div class="subtle">Le stock se met à jour tout seul.</div></div>
      </div>
      <button type="button" class="btn dark sm block" style="margin-top:10px" onClick=${() => markDayEaten(y)}><${Icon} name="checks" size=${16} />Tout mangé comme prévu</button>
    </div>`);
  }
  for (const d of s.deferred) {
    const r = getRecipe(s, d.recipeId);
    if (!r) continue;
    const slot = nextFreeSlot(s, r);
    items.push(html`<div class="card tint-slate" key=${d.id}>
      <div class="row">
        <span class="thumb sm" style=${{ background: r.color }}>${r.emoji}</span>
        <div class="grow">
          <div class="strong small ellipsis">À recaser : ${r.name}</div>
          <div class="subtle">${slot ? `${relDay(slot.date)}, ${MEALS[slot.meal].label.toLowerCase()}` : 'Aucun créneau libre'}</div>
        </div>
        <button type="button" class="icon-btn sm plain" aria-label="Ignorer" onClick=${() => dropDeferred(d.id)}><${Icon} name="x" size=${16} /></button>
      </div>
      ${slot && html`<button type="button" class="btn dark sm block" style="margin-top:10px" onClick=${() => placeDeferred(d.id, slot)}>Recaser en 1 tap</button>`}
    </div>`);
  }
  const urgent = urgentIngs(s).filter((ing) => {
    const lot = s.inventory.filter((x) => x.ing === ing).sort((a, b) => a.dlc.localeCompare(b.dlc))[0];
    return lot && !plannedBefore(s, ing, lot.dlc);
  });
  if (urgent.length) {
    const ing = urgent[0];
    const lot = s.inventory.filter((x) => x.ing === ing).sort((a, b) => a.dlc.localeCompare(b.dlc))[0];
    const idea = suggest(s, { n: 10 }).map((x) => x.recipe).find((r) => recipeLines(r).some((l) => l.ing === ing));
    const slot = idea && nextFreeSlot(s, idea);
    items.push(html`<div class="card tint-amber" key="gaspi">
      <div class="row">
        <span class="thumb sm" style="background:#fff">${ING[ing].emoji}</span>
        <div class="grow">
          <div class="strong small">${ING[ing].name} : ${dlcInfo(lot.dlc).label.toLowerCase()}</div>
          <div class="subtle">${idea ? `Idée : ${idea.name}` : 'Pense à l’utiliser bientôt'}</div>
        </div>
      </div>
      ${idea && html`<div class="row" style="margin-top:10px">
        <button type="button" class="btn outline sm grow" onClick=${() => onOpen(idea.id, slot)}>Voir</button>
        ${slot && html`<button type="button" class="btn dark sm grow" onClick=${() => planRecipe(slot.date, slot.meal, idea.id)}>Placer ${shortDay(slot.date)}</button>`}
      </div>`}
    </div>`);
  }
  if (!items.length) return null;
  return html`<div class="stack" style="margin-top:12px">${items}</div>`;
}

function SlotCard({ s, date, meal, onOpenRecipe, onOutside, onPick }) {
  const slot = s.plan[date]?.[meal];
  const r = slot?.recipeId ? getRecipe(s, slot.recipeId) : null;
  const past = isSlotPast(date, meal);
  const M = MEALS[meal];
  const head = (right) => html`<div class="slot-head"><span class="slot-ico">${M.emoji}</span><span class="slot-label grow">${M.label}</span>${right}</div>`;

  if (!slot) {
    if (past) {
      return html`<div class="card slot">${head(null)}
        <div class="quick-actions">
          <button type="button" class="qa" onClick=${onPick}><${Icon} name="plus" size=${15} />Repas</button>
          <button type="button" class="qa out" onClick=${onOutside}><${Icon} name="utensils" size=${15} />Dehors</button>
          <button type="button" class="qa skip" onClick=${() => skipSlot(date, meal)}><${Icon} name="cloud" size=${15} />Je passe</button>
        </div>
      </div>`;
    }
    const sugg = suggest(s, { meal, date, n: 2 });
    return html`<div class="card slot">${head(html`<button type="button" class="btn soft sm" onClick=${onPick}>Plus d'idées</button>`)}
      ${sugg.map(({ recipe, reasons, kcal, servings }) => html`<button type="button" class="suggest" onClick=${() => planRecipe(date, meal, recipe.id, {}, servings)}>
        <span class="thumb sm" style=${{ background: recipe.color }}>${recipe.emoji}</span>
        <div class="grow" style="min-width:0">
          <div class="small strong clamp2">${recipe.name}</div>
          <div class="row" style="gap:6px;margin-top:2px">
            <span class="subtle xs">${recipe.time} min · ${kcalFmt(kcal)} kcal${servings !== 1 ? ` · x${fmtServ(servings)}` : ''}</span>
            ${reasons.slice(0, 1).map((x) => html`<span class=${`badge ${x.tone} xs`}>${x.label}</span>`)}
          </div>
        </div>
        <span class="icon-btn sm add"><${Icon} name="plus" size=${16} /></span>
      </button>`)}
      <div class="row" style="margin-top:8px;gap:6px">
        <button type="button" class="qa out grow" onClick=${onOutside}><${Icon} name="utensils" size=${15} />Pris dehors</button>
        <button type="button" class="qa skip grow" onClick=${() => skipSlot(date, meal)}><${Icon} name="cloud" size=${15} />Je passe</button>
      </div>
    </div>`;
  }

  const k = slotKcal(s, slot);
  const mealRow = r && html`<button type="button" class="meal" onClick=${() => onOpenRecipe(r.id)}>
    <span class="thumb" style=${{ background: r.color }}>${r.emoji}</span>
    <div class="grow" style="min-width:0">
      <div class="strong clamp2" style="line-height:1.25">${r.name}</div>
      <div class="meal-meta">
        <span><${Icon} name="clock" size=${13} />${r.time} min</span>
        <span><${Icon} name="flame" size=${13} />${kcalFmt(k.kcal)} kcal</span>
        <span>${Math.round(k.prot)} g prot.</span>
        ${slot.servings && slot.servings !== 1 && html`<span>x${fmtServ(slot.servings)} portion</span>`}
        ${Object.values(slot.swaps || {}).some(Boolean) && html`<span><${Icon} name="swap" size=${12} />adapté</span>`}
      </div>
    </div>
    <${Icon} name="chevR" size=${18} class="muted" />
  </button>`;

  if (slot.status === 'outside') {
    const tags = (slot.outside?.tags || []).map((id) => OUTSIDE_TAGS.find((x) => x.id === id)).filter(Boolean);
    return html`<div class="card slot state-outside">${head(html`<button type="button" class="btn ghost sm" onClick=${() => resetSlot(date, meal)}>Modifier</button>`)}
      <div class="meal">
        <span class="thumb" style="background:var(--slate-50)">${tags[0]?.emoji || '🍽️'}</span>
        <div class="grow">
          <div class="strong">${tags.length ? tags.map((x) => x.label).join(' + ') : 'Repas pris dehors'}</div>
          <div class="subtle">${slot.outside?.note ? `${slot.outside.note} · ` : ''}~${kcalFmt(k.kcal)} kcal</div>
        </div>
      </div>
    </div>`;
  }

  if (slot.status === 'skipped') {
    return html`<div class="card slot state-skipped">${head(html`<button type="button" class="btn ghost sm" onClick=${() => resetSlot(date, meal)}>Annuler</button>`)}
      <div class="subtle">Repas passé</div>
    </div>`;
  }

  if (!r) {
    return html`<div class="card slot">${head(null)}<div class="subtle">Recette introuvable.</div>
      <button type="button" class="btn ghost sm" onClick=${() => clearSlot(date, meal)}>Libérer</button></div>`;
  }

  if (slot.status === 'eaten') {
    return html`<div class="card slot state-eaten">${head(html`<button type="button" class="btn ghost sm" onClick=${() => resetSlot(date, meal)}>Annuler</button>`)}
      ${mealRow}
      <div class="status-line"><${Badge} tone="sage"><${Icon} name="check" size=${12} />Mangé</${Badge}></div>
    </div>`;
  }

  return html`<div class="card slot">${head(html`<div class="row" style="gap:4px">
      <button type="button" class="icon-btn sm plain" aria-label="Changer de recette" onClick=${onPick}><${Icon} name="swap" size=${16} /></button>
      <button type="button" class="icon-btn sm plain" aria-label="Libérer le créneau" onClick=${() => clearSlot(date, meal)}><${Icon} name="x" size=${16} /></button>
    </div>`)}
    ${mealRow}
    <div class="quick-actions">
      <button type="button" class="qa eat" onClick=${() => markEaten(date, meal)}><${Icon} name="check" size=${15} />Mangé</button>
      <button type="button" class="qa out" onClick=${onOutside}><${Icon} name="utensils" size=${15} />Dehors</button>
      <button type="button" class="qa skip" onClick=${() => skipSlot(date, meal)}><${Icon} name="cloud" size=${15} />Je passe</button>
    </div>
  </div>`;
}

function OutsideSheet({ ctx, s, onClose }) {
  const [tags, setTags] = useState([]);
  const [note, setNote] = useState('');
  const slot = ctx && s.plan[ctx.date]?.[ctx.meal];
  const planned = slot?.recipeId && slot.status === 'planned' ? getRecipe(s, slot.recipeId) : null;
  const close = () => { setTags([]); setNote(''); onClose(); };
  const save = () => { markOutside(ctx.date, ctx.meal, { tags, note: note.trim().slice(0, 80) }); close(); };
  const toggle = (id) => setTags(tags.includes(id) ? tags.filter((x) => x !== id) : [...tags, id]);
  return html`<${Sheet} open=${!!ctx} onClose=${close} title="Repas pris dehors"
    subtitle=${ctx ? `${relDay(ctx.date)} · ${MEALS[ctx.meal].label}` : ''}
    footer=${html`<button type="button" class="btn primary block lg" onClick=${save}><${Icon} name="check" size=${18} />Enregistrer</button>`}>
    <div class="label">Qu’as-tu mangé ? (facultatif)</div>
    <div class="chips">${OUTSIDE_TAGS.map((t) => html`<${Chip} active=${tags.includes(t.id)} onClick=${() => toggle(t.id)}>${t.emoji} ${t.label}</${Chip}>`)}</div>
    <div style="margin-top:14px">
      <label class="label" for="out-note">Un mot ?</label>
      <input id="out-note" class="field" maxlength="80" placeholder="Ex : kebab frites avec Léa" value=${note} onInput=${(e) => setNote(e.currentTarget.value)} />
    </div>
    ${planned && html`<div class="card tint-sage" style="margin-top:14px">
      <div class="small"><b>${planned.name}</b> sera re-proposé plus tard dans la semaine.</div>
    </div>`}
  </${Sheet}>`;
}

function PickerSheet({ ctx, s, onClose, onDetails }) {
  const [q, setQ] = useState('');
  if (!ctx) return html`<${Sheet} open=${false} />`;
  const sugg = suggest(s, { meal: ctx.meal, date: ctx.date, n: 4 });
  const nq = norm(q);
  const all = allRecipes(s).filter((r) => r.meals.includes(ctx.meal) && !isBlocked(s, r) && (!nq || norm(r.name).includes(nq)));
  const pick = (id, servings = 1) => { planRecipe(ctx.date, ctx.meal, id, {}, servings); setQ(''); onClose(); };
  const row = (r, reasons = [], servings = 1) => html`<div class="suggest" key=${r.id}>
    <button type="button" class="row grow" style="text-align:left;gap:10px;min-width:0" onClick=${() => onDetails(r.id, ctx)}>
      <span class="thumb sm" style=${{ background: r.color }}>${r.emoji}</span>
      <div class="grow" style="min-width:0">
        <div class="small strong clamp2">${r.name}</div>
        <div class="row" style="gap:6px;margin-top:2px"><span class="subtle xs">${r.time} min · ${kcalFmt(nutrition(recipeLines(r, {}, servings), s).kcal)} kcal${servings !== 1 ? ` · x${fmtServ(servings)}` : ''}</span>
          ${reasons.slice(0, 1).map((x) => html`<span class=${`badge ${x.tone} xs`}>${x.label}</span>`)}</div>
      </div>
    </button>
    <button type="button" class="icon-btn sm add" aria-label="Choisir" onClick=${() => pick(r.id, servings)}><${Icon} name="plus" size=${16} /></button>
  </div>`;
  const { remaining } = slotBudget(s, ctx.date, ctx.meal);
  return html`<${Sheet} open=${true} onClose=${() => { setQ(''); onClose(); }} title=${`${MEALS[ctx.meal].emoji} ${MEALS[ctx.meal].label}`} subtitle=${`${relDay(ctx.date)} · reste ~${kcalFmt(remaining)} kcal pour atteindre l'objectif`}>
    ${!nq && html`<div class="label">Suggestions pour atteindre ton objectif</div>${sugg.map((x) => row(x.recipe, x.reasons, x.servings))}`}
    <div class="search" style="margin:16px 0 10px"><${Icon} name="search" size=${18} />
      <input class="field" type="search" placeholder="Chercher une recette" value=${q} onInput=${(e) => setQ(e.currentTarget.value)} /></div>
    ${all.map((r) => row(r))}
  </${Sheet}>`;
}
