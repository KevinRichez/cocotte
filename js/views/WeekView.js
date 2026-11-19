import { html, useState, useMemo } from '../lib/h.js';
import { useStore } from '../store.js';
import { Icon, Chip, Badge, Ring, Sheet } from '../components/ui.js';
import { RecipeSheet } from '../components/RecipeSheet.js';
import { RECIPE, RECIPES, MEALS, MEAL_KEYS } from '../data/recipes.js';
import { ING } from '../data/ingredients.js';
import { today, addDays, mondayOf, weekDays, dayShort, dayNum, fmtRange, fmtDayLong, relDay, dlcInfo } from '../lib/dates.js';
import {
  suggest, slotKcal, recipeLines, nutrition, kcalFmt, compileNeeds, isSlotPast, OUTSIDE_TAGS, urgentIngs,
  isBlocked, nextFreeSlot,
} from '../lib/engine.js';
import {
  markEaten, markOutside, skipSlot, resetSlot, clearSlot, planRecipe, placeDeferred, dropDeferred, generateList, autofillWeek,
} from '../actions.js';

export function WeekView() {
  const s = useStore();
  const t = today();
  const [monday, setMonday] = useState(mondayOf(t));
  const days = weekDays(monday);
  const [sel, setSel] = useState(t);
  const selected = days.includes(sel) ? sel : days[0];
  const [recipeOpen, setRecipeOpen] = useState(null); // { id, target? }
  const [outside, setOutside] = useState(null); // { date, meal }
  const [picker, setPicker] = useState(null); // { date, meal }

  const shiftWeek = (n) => { const m = addDays(monday, n * 7); setMonday(m); setSel(n === 0 ? t : (weekDays(m).includes(t) ? t : m)); };
  const futureDates = days.filter((d) => d >= t);
  const needs = useMemo(() => compileNeeds(s, futureDates), [s, monday]);

  return html`<div class="screen has-cta">
    <header class="topbar">
      <div>
        <div class="eyebrow">${fmtRange(days[0], days[6])}</div>
        <h1 class="h1">Ma semaine</h1>
      </div>
      <div class="row" style="gap:6px">
        <button class="icon-btn" aria-label="Semaine précédente" onClick=${() => shiftWeek(-1)}><${Icon} name="chevL" /></button>
        <button class="icon-btn" aria-label="Semaine suivante" onClick=${() => shiftWeek(1)}><${Icon} name="chevR" /></button>
      </div>
    </header>

    <div class="days">
      ${days.map((d) => {
        const plan = s.plan[d] || {};
        return html`<button class=${`day ${d === t ? 'today' : ''} ${d === selected ? 'sel' : ''}`} onClick=${() => setSel(d)}>
          <span class="dname">${dayShort(d)}</span>
          <span class="dnum">${dayNum(d)}</span>
          <span class="dots">${MEAL_KEYS.map((m) => {
            const st = plan[m]?.status;
            return html`<i class=${st === 'outside' ? 'out' : st === 'skipped' ? 'skip' : st ? 'on' : ''}></i>`;
          })}</span>
        </button>`;
      })}
    </div>

    <${DaySummary} s=${s} date=${selected} />

    <${Nudges} s=${s} onOpen=${(id, target) => setRecipeOpen({ id, target })} />

    <div class="section-title">
      <div class="h2">${relDay(selected)}</div>
      ${futureDates.length > 0 && html`<button class="btn soft sm" onClick=${() => autofillWeek(futureDates, (d, date, meal) => suggest(d, { meal, date, n: 1 })[0]?.recipe)}>
        <${Icon} name="sparkles" size=${15} />Compléter</button>`}
    </div>

    <div class="stack">
      ${MEAL_KEYS.map((meal) => html`<${SlotCard} key=${selected + meal} s=${s} date=${selected} meal=${meal}
        onOpenRecipe=${(id) => setRecipeOpen({ id })}
        onOutside=${() => setOutside({ date: selected, meal })}
        onPick=${() => setPicker({ date: selected, meal })} />`)}
    </div>

    ${futureDates.length > 0 && html`<div class="floating-cta">
      <button class="btn primary block lg" onClick=${() => generateList(futureDates)}>
        <${Icon} name="cart" size=${19} />Générer ma liste de courses
        ${needs.length > 0 && html`<span class="badge" style="background:rgba(255,255,255,.22);color:#fff">${needs.length} manquant${needs.length > 1 ? 's' : ''}</span>`}
      </button>
    </div>`}

    <${RecipeSheet} recipeId=${recipeOpen?.id} target=${recipeOpen?.target} onClose=${() => setRecipeOpen(null)} />
    <${OutsideSheet} ctx=${outside} s=${s} onClose=${() => setOutside(null)} />
    <${PickerSheet} ctx=${picker} s=${s} onClose=${() => setPicker(null)} onDetails=${(id, target) => { setPicker(null); setRecipeOpen({ id, target }); }} />
  </div>`;
}

