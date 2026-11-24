import { html, useState, useMemo } from '../lib/h.js';
import { useStore } from '../store.js';
import { Icon, Chip, Badge, Sheet, KcalGauge, RecipeThumb, PhotoButton, Stepper } from '../components/ui.js';
import { ProductSearch, Thumb } from '../components/ProductSearch.js';
import { RecipeSheet } from '../components/RecipeSheet.js';
import { MEALS, MEAL_KEYS } from '../data/recipes.js';
import { ING, fmtQty } from '../data/ingredients.js';
import { today, addDays, weekStartOf, weekDays, dayShort, dayNum, relDay, dlcInfo, fmtShort } from '../lib/dates.js';
import { confirmAction } from '../lib/confirm.js';
import {
  suggest, slotKcal, recipeLines, nutrition, kcalFmt, compileNeeds, isSlotPast, OUTSIDE_TAGS, urgentIngs,
  isBlocked, nextFreeSlot, getRecipe, allRecipes, targets, dayTotals, norm, slotBudget, fmtPortion, blockReason, slotExtras, extraNutrition, leftoverLotFor, getProduct, productTitle, showNumbers,
} from '../lib/engine.js';
import {
  markEaten, markDayEaten, adjustDayPortions, resetWeekPortions, groupLeftovers, addExtra, removeExtra, dismissNeed, haveProduct, addNeedsToList, markOutside, skipSlot, resetSlot, clearSlot, planRecipe, placeDeferred, dropDeferred, generateList, autofillWeek,
} from '../actions.js';

export function WeekView() {
  const s = useStore();
  const t = today();
  const [monday, setMonday] = useState(weekStartOf(t, s.profile.weekStart ?? 6));
  const days = weekDays(monday);
  const [sel, setSel] = useState(t);
  const selected = days.includes(sel) ? sel : days[0];
  const [recipeOpen, setRecipeOpen] = useState(null);
  const [outside, setOutside] = useState(null);
  const [picker, setPicker] = useState(null);
  const [tools, setTools] = useState(false);
  const [extra, setExtra] = useState(null);
  const [skip, setSkip] = useState(null);
  const [needsOpen, setNeedsOpen] = useState(false);

  const shiftWeek = (n) => { const m = addDays(monday, n * 7); setMonday(m); setSel(weekDays(m).includes(t) ? t : m); };
  const futureDates = days.filter((d) => d >= t);
  const needs = useMemo(() => compileNeeds(s, futureDates), [s, monday]);
  const missing = needs.filter((n) => !s.shoppingList.some((x) => !x.checked && x.productId === n.productId) && (s.needsSkip?.[n.ing] || '') < days[0]);

  return html`<div class="screen">
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
      ${MEAL_KEYS.map((meal) => html`<div key=${selected + meal}>
        <${SlotCard} s=${s} date=${selected} meal=${meal}
          onOpenRecipe=${(id) => setRecipeOpen({ id, slot: { date: selected, meal } })}
          onOutside=${() => setOutside({ date: selected, meal })}
          onPick=${() => setPicker({ date: selected, meal })}
          onSkip=${() => setSkip({ date: selected, meal })} />
        <${ExtrasRow} s=${s} date=${selected} meal=${meal} onAdd=${() => setExtra({ date: selected, meal })} />
      </div>`)}
    </div>

    ${missing.length > 0 && html`<${NeedsBox} s=${s} items=${missing} until=${days[6]} open=${needsOpen} onToggle=${() => setNeedsOpen(!needsOpen)} />`}

    <button type="button" class="btn ghost sm block" style="margin-top:10px" onClick=${() => setTools(true)}><${Icon} name="sliders" size=${15} />Outils de la semaine</button>
    <${WeekTools} open=${tools} days=${days} onClose=${() => setTools(false)} />
    <${ExtraSheet} ctx=${extra} s=${s} onClose=${() => setExtra(null)} />
    <${SkipSheet} ctx=${skip} onClose=${() => setSkip(null)} />
    <${RecipeSheet} recipeId=${recipeOpen?.id} target=${recipeOpen?.target} slot=${recipeOpen?.slot} onClose=${() => setRecipeOpen(null)} />
    <${OutsideSheet} ctx=${outside} s=${s} onClose=${() => setOutside(null)} />
    <${PickerSheet} ctx=${picker} s=${s} onClose=${() => setPicker(null)} onDetails=${(id, target) => { setPicker(null); setRecipeOpen({ id, target }); }} />
  </div>`;
}

