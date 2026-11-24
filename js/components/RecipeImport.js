import { html, useState } from '../lib/h.js';
import { Sheet, Icon, Stepper } from './ui.js';
import { ING, fmtQty } from '../data/ingredients.js';
import { parseRecipeText } from '../lib/recipeImport.js';
import { RecipeEditor } from './RecipeEditor.js';

const COLORS = ['#F6E9D7', '#F4DED6', '#E3EDD5', '#E3EEE6', '#FCEBB4', '#F7E3BF'];

// Importer une recette : texte copié depuis un site ou une app, ou photo / capture d'écran
export function RecipeImport({ open, onClose, onSaved }) {
  const [raw, setRaw] = useState('');
  const [serves, setServes] = useState(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState(null);
  const close = () => { setRaw(''); setServes(null); setBusy(null); setError(null); setDraft(null); onClose(); };

  const parsed = raw.trim().length > 20 ? parseRecipeText(serves ? `${raw}\npour ${serves} personnes` : raw) : null;
  const detected = raw.trim().length > 20 ? parseRecipeText(raw)?.serves : null;

  const readPhoto = async (f) => {
    if (!f) return;
    setError(null); setBusy('Lecture de la photo…');
    try {
      const { ticketTextFromFile } = await import('../lib/ticketFile.js');
      setRaw(await ticketTextFromFile(f, setBusy));
    } catch (e) { setError(e.message || 'Lecture impossible'); }
    setBusy(null);
  };

  const openEditor = () => {
    setDraft({
      name: parsed.name, emoji: '🍽️', color: COLORS[parsed.name.length % COLORS.length],
      prep: parsed.prep, cook: parsed.cook, time: parsed.prep + parsed.cook, meals: ['dej', 'diner'],
      equipment: parsed.equipment.length ? parsed.equipment : ['aucun'], ingredients: parsed.ingredients, steps: parsed.steps,
    });
  };

  if (draft) return html`<${RecipeEditor} open=${true} recipe=${draft} onClose=${close} onSaved=${(id) => onSaved?.(id)} />`;

  return html`<${Sheet} open=${open} onClose=${close} title="Importer une recette" tall
    footer=${html`<button type="button" class="btn primary block lg" disabled=${!parsed || !parsed.ingredients.length} onClick=${openEditor}>
      <${Icon} name="edit" size=${18} />Vérifier et enregistrer</button>`}>
    <p class="subtle" style="margin:0 2px 10px">Copie la recette depuis un site ou une app (titre, ingrédients, étapes) et colle-la ici, ou prends-la en photo. Tout est lu sur ton téléphone.</p>
    <label class="btn outline block" style="cursor:pointer"><${Icon} name="camera" size=${17} />Photo ou capture d’écran
      <input type="file" accept="image/*,application/pdf" hidden onChange=${(e) => { const f = e.currentTarget.files?.[0]; e.currentTarget.value = ''; readPhoto(f); }} /></label>
    ${busy && html`<div class="ticket-busy" style="margin-top:10px"><span class="spinner"></span><span>${busy}</span></div>`}
    ${error && html`<div class="card tint-amber small" style="margin-top:10px">${error}</div>`}
    <textarea class="field" style="margin-top:10px;min-height:140px" maxlength="20000" placeholder=${'Pâtes au poulet\nPour 2 personnes\n\nIngrédients\n200 g de pâtes\n300 g de blanc de poulet\n20 cl de crème\n\nPréparation\nCuire les pâtes…'}
      value=${raw} onInput=${(e) => setRaw(e.currentTarget.value)}></textarea>

    ${parsed && html`<div style="margin-top:14px">
      <div class="card flat row between"><span class="small strong">Recette pour</span>
        <${Stepper} value=${serves || detected || 1} min=${1} max=${12} step=${1} onChange=${setServes} format=${(v) => `${v} personne${v > 1 ? 's' : ''}`} /></div>
      <div class="subtle xs" style="margin:6px 2px 0">Les quantités sont ramenées à 1 portion.</div>
      <div class="h2" style="margin:14px 2px 6px;font-size:17px">${parsed.name}</div>
      <div class="list">${parsed.ingredients.map((x) => html`<div class="list-item" key=${x.ing}>
        <span class="thumb sm" style="background:var(--surface-2)">${ING[x.ing].emoji}</span>
        <div class="grow small strong">${ING[x.ing].name}</div><span class="small num">${fmtQty(x.qty, ING[x.ing].unit, x.ing)}</span></div>`)}</div>
      ${parsed.unknown.length > 0 && html`<div class="card tint-slate small" style="margin-top:10px">Non reconnus (à ajouter dans l’éditeur si besoin) : ${parsed.unknown.join(' · ')}</div>`}
      <div class="subtle small" style="margin-top:10px">${parsed.steps.length} étape${parsed.steps.length > 1 ? 's' : ''} trouvée${parsed.steps.length > 1 ? 's' : ''}</div>
    </div>`}
  </${Sheet}>`;
}