function DaySummary({ s, date }) {
  const plan = s.plan[date] || {};
  let kcal = 0, prot = 0, filled = 0, skipped = 0, eaten = 0;
  for (const m of MEAL_KEYS) {
    const slot = plan[m];
    if (!slot) continue;
    filled++;
    if (slot.status === 'skipped') { skipped++; continue; }
    if (slot.status === 'eaten' || slot.status === 'outside') eaten++;
    const k = slotKcal(s, slot); kcal += k.kcal; prot += k.prot;
  }
  const target = s.profile.kcalTarget;
  const msg = skipped
    ? 'Tu as écouté ta satiété aujourd’hui. C’est une vraie force 🌿'
    : filled === 0 ? 'Journée libre. On peut piocher dans les idées ci-dessous.'
    : eaten === filled ? 'Journée bouclée. Bravo de prendre soin de toi.'
    : kcal >= target * 0.9 ? 'Une journée bien nourrissante, sans pression.'
    : 'Chaque repas compte, même petit. Ajoute une collation si l’envie vient.';
  return html`<div class="card pad-lg" style="margin-top:14px">
    <div class="row" style="gap:16px">
      ${s.profile.showKcal
        ? html`<${Ring} value=${kcal} max=${target}>${kcalFmt(kcal)}<small>kcal env.</small></${Ring}>`
        : html`<${Ring} value=${filled} max=${4}>${filled}/4<small>moments</small></${Ring}>`}
      <div class="grow">
        <div class="eyebrow" style="margin-bottom:2px">${fmtDayLong(date)}</div>
        <div class="small" style="font-weight:600;line-height:1.4">${msg}</div>
        ${s.profile.showKcal && html`<div class="subtle" style="margin-top:6px">Repère souple ~${kcalFmt(target)} kcal · ${Math.round(prot)} g de protéines</div>`}
      </div>
    </div>
  </div>`;
}

/** Ingrédient déjà utilisé par un repas prévu d'ici sa DLC ? Alors inutile d'alerter. */
function plannedBefore(s, ing, dlc) {
  for (let k = 0; k <= 3; k++) {
    const date = addDays(today(), k);
    if (date > dlc) break;
    for (const m of MEAL_KEYS) {
      const slot = s.plan[date]?.[m];
      if (slot?.status === 'planned' && RECIPE[slot.recipeId] && !isSlotPast(date, m)
        && recipeLines(RECIPE[slot.recipeId], slot.swaps).some((l) => l.ing === ing)) return { date, meal: m };
    }
  }
  return null;
}