function ExtrasRow({ s, date, meal, onAdd }) {
  const list = slotExtras(s, date, meal);
  return html`<div class="extras-row">
    ${list.map((x) => html`<span class="chip sm extra-chip" key=${x.id}>${x.name}${showNumbers(s) ? ` · ${kcalFmt(extraNutrition(s, x).kcal)} kcal` : ''}
      <button type="button" class="x" aria-label=${`Retirer ${x.name}`} onClick=${() => removeExtra(date, meal, x.id)}><${Icon} name="x" size=${12} /></button></span>`)}
    <button type="button" class="extra-add" onClick=${onAdd}><${Icon} name="plus" size=${13} />J’ai mangé en plus</button>
  </div>`;
}

function ExtraSheet({ ctx, s, onClose }) {
  const [pid, setPid] = useState(null);
  const [qty, setQty] = useState(null);
  const close = () => { setPid(null); setQty(null); onClose(); };
  if (!ctx) return html`<${Sheet} open=${false} />`;
  const p = pid && getProduct(s, pid);
  const unit = p ? (p.unit || ING[p.ing]?.unit || 'pc') : 'pc';
  const def = p ? (unit === 'pc' ? 1 : p.size && p.size <= 250 ? p.size : ING[p.ing]?.portion || (unit === 'ml' ? 250 : 50)) : 1;
  const q = qty ?? def;
  const item = p && { productId: p.id, ing: p.ing || null, name: productTitle(p), qty: q, unit, ...(p.nutri ? { nutri: p.nutri } : {}) };
  const k = item ? extraNutrition(s, item) : null;
  const save = () => { addExtra(ctx.date, ctx.meal, item); close(); };
  return html`<${Sheet} open=${true} onClose=${close} title="J’ai mangé en plus" subtitle=${`${relDay(ctx.date)} · ${MEALS[ctx.meal].label}`} tall=${!p}
    footer=${p ? html`<div class="row"><button type="button" class="btn ghost" onClick=${() => { setPid(null); setQty(null); }}>Retour</button>
      <button type="button" class="btn primary grow" onClick=${save}><${Icon} name="check" size=${18} />Ajouter</button></div>` : null}>
    ${!p && html`<${ProductSearch} s=${s} onPick=${(id) => { setPid(id); setQty(null); }} placeholder="Chips, chocolat, pain…" />`}
    ${p && html`<div>
      <div class="card flat row" style="gap:12px">
        <${Thumb} p=${p} cls="thumb sm stock-thumb" />
        <div class="grow strong clamp2">${productTitle(p)}</div>
      </div>
      <div class="card flat row between" style="margin-top:12px"><b class="small">Quantité</b>
        <${Stepper} value=${q} min=${unit === 'pc' ? 0.5 : 5} step=${unit === 'pc' ? 0.5 : unit === 'ml' ? 50 : 10} onChange=${setQty} format=${(v) => fmtQty(v, unit, p.ing)} /></div>
      <p class="subtle" style="margin:10px 2px 0">${!showNumbers(s) ? 'Compté dans ta journée.' : k && k.kcal > 0 ? `${kcalFmt(k.kcal)} kcal, compté dans ta journée.` : 'Valeurs nutritionnelles inconnues : scanne le produit pour les avoir.'}</p>
    </div>`}
  </${Sheet}>`;
}

