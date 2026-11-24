import { html, useState } from '../lib/h.js';
import { Icon } from './ui.js';
import { update } from '../store.js';

// Premiers pas : 4 écrans pour ne pas lâcher la personne dans le vide (rejouable depuis le profil)
const SLIDES = [
  { emoji: '🗓️', title: 'Ta semaine', text: 'Touche un repas pour choisir une recette, ou « Compléter » pour remplir la semaine d’un coup. Les idées suivent ton stock, tes goûts et tes priorités.' },
  { emoji: '🛒', title: 'Tes courses', text: 'La liste se fait depuis tes repas. Après le magasin, importe ton ticket : tout est rangé dans ton stock et les vrais prix sont retenus.' },
  { emoji: '✅', title: 'Un geste après le repas', text: '« Mangé » déduit les ingrédients de ton stock tout seul. « Dehors » ou « Je passe » si le repas a changé, sans rien justifier.' },
  { emoji: '↩️', title: 'Rien n’est jamais perdu', text: 'Chaque action peut s’annuler depuis le message en bas de l’écran. Une sauvegarde est faite chaque jour, et tout reste sur ton téléphone.' },
];

export function Tutorial() {
  const [i, setI] = useState(0);
  const done = () => update((d) => { d.ui.tutorial = false; d.profile.tutorialSeen = true; });
  const sl = SLIDES[i];
  const last = i === SLIDES.length - 1;
  return html`<div class="tuto" role="dialog" aria-modal="true" aria-label="Premiers pas">
    <div class="tuto-card" key=${i}>
      <div class="tuto-emoji">${sl.emoji}</div>
      <div class="h1" style="font-size:26px;text-align:center">${sl.title}</div>
      <p class="muted" style="text-align:center;margin:8px 0 0">${sl.text}</p>
      <div class="tuto-dots">${SLIDES.map((_, k) => html`<i class=${k === i ? 'on' : ''}></i>`)}</div>
      <div class="row" style="gap:8px">
        ${!last && html`<button type="button" class="btn ghost" onClick=${done}>Passer</button>`}
        <button type="button" class="btn primary grow lg" onClick=${() => (last ? done() : setI(i + 1))}>${last ? 'C’est parti' : 'Suivant'}<${Icon} name="arrowR" size=${18} /></button>
      </div>
    </div>
  </div>`;
}