function Nudges({ s, onOpen }) {
  const urgent = urgentIngs(s).filter((ing) => {
    const lot = s.inventory.filter((x) => x.ing === ing).sort((a, b) => a.dlc.localeCompare(b.dlc))[0];
    return lot && !plannedBefore(s, ing, lot.dlc);
  });
  const items = [];
  // Recettes mises de côté (repas pris dehors / passé)
  for (const d of s.deferred) {
    const r = RECIPE[d.recipeId];
    if (!r) continue;
    const slot = nextFreeSlot(s, r);
    items.push(html`<div class="card tint-slate" key=${d.id}>
      <div class="row">
        <span class="thumb sm" style=${{ background: r.color }}>${r.emoji}</span>
        <div class="grow">
          <div class="eyebrow">À recaser</div>
          <div class="strong small ellipsis">${r.name}</div>
          <div class="subtle">${slot ? `Proposé ${relDay(slot.date).toLowerCase()}, ${MEALS[slot.meal].label.toLowerCase()}` : 'Aucun créneau libre'}</div>
        </div>
        <button class="icon-btn sm plain" aria-label="Ignorer" onClick=${() => dropDeferred(d.id)}><${Icon} name="x" size=${16} /></button>
      </div>
      ${slot && html`<button class="btn dark sm block" style="margin-top:10px" onClick=${() => placeDeferred(d.id, slot)}>Recaser en 1 tap</button>`}
    </div>`);
  }
  // Anti-gaspi doux
  if (urgent.length) {
    const ing = urgent[0];
    const lot = s.inventory.filter((x) => x.ing === ing).sort((a, b) => a.dlc.localeCompare(b.dlc))[0];
    const idea = suggest(s, { n: 8 }).map((x) => x.recipe).find((r) => recipeLines(r).some((l) => l.ing === ing));
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
        <button class="btn outline sm grow" onClick=${() => onOpen(idea.id, slot)}>Voir la recette</button>
        ${slot && html`<button class="btn dark sm grow" onClick=${() => planRecipe(slot.date, slot.meal, idea.id)}>Placer ${relDay(slot.date).toLowerCase()}</button>`}
      </div>`}
    </div>`);
  }
  if (!items.length) return null;
  return html`<div class="stack" style="margin-top:12px">${items}</div>`;
}

