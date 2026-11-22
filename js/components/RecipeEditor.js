import { html, useState, useEffect } from '../lib/h.js';
import { Sheet, Chip, Icon, Stepper } from './ui.js';
import { useStore } from '../store.js';
import { EQUIPMENT, MEALS, MEAL_KEYS, COOKING_EQUIPMENT } from '../data/recipes.js';
import { ING, fmtQty } from '../data/ingredients.js';
import { searchIngredients, nutrition, kcalFmt, getProduct, productTitle, cleanName, photoFor, norm } from '../lib/engine.js';
import { saveRecipe, useProductForIng } from '../actions.js';
import { ProductSearch, ScanSheet } from './ProductSearch.js';
import { saveCustomProduct } from '../actions.js';
import { toast } from '../lib/toast.js';

const EMOJIS = ['🍝', '🍛', '🥘', '🍲', '🥗', '🍳', '🥩', '🍗', '🍖', '🥓', '🐟', '🍣', '🦐', '🌯', '🌮', '🥙', '🍔', '🍟', '🍕', '🥪', '🌭', '🥟', '🍜', '🍚', '🥔', '🍠', '🥦', '🥕', '🍅', '🫑', '🍄', '🧀', '🥚', '🥣', '🥞', '🧇', '🥐', '🍞', '🥯', '🍰', '🧁', '🍪', '🍫', '🍮', '🍦', '🍌', '🍎', '🍓', '🫐', '🥑', '🥜', '🥛', '☕', '🥤', '🧃', '🌶️', '🫘', '🥥', '🍯', '🔥'];
const firstGrapheme = (v) => {
  const t = (v || '').trim();
  if (!t) return '';
  try { return [...new Intl.Segmenter('fr', { granularity: 'grapheme' }).segment(t)].pop()?.segment || ''; } catch { return [...t].slice(-2).join(''); }
};
const COLORS = ['#F6E9D7', '#F4DED6', '#E3EDD5', '#DDEBF1', '#EDE3F1', '#F7E3BF', '#F8DCD3', '#EAF0E2'];

const stepFor = (ing) => (ing.unit === 'pc' ? 0.5 : ing.unit === 'ml' ? 25 : 10);
const defaultQty = (ing) => ing.portion || (ing.unit === 'pc' ? 1 : ing.staple ? 2 : 100);

