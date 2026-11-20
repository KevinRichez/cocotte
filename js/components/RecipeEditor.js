import { html, useState, useEffect } from '../lib/h.js';
import { Sheet, Chip, Icon, Stepper } from './ui.js';
import { useStore } from '../store.js';
import { EQUIPMENT, MEALS, MEAL_KEYS, COOKING_EQUIPMENT } from '../data/recipes.js';
import { ING, fmtQty } from '../data/ingredients.js';
import { searchIngredients, nutrition, kcalFmt } from '../lib/engine.js';
import { saveRecipe } from '../actions.js';
import { toast } from '../lib/toast.js';

const EMOJIS = ['🍝', '🍛', '🥘', '🍲', '🥗', '🍳', '🥩', '🍗', '🐟', '🌯', '🍔', '🍕', '🥪', '🥣', '🥞', '🍰', '🍪', '🍫', '🍌', '🥑'];
const COLORS = ['#F6E9D7', '#F4DED6', '#E3EDD5', '#DDEBF1', '#EDE3F1', '#F7E3BF', '#F8DCD3', '#EAF0E2'];

const stepFor = (ing) => (ing.unit === 'pc' ? 0.5 : ing.unit === 'ml' ? 25 : 10);
const defaultQty = (ing) => ing.portion || (ing.unit === 'pc' ? 1 : ing.staple ? 2 : 100);

export function RecipeEditor({ open, recipe, onClose, onSaved }) {
  const s = useStore();
  const [f, setF] = useState(null);
  const [q, setQ] = useState('');
  useEffect(() => {
    if (!open) return;
    setQ('');
    setF(recipe ? { ...recipe, steps: (recipe.steps || []).join('\n'), ingredients: recipe.ingredients.map((x) => ({ ...x })) }
      : { name: '', emoji: '🍲', color: COLORS[0], time: 15, meals: ['dej', 'diner'], equipment: [], ingredients: [], steps: '' });
  }, [open]);
  if (!open || !f) return html`<${Sheet} open=${false} />`;
  const set = (patch) => setF({ ...f, ...patch });
  const toggle = (key, v) => set({ [key]: f[key].includes(v) ? f[key].filter((x) => x !== v) : [...f[key], v] });
  const results = q.trim() ? searchIngredients(q, { limit: 8 }).filter((i) => !f.ingredients.some((x) => x.ing === i.id)) : [];
  const addIng = (ing) => { set({ ingredients: [...f.ingredients, { ing: ing.id, qty: defaultQty(ing) }] }); setQ(''); };
  const setQty = (k, qty) => set({ ingredients: qty <= 0 ? f.ingredients.filter((_, i) => i !== k) : f.ingredients.map((x, i) => (i === k ? { ...x, qty } : x)) });
  const kcal = nutrition(f.ingredients.filter((x) => ING[x.ing])).kcal;

  const save = () => {
    const name = f.name.trim().slice(0, 70);
    if (!name) { toast('Donne un nom à ta recette'); return; }
    if (!f.ingredients.length) { toast('Ajoute au moins un ingrédient'); return; }
    if (!f.meals.length) { toast('Choisis au moins un moment'); return; }
    const id = saveRecipe({
      id: recipe?.id, name, emoji: f.emoji, color: f.color, time: Math.max(1, Math.min(240, Math.round(f.time))),
      meals: f.meals, equipment: f.equipment.length ? f.equipment : ['aucun'], ingredients: f.ingredients,
      steps: f.steps.split('\n').map((x) => x.trim().slice(0, 240)).filter(Boolean).slice(0, 20),
    });
    onSaved?.(id);
    onClose();
  };

  return html`<${Sheet} open=${true} onClose=${onClose} title=${recipe ? 'Modifier la recette' : 'Nouvelle recette'} subtitle=${f.ingredients.length ? `${kcalFmt(kcal)} kcal par portion` : 'Quantités pour 1 portion'}
    footer=${html`<button type="button" class="btn primary block lg" onClick=${save}><${Icon} name="check" size=${18} />Enregistrer</button>`}>
    <label class="label" for="re-name">Nom</label>
    <input id="re-name" class="field" maxlength="70" placeholder="Ex : Bowl poulet teriyaki" value=${f.name} onInput=${(e) => set({ name: e.currentTarget.value })} />

    <div class="label" style="margin-top:14px">Icône</div>
    <div class="emoji-grid">${EMOJIS.map((em) => html`<button type="button" class=${`emoji-btn ${f.emoji === em ? 'on' : ''}`} style=${{ background: f.emoji === em ? f.color : '' }} onClick=${() => set({ emoji: em })}>${em}</button>`)}</div>
    <div class="row" style="gap:8px;margin-top:8px">${COLORS.map((c) => html`<button type="button" class=${`color-dot ${f.color === c ? 'on' : ''}`} style=${{ background: c }} aria-label="Couleur" onClick=${() => set({ color: c })}></button>`)}</div>

    <div class="row between" style="margin-top:14px"><span class="label" style="margin:0">Temps</span>
      <${Stepper} value=${f.time} min=${1} max=${240} step=${5} onChange=${(v) => set({ time: v })} format=${(v) => `${v} min`} /></div>

    <div class="label" style="margin-top:14px">Moments</div>
    <div class="chips">${MEAL_KEYS.map((m) => html`<${Chip} sm active=${f.meals.includes(m)} onClick=${() => toggle('meals', m)}>${MEALS[m].emoji} ${MEALS[m].label}</${Chip}>`)}</div>

    <div class="label" style="margin-top:14px">Matériel</div>
    <div class="chips">${COOKING_EQUIPMENT.filter((k) => k !== 'congelateur').map((k) => html`<${Chip} sm active=${f.equipment.includes(k)} onClick=${() => toggle('equipment', k)}>${EQUIPMENT[k].emoji} ${EQUIPMENT[k].label}</${Chip}>`)}</div>

    <div class="label" style="margin-top:14px">Ingrédients</div>
    ${f.ingredients.length > 0 && html`<div class="list" style="margin-bottom:10px">${f.ingredients.map((x, k) => {
      const ing = ING[x.ing];
      if (!ing) return null;
      return html`<div class="list-item" key=${x.ing}>
        <span class="thumb sm" style="background:var(--surface-2)">${ing.emoji}</span>
        <div class="grow small strong" style="min-width:0">${ing.name}</div>
        <${Stepper} value=${x.qty} min=${0} step=${stepFor(ing)} onChange=${(v) => setQty(k, v)} format=${(v) => fmtQty(v, ing.unit, x.ing)} />
      </div>`;
    })}</div>`}
    <div class="search"><${Icon} name="plus" size=${18} />
      <input class="field" type="search" placeholder="Ajouter un ingrédient" value=${q} onInput=${(e) => setQ(e.currentTarget.value)} /></div>
    ${results.length > 0 && html`<div class="pick-list" style="margin-top:6px">${results.map((i) => html`<button type="button" class="pick-row" onClick=${() => addIng(i)}>
      <span class="pick-emoji">${i.emoji}</span><span class="pick-main"><span class="pick-name">${i.name}</span></span><${Icon} name="plus" size=${16} /></button>`)}</div>`}

    <label class="label" for="re-steps" style="margin-top:14px">Étapes (une par ligne)</label>
    <textarea id="re-steps" class="field steps-input" rows="5" maxlength="3000" placeholder=${'Cuire les pâtes.\nDorer le poulet…'} value=${f.steps} onInput=${(e) => set({ steps: e.currentTarget.value })}></textarea>
  </${Sheet}>`;
}