function SlotCard({ s, date, meal, onOpenRecipe, onOutside, onPick }) {
  const slot = s.plan[date]?.[meal];
  const r = slot?.recipeId ? RECIPE[slot.recipeId] : null;
  const past = isSlotPast(date, meal);
  const M = MEALS[meal];
  const head = (right) => html`<div class="slot-head">
    <span class="slot-ico">${M.emoji}</span><span class="slot-label grow">${M.label}</span>${right}
  </div>`;

  // Créneau vide
  if (!slot) {
    if (past) {
      return html`<div class="card slot">${head(null)}
        <div class="subtle">Rien de noté, aucun souci.</div>
        <div class="quick-actions" style="grid-template-columns:1fr 1fr 1fr">
          <button class="qa" onClick=${onPick}><${Icon} name="plus" size=${15} />Repas</button>
          <button class="qa out" onClick=${onOutside}><${Icon} name="utensils" size=${15} />Dehors</button>
          <button class="qa skip" onClick=${() => skipSlot(date, meal)}><${Icon} name="cloud" size=${15} />Je passe</button>
        </div>
      </div>`;
    }
    const sugg = suggest(s, { meal, date, n: 2 });
    return html`<div class="card slot">${head(html`<button class="btn soft sm" onClick=${onPick}>Plus d'idées</button>`)}
      ${sugg.map(({ recipe, reasons }) => html`<button class="suggest" onClick=${() => planRecipe(date, meal, recipe.id)}>
        <span class="thumb sm" style=${{ background: recipe.color }}>${recipe.emoji}</span>
        <div class="grow">
          <div class="small strong ellipsis">${recipe.name}</div>
          <div class="row" style="gap:6px;margin-top:2px">
            <span class="subtle xs">${recipe.time} min</span>
            ${reasons.slice(0, 1).map((x) => html`<span class=${`badge ${x.tone}`} style="height:19px;font-size:10.5px">${x.label}</span>`)}
          </div>
        </div>
        <span class="icon-btn sm" style="background:var(--sage-600);color:#fff;border:0"><${Icon} name="plus" size=${16} /></span>
      </button>`)}
      <div class="row" style="margin-top:8px;gap:6px">
        <button class="qa out grow" onClick=${onOutside}><${Icon} name="utensils" size=${15} />Pris dehors</button>
        <button class="qa skip grow" onClick=${() => skipSlot(date, meal)}><${Icon} name="cloud" size=${15} />Je passe</button>
      </div>
    </div>`;
  }

  const k = slotKcal(s, slot);
  const mealRow = r && html`<button class="meal" style="width:100%;text-align:left" onClick=${() => onOpenRecipe(r.id)}>
    <span class="thumb" style=${{ background: r.color }}>${r.emoji}</span>
    <div class="grow">
      <div class="strong" style="line-height:1.25">${r.name}</div>
      <div class="meal-meta">
        <span><${Icon} name="clock" size=${13} />${r.time} min</span>
        ${s.profile.showKcal && html`<span><${Icon} name="flame" size=${13} />${kcalFmt(k.kcal)} kcal</span>`}
        <span>${Math.round(k.prot)} g prot.</span>
        ${Object.keys(slot.swaps || {}).some((x) => slot.swaps[x]) && html`<span><${Icon} name="swap" size=${12} />adapté</span>`}
      </div>
    </div>
    <${Icon} name="chevR" size=${18} class="muted" />
  </button>`;

  if (slot.status === 'outside') {
    const tags = (slot.outside?.tags || []).map((id) => OUTSIDE_TAGS.find((x) => x.id === id)).filter(Boolean);
    return html`<div class="card slot state-outside">${head(html`<button class="btn ghost sm" onClick=${() => resetSlot(date, meal)}>Modifier</button>`)}
      <div class="meal">
        <span class="thumb" style="background:var(--slate-50)">${tags[0]?.emoji || '🍽️'}</span>
        <div class="grow">
          <div class="strong">${tags.length ? tags.map((x) => x.label).join(' + ') : 'Repas pris dehors'}</div>
          ${slot.outside?.note && html`<div class="subtle">${slot.outside.note}</div>`}
        </div>
      </div>
      <div class="status-line"><${Badge} tone="slate"><${Icon} name="utensils" size=${12} />Pris dehors</${Badge}>
        ${s.profile.showKcal && html`<span class="subtle xs">~${kcalFmt(k.kcal)} kcal estimées</span>`}</div>
    </div>`;
  }

  if (slot.status === 'skipped') {
    return html`<div class="card slot state-skipped">${head(html`<button class="btn ghost sm" onClick=${() => resetSlot(date, meal)}>Annuler</button>`)}
      <div class="row">
        <span class="thumb" style="background:var(--lav-50)">🌿</span>
        <div class="grow"><div class="strong">Pas faim, et c’est ok</div><div class="subtle">Tu as écouté ta satiété.</div></div>
      </div>
      <div class="status-line"><${Badge} tone="lav">Écouté ma satiété</${Badge}></div>
    </div>`;
  }

  if (!r) {
    return html`<div class="card slot">${head(null)}<div class="subtle">Recette introuvable.</div>
      <button class="btn ghost sm" onClick=${() => clearSlot(date, meal)}>Libérer</button></div>`;
  }

  if (slot.status === 'eaten') {
    return html`<div class="card slot state-eaten">${head(html`<button class="btn ghost sm" onClick=${() => resetSlot(date, meal)}>Annuler</button>`)}
      ${mealRow}
      <div class="status-line"><${Badge} tone="sage"><${Icon} name="check" size=${12} />Mangé</${Badge}></div>
    </div>`;
  }

  // Prévu
  return html`<div class="card slot">${head(html`<div class="row" style="gap:4px">
      <button class="icon-btn sm plain" aria-label="Changer de recette" onClick=${onPick}><${Icon} name="refresh" size=${16} /></button>
      <button class="icon-btn sm plain" aria-label="Libérer le créneau" onClick=${() => clearSlot(date, meal)}><${Icon} name="x" size=${16} /></button>
    </div>`)}
    ${mealRow}
    <div class="quick-actions">
      <button class="qa eat" onClick=${() => markEaten(date, meal)}><${Icon} name="check" size=${15} />Mangé</button>
      <button class="qa out" onClick=${onOutside}><${Icon} name="utensils" size=${15} />Dehors</button>
      <button class="qa skip" onClick=${() => skipSlot(date, meal)}><${Icon} name="cloud" size=${15} />Je passe</button>
    </div>
  </div>`;
}

function OutsideSheet({ ctx, s, onClose }) {
  const [tags, setTags] = useState([]);
  const [note, setNote] = useState('');
  const open = !!ctx;
  const slot = ctx && s.plan[ctx.date]?.[ctx.meal];
  const planned = slot?.recipeId && slot.status === 'planned' ? RECIPE[slot.recipeId] : null;
  const close = () => { setTags([]); setNote(''); onClose(); };
  const save = () => { markOutside(ctx.date, ctx.meal, { tags, note: note.trim() }); close(); };
  const toggle = (id) => setTags(tags.includes(id) ? tags.filter((x) => x !== id) : [...tags, id]);
  return html`<${Sheet} open=${open} onClose=${close} title="Repas pris dehors"
    subtitle=${ctx ? `${relDay(ctx.date)} · ${MEALS[ctx.meal].label}` : ''}
    footer=${html`<button class="btn primary block lg" onClick=${save}><${Icon} name="check" size=${18} />Enregistrer</button>`}>
    <div class="label">Qu’as-tu mangé ? (facultatif)</div>
    <div class="chips">${OUTSIDE_TAGS.map((t) => html`<${Chip} active=${tags.includes(t.id)} onClick=${() => toggle(t.id)}>${t.emoji} ${t.label}</${Chip}>`)}</div>
    <div style="margin-top:14px">
      <label class="label" for="out-note">Un mot ?</label>
      <input id="out-note" class="field" placeholder="Ex : kebab frites avec Léa" value=${note} onInput=${(e) => setNote(e.currentTarget.value)} />
    </div>
    ${planned && html`<div class="card tint-sage" style="margin-top:14px">
      <div class="row"><span style="font-size:20px">♻️</span>
        <div class="small"><b>${planned.name}</b> sera mis de côté et re-proposé plus tard dans la semaine. Rien ne se perd.</div></div>
    </div>`}
    <p class="subtle" style="margin-top:12px">Manger dehors fait partie de la vie. Aucun calcul strict ici, juste un repère.</p>
  </${Sheet}>`;
}

function PickerSheet({ ctx, s, onClose, onDetails }) {
  const [q, setQ] = useState('');
  if (!ctx) return html`<${Sheet} open=${false} />`;
  const sugg = suggest(s, { meal: ctx.meal, date: ctx.date, n: 4 });
  const norm = (x) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const all = RECIPES.filter((r) => r.meals.includes(ctx.meal) && !isBlocked(r, s.prefs) && (!q || norm(r.name).includes(norm(q))));
  const pick = (id) => { planRecipe(ctx.date, ctx.meal, id); setQ(''); onClose(); };
  const row = (r, reasons = []) => html`<div class="suggest" key=${r.id}>
    <button class="row grow" style="text-align:left;gap:10px" onClick=${() => onDetails(r.id, ctx)}>
      <span class="thumb sm" style=${{ background: r.color }}>${r.emoji}</span>
      <div class="grow" style="min-width:0">
        <div class="small strong ellipsis">${r.name}</div>
        <div class="row" style="gap:6px;margin-top:2px"><span class="subtle xs">${r.time} min</span>
          ${s.profile.showKcal && html`<span class="subtle xs">${kcalFmt(nutrition(recipeLines(r)).kcal)} kcal</span>`}
          ${reasons.slice(0, 1).map((x) => html`<span class=${`badge ${x.tone}`} style="height:19px;font-size:10.5px">${x.label}</span>`)}</div>
      </div>
    </button>
    <button class="icon-btn sm" style="background:var(--sage-600);color:#fff;border:0" aria-label="Choisir" onClick=${() => pick(r.id)}><${Icon} name="plus" size=${16} /></button>
  </div>`;
  return html`<${Sheet} open=${true} onClose=${() => { setQ(''); onClose(); }} title=${`${MEALS[ctx.meal].emoji} ${MEALS[ctx.meal].label}`} subtitle=${relDay(ctx.date)}>
    <div class="label">Suggestions pour toi</div>
    ${sugg.map((x) => row(x.recipe, x.reasons))}
    <div class="search" style="margin:16px 0 10px"><${Icon} name="search" size=${18} />
      <input class="field" placeholder="Chercher une recette" value=${q} onInput=${(e) => setQ(e.currentTarget.value)} /></div>
    ${all.map((r) => row(r))}
  </${Sheet}>`;
}