const SKIP_TAGS = [['faim', 'Pas faim'], ['temps', 'Pas le temps'], ['tot', 'Mangé plus tôt'], ['envie', 'Pas envie']];

function SkipSheet({ ctx, onClose }) {
  const [tags, setTags] = useState([]);
  const [note, setNote] = useState('');
  const close = () => { setTags([]); setNote(''); onClose(); };
  if (!ctx) return html`<${Sheet} open=${false} />`;
  const save = () => { skipSlot(ctx.date, ctx.meal, { tags, note: note.trim().slice(0, 80) }); close(); };
  const toggle = (id) => setTags(tags.includes(id) ? tags.filter((x) => x !== id) : [...tags, id]);
  return html`<${Sheet} open=${true} onClose=${close} title="Je passe ce repas" subtitle=${`${relDay(ctx.date)} · ${MEALS[ctx.meal].label}`}
    footer=${html`<button type="button" class="btn primary block lg" onClick=${save}><${Icon} name="check" size=${18} />Enregistrer</button>`}>
    <div class="label">Tu veux préciser ? (facultatif)</div>
    <div class="chips">${SKIP_TAGS.map(([id, l]) => html`<${Chip} active=${tags.includes(id)} onClick=${() => toggle(id)}>${l}</${Chip}>`)}</div>
    <div style="margin-top:14px"><label class="label" for="skip-note">Un mot ?</label>
      <input id="skip-note" class="field" maxlength="80" placeholder="Ex : grosse collation à 16 h" value=${note} onInput=${(e) => setNote(e.currentTarget.value)} /></div>
  </${Sheet}>`;
}

// Produits à acheter pour les repas prévus : à cocher un par un, ou « je l'ai déjà »
function NeedsBox({ s, items, until, open, onToggle }) {
  const [off, setOff] = useState({});
  const [have, setHave] = useState(null);
  const chosen = items.filter((n) => !off[n.productId]);
  return html`<div class="card flat" style="margin-top:14px;padding:0;overflow:hidden">
    <button type="button" class="row between" style="width:100%;padding:12px 14px" onClick=${onToggle}>
      <span class="row" style="gap:8px"><${Icon} name="cart" size=${16} /><span class="small strong">${items.length} produit${items.length > 1 ? 's' : ''} à acheter pour tes repas</span></span>
      <${Icon} name=${open ? 'chevU' : 'chevD'} size=${16} /></button>
    ${open && html`<div>
      <div class="subtle xs" style="padding:0 14px 6px">Ton stock compte déjà les équivalents (lait demi-écrémé pour du lait entier, beurre demi-sel pour du beurre doux…).</div>
      ${items.map((n) => { const ing = ING[n.ing]; const p = getProduct(s, n.productId); return html`<div class="list-item" key=${n.productId} style="min-height:56px;flex-wrap:wrap;row-gap:8px;padding-bottom:12px">
        <button type="button" class=${`check ${off[n.productId] ? '' : 'on'}`} aria-label="Ajouter à la liste" onClick=${() => setOff({ ...off, [n.productId]: !off[n.productId] })}><${Icon} name="check" size=${16} stroke=${3} /></button>
        <div class="grow" style="min-width:0"><div class="small strong clamp2">${ing?.emoji || '🛒'} ${p ? productTitle(p) : ing?.name}</div>
          <div class="subtle xs">${n.missing ? `Il manque ${fmtQty(n.missing, ing.unit, n.ing)}` : 'À avoir sous la main'}</div></div>
        <div class="row" style="gap:6px;width:100%;padding-left:44px;margin-top:-4px">
          <button type="button" class="btn ghost sm" onClick=${() => setHave(n)}>Je l’ai</button>
          <button type="button" class="btn ghost sm" onClick=${() => dismissNeed(n.ing, until)}>Pas besoin</button>
        </div>
      </div>`; })}
      <div style="padding:10px 14px 14px"><button type="button" class="btn primary block" disabled=${!chosen.length} onClick=${() => { addNeedsToList(chosen); setOff({}); onToggle(); }}>
        <${Icon} name="cart" size=${17} />Ajouter ${chosen.length} produit${chosen.length > 1 ? 's' : ''} à ma liste</button></div>
    </div>`}
    <${HaveSheet} s=${s} need=${have} until=${until} onClose=${() => setHave(null)} />
  </div>`;
}