export function RecipeEditor({ open, recipe, onClose, onSaved }) {
  const s = useStore();
  const [f, setF] = useState(null);
  const [q, setQ] = useState('');
  const [picking, setPicking] = useState(null); // { index } pour remplacer, { index: -1 } pour ajouter
  const [pq, setPq] = useState('');
  const [more, setMore] = useState(false);
  const [scan, setScan] = useState(false);
  useEffect(() => {
    if (!open) return;
    setQ(''); setPicking(null); setPq(''); setMore(false);
    setF(recipe ? { ...recipe, prep: recipe.prep ?? recipe.time, cook: recipe.cook ?? 0, steps: (recipe.steps || []).join('\n'), ingredients: recipe.ingredients.map((x) => ({ ...x })), equipment: recipe.equipment.filter((e) => e !== 'aucun') }
      : { name: '', emoji: '🍲', color: COLORS[0], prep: 10, cook: 10, meals: ['dej', 'diner'], equipment: [], ingredients: [], steps: '' });
  }, [open]);
  if (!open || !f) return html`<${Sheet} open=${false} />`;
  const set = (patch) => setF((cur) => ({ ...cur, ...patch }));
  const toggle = (key, v) => set({ [key]: f[key].includes(v) ? f[key].filter((x) => x !== v) : [...f[key], v] });
  const results = q.trim() ? searchIngredients(q, { limit: 8 }).filter((i) => !f.ingredients.some((x) => x.ing === i.id)) : [];
  const addIng = (ing) => { set({ ingredients: [...f.ingredients, { ing: ing.id, qty: defaultQty(ing) }] }); setQ(''); };
  const setQty = (k, qty) => set({ ingredients: qty <= 0 ? f.ingredients.filter((_, i) => i !== k) : f.ingredients.map((x, i) => (i === k ? { ...x, qty } : x)) });
  const kcal = nutrition(f.ingredients.filter((x) => ING[x.ing])).kcal;
  // Choix d'un produit (stock, recherche ou scan) pour un ingrédient
  const pickProduct = (productId) => {
    const p = getProduct(s, productId);
    const k = picking?.index ?? -1;
    const rowIng = k >= 0 ? f.ingredients[k].ing : null;
    const ingId = p?.ing && ING[p.ing] ? p.ing : rowIng;
    if (!ingId) { toast('Ce produit n’est relié à aucun aliment : relie-le depuis ton stock'); return; }
    const ing = ING[ingId];
    if (k >= 0) set({ ingredients: f.ingredients.map((x, i) => (i === k ? { ing: ingId, qty: x.ing === ingId || ING[x.ing]?.unit === ing.unit ? x.qty : defaultQty(ing), productId } : x)) });
    else set({ ingredients: [...f.ingredients.filter((x) => x.ing !== ingId), { ing: ingId, qty: defaultQty(ing), productId }] });
    setPicking(null); setPq(''); setMore(false);
  };
  const pickIng = (ingId) => {
    const k = picking?.index ?? -1;
    const ing = ING[ingId];
    if (k >= 0) set({ ingredients: f.ingredients.map((y, i) => (i === k ? { ing: ingId, qty: ING[y.ing]?.unit === ing.unit ? y.qty : defaultQty(ing) } : y)) });
    else set({ ingredients: [...f.ingredients.filter((y) => y.ing !== ingId), { ing: ingId, qty: defaultQty(ing) }] });
    setPicking(null); setPq(''); setMore(false);
  };
  const npq = norm(pq);
  const stockRows = [...new Map(s.inventory.map((x) => [x.productId || x.ing || x.id, x])).values()]
    .filter((x) => !npq || norm(`${x.name} ${ING[x.ing]?.name || ''}`).includes(npq));
  const ingRows = npq.length >= 2 ? searchIngredients(pq, { limit: 8 }) : [];

  const save = () => {
    const name = f.name.trim().slice(0, 70);
    if (!name) { toast('Donne un nom à ta recette'); return; }
    if (!f.ingredients.length) { toast('Ajoute au moins un ingrédient'); return; }
    if (!f.meals.length) { toast('Choisis au moins un moment'); return; }
    for (const x of f.ingredients) if (x.productId) useProductForIng(x.productId, x.ing);
    const id = saveRecipe({
      id: recipe?.id, name, emoji: f.emoji || '🍲', color: f.color, prep: Math.round(f.prep), cook: Math.round(f.cook), time: Math.max(1, Math.min(480, Math.round(f.prep + f.cook))),
      meals: f.meals, equipment: f.equipment.length ? f.equipment : ['aucun'], ingredients: f.ingredients.map(({ productId, ...x }) => x),
      steps: f.steps.split('\n').map((x) => x.trim().slice(0, 240)).filter(Boolean).slice(0, 20),
    });
    onSaved?.(id);
    onClose();
  };

  return html`<${Sheet} open=${true} onClose=${onClose} title=${recipe ? 'Modifier la recette' : 'Nouvelle recette'} subtitle=${f.ingredients.length ? `${kcalFmt(kcal)} kcal par portion` : 'Quantités pour 1 portion'}
    footer=${html`<button type="button" class="btn primary block lg" onClick=${save}><${Icon} name="check" size=${18} />Enregistrer</button>`}>
    <p class="subtle xs" style="margin:0 2px 10px"><span class="req">*</span> champs obligatoires</p>
    <label class="label" for="re-name">Nom <span class="req">*</span></label>
    <input id="re-name" class="field" maxlength="70" required placeholder="Ex : Bowl poulet teriyaki" value=${f.name} onInput=${(e) => set({ name: e.currentTarget.value })} />

    <div class="label" style="margin-top:14px">Icône</div>
    <div class="row" style="gap:10px;margin-bottom:10px">
      <span class="emoji-preview" style=${{ background: f.color }}>${f.emoji || '🍲'}</span>
      <div class="grow"><label class="label" for="re-emoji" style="margin-bottom:4px">Ou tape un emoji avec ton clavier</label>
        <input id="re-emoji" class="field" style="height:42px" inputmode="text" placeholder="😋" value="" onInput=${(e) => { const g = firstGrapheme(e.currentTarget.value); if (g && /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(g)) set({ emoji: g }); e.currentTarget.value = ''; }} /></div>
    </div>
    <div class="emoji-grid">${EMOJIS.map((em) => html`<button type="button" class=${`emoji-btn ${f.emoji === em ? 'on' : ''}`} onClick=${() => set({ emoji: em })}>${em}</button>`)}</div>
    <div class="row" style="gap:8px;margin-top:10px">${COLORS.map((c) => html`<button type="button" class=${`color-dot ${f.color === c ? 'on' : ''}`} style=${{ background: c }} aria-label="Couleur" onClick=${() => set({ color: c })}></button>`)}</div>

    <div class="card flat" style="margin-top:14px">
      <div class="row between"><b class="small">Préparation</b>
        <${Stepper} value=${f.prep} min=${0} max=${240} step=${5} onChange=${(v) => set({ prep: v })} format=${(v) => `${v} min`} /></div>
      <div class="hr"></div>
      <div class="row between"><b class="small">Cuisson</b>
        <${Stepper} value=${f.cook} min=${0} max=${240} step=${5} onChange=${(v) => set({ cook: v })} format=${(v) => `${v} min`} /></div>
    </div>

    <div class="label" style="margin-top:14px">Moments <span class="req">*</span></div>
    <div class="chips">${MEAL_KEYS.map((m) => html`<${Chip} sm active=${f.meals.includes(m)} onClick=${() => toggle('meals', m)}>${MEALS[m].emoji} ${MEALS[m].label}</${Chip}>`)}</div>

    <div class="label" style="margin-top:14px">Matériel</div>
    <div class="chips">${COOKING_EQUIPMENT.filter((k) => k !== 'congelateur').map((k) => html`<${Chip} sm active=${f.equipment.includes(k)} onClick=${() => toggle('equipment', k)}>${EQUIPMENT[k].emoji} ${EQUIPMENT[k].label}</${Chip}>`)}</div>

    <div class="label" style="margin-top:14px">Ingrédients <span class="req">*</span></div>
    ${f.ingredients.length > 0 && html`<div class="list" style="margin-bottom:10px">${f.ingredients.map((x, k) => {
      const ing = ING[x.ing];
      if (!ing) return null;
      const prod = x.productId && getProduct(s, x.productId);
      return html`<div class="list-item" key=${x.ing}>
        ${prod?.image || photoFor(x.ing) ? html`<img class="thumb-img" src=${prod?.image || photoFor(x.ing)} alt="" referrerpolicy="no-referrer" />` : html`<span class="thumb sm" style="background:var(--surface-2)">${ing.emoji}</span>`}
        <div class="grow small strong" style="min-width:0">${prod ? productTitle(prod) : ing.name}</div>
        <button type="button" class="icon-btn sm plain" aria-label="Remplacer par un de mes produits" onClick=${() => setPicking({ index: k })}><${Icon} name="swap" size=${15} /></button>
        <${Stepper} value=${x.qty} min=${0} step=${stepFor(ing)} onChange=${(v) => setQty(k, v)} format=${(v) => fmtQty(v, ing.unit, x.ing)} />
      </div>`;
    })}</div>`}
    <div class="row" style="gap:8px">
      <div class="search grow"><${Icon} name="plus" size=${18} />
        <input class="field" type="search" placeholder="Ajouter un ingrédient" value=${q} onInput=${(e) => setQ(e.currentTarget.value)} /></div>
      <button type="button" class="btn outline sm" onClick=${() => setPicking({ index: -1 })}><${Icon} name="box" size=${15} />Mes produits</button>
    </div>
    ${results.length > 0 && html`<div class="pick-list" style="margin-top:6px">${results.map((i) => html`<button type="button" class="pick-row" onClick=${() => addIng(i)}>
      <span class="pick-emoji">${i.emoji}</span><span class="pick-main"><span class="pick-name">${i.name}</span></span><${Icon} name="plus" size=${16} /></button>`)}</div>`}

    <${Sheet} open=${!!picking} onClose=${() => setPicking(null)} title=${picking?.index >= 0 ? `Remplacer : ${ING[f.ingredients[picking.index]?.ing]?.name || ''}` : 'Ajouter un de mes produits'} tall>
      <div class="row" style="gap:8px;margin-bottom:12px">
        <div class="search grow"><${Icon} name="search" size=${18} />
          <input class="field" type="search" autocomplete="off" placeholder="Chercher : pâtes, riz, jambon…" value=${pq} onInput=${(e) => setPq(e.currentTarget.value)} /></div>
        <button type="button" class="icon-btn lgx" aria-label="Scanner un produit" onClick=${() => setScan(true)}><${Icon} name="barcode" size=${20} /></button>
      </div>
      ${stockRows.length > 0 && html`<div class="label">Dans tes placards et ton frigo</div>
        <div class="list" style="margin-bottom:14px">${stockRows.map((x) => {
          const p = getProduct(s, x.productId);
          const img = p?.image || photoFor(x.ing);
          return html`<button type="button" class="list-item" style="width:100%;text-align:left" key=${x.id}
            onClick=${() => (x.productId ? pickProduct(x.productId) : x.ing ? (picking.index >= 0
              ? (set({ ingredients: f.ingredients.map((y, i) => (i === picking.index ? { ing: x.ing, qty: ING[y.ing]?.unit === ING[x.ing].unit ? y.qty : defaultQty(ING[x.ing]) } : y)) }), setPicking(null))
              : (set({ ingredients: [...f.ingredients.filter((y) => y.ing !== x.ing), { ing: x.ing, qty: defaultQty(ING[x.ing]) }] }), setPicking(null))) : toast('Relie d’abord ce produit à un aliment dans ton stock'))}>
            ${img ? html`<img class="thumb-img" src=${img} alt="" referrerpolicy="no-referrer" />` : html`<span class="thumb sm" style="background:var(--surface-2)">${ING[x.ing]?.emoji || '🛒'}</span>`}
            <div class="grow" style="min-width:0"><div class="small strong clamp2">${cleanName(x.name)}</div>
              <div class="subtle xs">${x.ing ? ING[x.ing].name : 'Aucun aliment relié'}</div></div>
          </button>`;
        })}</div>`}
      ${ingRows.length > 0 && html`<div class="label">Aliments</div>
        <div class="pick-list" style="margin-bottom:12px">${ingRows.map((i) => html`<button type="button" class="pick-row" key=${i.id} onClick=${() => pickIng(i.id)}>
          <span class="pick-emoji">${i.emoji}</span><span class="pick-main"><span class="pick-name">${i.name}</span></span><${Icon} name="plus" size=${16} /></button>`)}</div>`}
      ${npq.length >= 2 && !stockRows.length && !ingRows.length && html`<p class="subtle small">Rien trouvé dans ton stock ni dans les aliments.</p>`}
      ${!more ? html`<button type="button" class="btn ghost sm" onClick=${() => setMore(true)}><${Icon} name="globe" size=${15} />Chercher un produit de magasin</button>`
        : html`<${ProductSearch} s=${s} onPick=${pickProduct} autoFocus=${false} placeholder="Pâtes, riz, jambon…" />`}
      <${ScanSheet} open=${scan} direct onClose=${() => setScan(false)}
        onFound=${(o) => { setScan(false); const known = o.barcode && s.customProducts.find((p) => p.barcode === o.barcode)?.id;
          pickProduct(known || saveCustomProduct({ name: o.name, brand: o.brand, barcode: o.barcode, size: o.size, unit: o.unit, ing: o.ing, nutri: o.nutri, image: o.image, storage: ING[o.ing]?.storage || 'placard', aisle: ING[o.ing]?.aisle || 'Divers', emoji: ING[o.ing]?.emoji || '🛒', price: 0, store: null })); }}
        onUnknown=${() => { setScan(false); toast('Produit inconnu d’Open Food Facts'); }} />
    </${Sheet}>

    <label class="label" for="re-steps" style="margin-top:14px">Étapes (une par ligne)</label>
    <textarea id="re-steps" class="field steps-input" rows="5" maxlength="3000" placeholder=${'Cuire les pâtes.\nDorer le poulet…'} value=${f.steps} onInput=${(e) => set({ steps: e.currentTarget.value })}></textarea>
  </${Sheet}>`;
}