// « Je l'ai » : on choisit le produit qu'on a vraiment, même sous une autre forme
function HaveSheet({ s, need, until, onClose }) {
  if (!need) return html`<${Sheet} open=${false} />`;
  const ing = ING[need.ing];
  const q = ing.name.split(/[ ,]/)[0];
  return html`<${Sheet} open=${true} onClose=${onClose} title=${`Tu as déjà : ${ing.name.toLowerCase()} ?`} tall
    footer=${html`<button type="button" class="btn ghost block" onClick=${() => { dismissNeed(need.ing, until); onClose(); }}>Je n’en ai pas besoin cette semaine</button>`}>
    <p class="subtle" style="margin:0 2px 10px">Choisis ce que tu as vraiment, même sous une autre forme : il est rangé dans ton stock et n’est plus proposé à l’achat cette semaine.</p>
    <${ProductSearch} s=${s} initial=${q} autoFocus=${false} onPick=${(id) => { haveProduct(id, need.ing, until); onClose(); }} placeholder="Lait, beurre, pain…" />
  </${Sheet}>`;
}

function WeekTools({ open, days, onClose }) {
  const run = async (fn, title, message, confirm) => {
    if (await confirmAction({ title, message, confirm })) { fn(days); onClose(); }
  };
  return html`<${Sheet} open=${open} onClose=${onClose} title="Outils de la semaine" subtitle=${`Du ${fmtShort(days[0])} au ${fmtShort(days[6])}`}>
    <button type="button" class="card tappable" style="width:100%;text-align:left" onClick=${() => run(groupLeftovers, 'Regrouper en restes ?', 'Quand deux repas de suite utilisent la même barquette (poulet, jambon, viande hachée…), le second devient le même plat : soir puis midi du lendemain. Sauvegarde automatique avant.', 'Regrouper')}>
      <div class="strong small">♻️ Regrouper les plats en restes</div>
      <div class="subtle xs" style="margin-top:2px">Une barquette ouverte se cuit d’un coup : tu manges le même plat deux fois au lieu de deux plats différents.</div>
    </button>
    <button type="button" class="card tappable" style="width:100%;text-align:left;margin-top:10px" onClick=${() => run(resetWeekPortions, 'Toutes les portions à 1 ?', 'Les repas prévus de la semaine repassent à une portion normale. Sauvegarde automatique avant.', 'Tout à 1 portion')}>
      <div class="strong small">🍽️ Remettre toutes les portions à 1</div>
      <div class="subtle xs" style="margin-top:2px">Plus de « +25 % » : tu ajustes toi-même un repas si tu veux.</div>
    </button>
  </${Sheet}>`;
}

function DaySummary({ s, date }) {
  const tg = targets(s.profile);
  const { eaten, planned, protEaten, protPlanned } = dayTotals(s, date);
  return html`<div class="card pad-lg" style="margin-top:14px">
    <${KcalGauge} eaten=${eaten} planned=${planned} target=${tg.kcal} hideNumbers=${!showNumbers(s)} />
    ${planned < tg.kcal - 50 && MEAL_KEYS.some((m) => s.plan[date]?.[m]?.status === 'planned' && !isSlotPast(date, m)) && html`<button type="button" class="btn soft sm block" style="margin-top:12px" onClick=${() => adjustDayPortions(date, tg.kcal)}>
      <${Icon} name="sparkles" size=${15} />${showNumbers(s) ? `Ajuster les portions pour atteindre ${kcalFmt(tg.kcal)} kcal` : 'Ajuster les portions pour compléter ma journée'}</button>`}
    ${showNumbers(s) && html`<div class="prot-line"><span>Protéines</span><b class="num">${Math.round(protEaten)} g</b></div>`}
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
        <${RecipeThumb} r=${r} cls="thumb sm" />
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

function SlotCard({ s, date, meal, onOpenRecipe, onOutside, onPick, onSkip }) {
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
          <button type="button" class="qa skip" onClick=${onSkip}><${Icon} name="cloud" size=${15} />Je passe</button>
        </div>
      </div>`;
    }
    const sugg = suggest(s, { meal, date, n: 2 });
    return html`<div class="card slot">${head(html`<button type="button" class="btn soft sm" onClick=${onPick}>Plus d'idées</button>`)}
      ${sugg.map(({ recipe, reasons, kcal, servings }) => html`<button type="button" class="suggest" onClick=${() => planRecipe(date, meal, recipe.id, {}, servings)}>
        <${RecipeThumb} r=${recipe} cls="thumb sm" />
        <div class="grow" style="min-width:0">
          <div class="small strong clamp2">${recipe.name}</div>
          <div class="row" style="gap:6px;margin-top:2px">
            <span class="subtle xs">${recipe.time} min${showNumbers(s) ? ` · ${kcalFmt(kcal)} kcal` : ''}${servings !== 1 ? ` · ${fmtPortion(servings)}` : ''}</span>
            ${reasons.slice(0, 1).map((x) => html`<span class=${`badge ${x.tone} xs`}>${x.label}</span>`)}
          </div>
        </div>
        <span class="icon-btn sm add"><${Icon} name="plus" size=${16} /></span>
      </button>`)}
      <div class="row" style="margin-top:8px;gap:6px">
        <button type="button" class="qa out grow" onClick=${onOutside}><${Icon} name="utensils" size=${15} />Pris dehors</button>
        <button type="button" class="qa skip grow" onClick=${onSkip}><${Icon} name="cloud" size=${15} />Je passe</button>
      </div>
    </div>`;
  }

  const k = slotKcal(s, slot);
  const mealRow = r && html`<button type="button" class="meal" onClick=${() => onOpenRecipe(r.id)}>
    <${RecipeThumb} r=${r} />
    <div class="grow" style="min-width:0">
      <div class="strong clamp2" style="line-height:1.25">${slot.leftover ? `Reste de ${r.name.charAt(0).toLowerCase()}${r.name.slice(1)}` : r.name}</div>
      <div class="meal-meta">
        ${slot.leftover ? html`<span>♻️ ${leftoverLotFor(s, date, meal) ? 'au frigo' : 'cuit avec le plat d’avant'}</span>` : html`<span><${Icon} name="clock" size=${13} />${r.time} min</span>`}
        ${showNumbers(s) && html`<span><${Icon} name="flame" size=${13} />${kcalFmt(k.kcal)} kcal</span>
        <span>${Math.round(k.prot)} g prot.</span>`}
        ${slot.servings && slot.servings !== 1 && html`<span>${fmtPortion(slot.servings)}</span>`}
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
          <div class="subtle">${showNumbers(s) ? `${slot.outside?.note ? `${slot.outside.note} · ` : ''}~${kcalFmt(k.kcal)} kcal` : slot.outside?.note || ''}</div>
        </div>
      </div>
    </div>`;
  }

  if (slot.status === 'skipped') {
    return html`<div class="card slot state-skipped">${head(html`<button type="button" class="btn ghost sm" onClick=${() => resetSlot(date, meal)}>Annuler</button>`)}
      <div class="subtle">Repas passé${slot.skip ? ` · ${[...(slot.skip.tags || []).map((id) => SKIP_TAGS.find((x) => x[0] === id)?.[1]).filter(Boolean), slot.skip.note].filter(Boolean).join(' · ')}` : ''}</div>
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
      <${PhotoButton} recipeId=${r.id} iconOnly label="Prendre le plat en photo" />
      <button type="button" class="icon-btn sm plain" aria-label="Changer de recette" onClick=${onPick}><${Icon} name="swap" size=${16} /></button>
      <button type="button" class="icon-btn sm plain" aria-label="Libérer le créneau" onClick=${() => clearSlot(date, meal)}><${Icon} name="x" size=${16} /></button>
    </div>`)}
    ${mealRow}
    <div class="quick-actions">
      <button type="button" class="qa eat" onClick=${() => markEaten(date, meal)}><${Icon} name="check" size=${15} />Mangé</button>
      <button type="button" class="qa out" onClick=${onOutside}><${Icon} name="utensils" size=${15} />Dehors</button>
      <button type="button" class="qa skip" onClick=${onSkip}><${Icon} name="cloud" size=${15} />Je passe</button>
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
  const weekStart = weekStartOf(ctx.date, s.profile.weekStart ?? 6);
  const inWeek = [...new Set(weekDays(weekStart).flatMap((d) => MEAL_KEYS.map((m) => s.plan[d]?.[m]?.recipeId)).filter(Boolean))]
    .map((id) => getRecipe(s, id)).filter((r) => r && (!nq || norm(r.name).includes(nq)) && r.id !== s.plan[ctx.date]?.[ctx.meal]?.recipeId);
  const masked = nq ? allRecipes(s).filter((r) => norm(r.name).includes(nq) && isBlocked(s, r) && !inWeek.includes(r)) : [];
  const pick = (id, servings = 1) => { planRecipe(ctx.date, ctx.meal, id, {}, servings); setQ(''); onClose(); };
  const row = (r, reasons = [], servings = 1) => html`<div class="suggest" key=${r.id}>
    <button type="button" class="row grow" style="text-align:left;gap:10px;min-width:0" onClick=${() => onDetails(r.id, ctx)}>
      <${RecipeThumb} r=${r} cls="thumb sm" />
      <div class="grow" style="min-width:0">
        <div class="small strong clamp2">${r.name}</div>
        <div class="row" style="gap:6px;margin-top:2px"><span class="subtle xs">${r.time} min${showNumbers(s) ? ` · ${kcalFmt(nutrition(recipeLines(r, {}, servings), s).kcal)} kcal` : ''}${servings !== 1 ? ` · ${fmtPortion(servings)}` : ''}</span>
          ${reasons.slice(0, 1).map((x) => html`<span class=${`badge ${x.tone} xs`}>${x.label}</span>`)}</div>
      </div>
    </button>
    <button type="button" class="icon-btn sm add" aria-label="Choisir" onClick=${() => pick(r.id, servings)}><${Icon} name="plus" size=${16} /></button>
  </div>`;
  const { remaining } = slotBudget(s, ctx.date, ctx.meal);
  return html`<${Sheet} open=${true} onClose=${() => { setQ(''); onClose(); }} title=${`${MEALS[ctx.meal].emoji} ${MEALS[ctx.meal].label}`} subtitle=${`${relDay(ctx.date)} · reste ~${kcalFmt(remaining)} kcal pour atteindre l'objectif`}>
    ${inWeek.length > 0 && html`<div class="label">Déjà dans ta semaine</div>${inWeek.map((r) => row(r))}`}
    ${!nq && html`<div class="label" style="margin-top:12px">Suggestions pour atteindre ton objectif</div>${sugg.map((x) => row(x.recipe, x.reasons, x.servings))}`}
    <div class="search" style="margin:16px 0 10px"><${Icon} name="search" size=${18} />
      <input class="field" type="search" placeholder="Chercher une recette" value=${q} onInput=${(e) => setQ(e.currentTarget.value)} /></div>
    ${all.map((r) => row(r))}
    ${masked.length > 0 && html`<div class="label" style="margin-top:12px">Masquées par tes réglages</div>
      ${masked.map((r) => html`<div key=${r.id}>${row(r)}<div class="subtle xs" style="margin:-4px 0 8px 62px">${blockReason(s, r).label}</div></div>`)}`}
  </${Sheet}>`;
}
