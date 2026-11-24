import { html, useState } from '../lib/h.js';
import { Icon, Chip, Stepper } from '../components/ui.js';
import { getState, replaceState, freshDemo, freshEmpty } from '../store.js';
import { STORES } from '../data/products.js';
import { EQUIPMENT, COOKING_EQUIPMENT } from '../data/recipes.js';
import { ING } from '../data/ingredients.js';
import { targets, kcalFmt, GOAL_LABEL } from '../lib/engine.js';
import { DIETS, DIET_KEYS, ALLERGY_KEYS } from '../data/diets.js';

const ACTIVITY = [
  { v: 1.2, label: 'Plutôt assis', hint: 'Bureau, peu de marche' },
  { v: 1.4, label: 'Un peu actif', hint: 'Marche, 1 à 2 séances' },
  { v: 1.6, label: 'Actif', hint: '3 à 5 séances' },
  { v: 1.8, label: 'Très actif', hint: 'Sport quasi quotidien ou métier physique' },
];
const GOALS = [
  { v: 'gain', emoji: '🌱', title: 'Prendre du poids', hint: 'Manger plus, sans forcer' },
  { v: 'maintain', emoji: '⚖️', title: 'Garder mon poids', hint: 'Bien manger, régulièrement' },
  { v: 'lose', emoji: '🍃', title: 'Perdre du poids', hint: 'En douceur, sans frustration' },
];
export const HOUSEHOLDS = [
  { v: 'solo', emoji: '🙋', title: 'Pour moi', hint: 'Une seule personne', h: { adults: 1, kids: 0 } },
  { v: 'duo', emoji: '👫', title: 'À deux', hint: 'En couple ou en colocation', h: { adults: 2, kids: 0 } },
  { v: 'family', emoji: '👨‍👩‍👧', title: 'En famille', hint: 'Avec des enfants', h: { adults: 2, kids: 1 } },
];
export const householdKind = (h) => (!h || ((+h.adults || 1) <= 1 && !+h.kids) ? 'solo' : +h.kids ? 'family' : 'duo');
export const PRIORITIES = [
  { v: 'equilibre', emoji: '🥗', title: 'Manger équilibré', hint: 'Plus de légumes, de fruits et de légumineuses' },
  { v: 'budget', emoji: '💶', title: 'Faire des économies', hint: 'Des recettes et des produits moins chers' },
  { v: 'antigaspi', emoji: '♻️', title: 'Moins gaspiller', hint: 'Cuisiner d’abord ce que tu as déjà' },
  { v: 'rapide', emoji: '⏱️', title: 'Cuisiner vite', hint: 'Des recettes de 20 min ou moins' },
  { v: 'proteine', emoji: '💪', title: 'Plus de protéines', hint: 'Pour le sport ou la récupération' },
];
const TASTES = ['poulet', 'oeufs', 'pates', 'riz', 'steak15', 'fromage_blanc', 'skyr', 'saumon', 'thon', 'cotes_porc', 'jambon', 'tofu', 'lentilles', 'pois_chiches', 'champignons', 'brocoli', 'avocat', 'poivron', 'banane', 'lait', 'emmental', 'chevre'];

export function Onboarding() {
  const cur = getState();
  const hasData = cur.inventory.length > 0 || Object.keys(cur.plan).length > 0;
  const [step, setStep] = useState(0);
  const [p, setP] = useState({ ...cur.profile });
  const [goal, setGoal] = useState(null);
  const [refuges, setRefuges] = useState(Object.keys(cur.prefs.ing).filter((k) => cur.prefs.ing[k] === 'refuge' && TASTES.includes(k)));
  const [nogo, setNogo] = useState(Object.keys(cur.prefs.ing).filter((k) => cur.prefs.ing[k] === 'nogo' && TASTES.includes(k)));
  const set = (patch) => setP({ ...p, ...patch });
  const hh = p.household || { adults: 1, kids: 0 };
  const kind = householdKind(hh);
  const toggleIn = (key, v) => { const l = p[key] || []; set({ [key]: l.includes(v) ? l.filter((x) => x !== v) : [...l, v] }); };
  const t = targets(p);
  const toggle = (list, setList, id, other, setOther) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
    if (other.includes(id)) setOther(other.filter((x) => x !== id));
  };
  const pickGoal = (g) => {
    setGoal(g);
    const w = +p.weight || 60;
    set({ weightGoal: g === 'gain' ? w + 4 : g === 'lose' ? w - 4 : w });
  };

  const finish = (mode) => {
    const profile = { ...p, onboarded: true };
    let next = mode === 'keep' ? structuredClone(getState()) : mode === 'demo' ? freshDemo(profile) : freshEmpty(profile);
    next.profile = profile;
    for (const id of TASTES) if (next.prefs.ing[id] === 'refuge' || next.prefs.ing[id] === 'nogo') delete next.prefs.ing[id];
    refuges.forEach((id) => { next.prefs.ing[id] = 'refuge'; });
    nogo.forEach((id) => { next.prefs.ing[id] = 'nogo'; });
    next.ui = { ...next.ui, tab: 'week', tutorial: !cur.profile.tutorialSeen };
    replaceState(next);
  };

  const steps = [
    { ok: true, body: html`<div class="ob-hero">
        <img src="icons/icon.svg" alt="" width="96" height="96" />
        <h1 class="ob-title">Bienvenue sur Cocotte</h1>
        <p class="muted">Planning de repas, liste de courses, stock du frigo et recettes. Tout s'adapte à toi en 1 minute.</p>
      </div>` },
    { ok: !!goal, body: html`<div>
        <h1 class="ob-title">Ton objectif</h1>
        <p class="muted">Tu pourras le changer quand tu veux.</p>
        <div class="stack" style="margin-top:18px">${GOALS.map((g) => html`<button type="button" class=${`ob-card ${goal === g.v ? 'on' : ''}`} onClick=${() => pickGoal(g.v)}>
          <span class="ob-emoji">${g.emoji}</span><span class="grow"><b>${g.title}</b><small>${g.hint}</small></span>
          <span class=${`check ${goal === g.v ? 'on' : ''}`}><${Icon} name="check" size=${16} stroke=${3} /></span></button>`)}</div>
      </div>` },
    { ok: true, body: html`<div>
        <h1 class="ob-title">Quelques repères</h1>
        <p class="muted">Pour estimer tes besoins. Rien ne quitte ton téléphone.</p>
        <div class="card flat" style="margin-top:16px">
          <div class="row between"><b class="small">Je suis</b><div class="chips">
            ${[['f', 'Une femme'], ['m', 'Un homme'], ['x', 'Autre']].map(([v, l]) => html`<${Chip} sm active=${p.sex === v} onClick=${() => set({ sex: v })}>${l}</${Chip}>`)}</div></div>
          <div class="hr"></div>
          <div class="row between"><b class="small">Âge</b><${Stepper} value=${p.age} min=${14} max=${99} onChange=${(v) => set({ age: v })} format=${(v) => `${v} ans`} /></div>
          <div class="hr"></div>
          <div class="row between"><b class="small">Taille</b><${Stepper} value=${p.height} min=${130} max=${220} onChange=${(v) => set({ height: v })} format=${(v) => `${v} cm`} /></div>
          <div class="hr"></div>
          <div class="row between"><b class="small">Poids actuel</b><${Stepper} value=${p.weight} min=${30} max=${250} step=${0.5} onChange=${(v) => set({ weight: v })} format=${(v) => `${String(v).replace('.', ',')} kg`} /></div>
          <div class="hr"></div>
          <div class="row between"><b class="small">Poids visé</b><${Stepper} value=${p.weightGoal} min=${30} max=${250} step=${0.5} onChange=${(v) => set({ weightGoal: v })} format=${(v) => `${String(v).replace('.', ',')} kg`} /></div>
        </div>
        <div class="label" style="margin-top:16px">Activité</div>
        <div class="stack">${ACTIVITY.map((a) => html`<button type="button" class=${`ob-card sm ${p.activity === a.v ? 'on' : ''}`} onClick=${() => set({ activity: a.v })}>
          <span class="grow"><b>${a.label}</b><small>${a.hint}</small></span>
          <span class=${`check ${p.activity === a.v ? 'on' : ''}`}><${Icon} name="check" size=${16} stroke=${3} /></span></button>`)}</div>
        <div class="ob-result">
          <span>${GOAL_LABEL[t.dir]}</span>
          ${p.showNumbers !== false ? html`<b class="num">${kcalFmt(t.kcal)} kcal / jour</b>
          <small>${t.prot} g de protéines · ajusté automatiquement si tu changes ton poids visé</small>` : html`<small>Tes repères sont calculés pour toi, sans chiffre affiché</small>`}
        </div>
      </div>` },
    { ok: true, body: html`<div>
        <h1 class="ob-title">Pour qui tu cuisines ?</h1>
        <p class="muted">Les quantités à cuisiner et la liste de courses s’adaptent au foyer. Ta jauge et ton objectif restent à toi.</p>
        <div class="stack" style="margin-top:18px">${HOUSEHOLDS.map((x) => html`<button type="button" class=${`ob-card ${kind === x.v ? 'on' : ''}`} onClick=${() => set({ household: x.h })}>
          <span class="ob-emoji">${x.emoji}</span><span class="grow"><b>${x.title}</b><small>${x.hint}</small></span>
          <span class=${`check ${kind === x.v ? 'on' : ''}`}><${Icon} name="check" size=${16} stroke=${3} /></span></button>`)}</div>
        ${kind !== 'solo' && html`<div class="card flat" style="margin-top:14px">
          <div class="row between"><b class="small">Adultes (toi compris)</b><${Stepper} value=${hh.adults} min=${1} max=${8} onChange=${(v) => set({ household: { ...hh, adults: v } })} format=${(v) => `${v}`} /></div>
          <div class="hr"></div>
          <div class="row between"><b class="small">Enfants</b><${Stepper} value=${hh.kids} min=${0} max=${8} onChange=${(v) => set({ household: { ...hh, kids: v } })} format=${(v) => `${v}`} /></div>
        </div>
        <p class="subtle" style="margin-top:10px">Un enfant compte pour un peu plus d’une demi-portion.</p>`}
      </div>` },
    { ok: true, body: html`<div>
        <h1 class="ob-title">Ce qui compte pour toi</h1>
        <p class="muted">Choisis autant que tu veux : les idées de repas en tiennent compte.</p>
        <div class="stack" style="margin-top:18px">${PRIORITIES.map((x) => { const on = (p.priorities || []).includes(x.v); return html`<button type="button" class=${`ob-card sm ${on ? 'on' : ''}`} onClick=${() => toggleIn('priorities', x.v)}>
          <span class="ob-emoji">${x.emoji}</span><span class="grow"><b>${x.title}</b><small>${x.hint}</small></span>
          <span class=${`check ${on ? 'on' : ''}`}><${Icon} name="check" size=${16} stroke=${3} /></span></button>`; })}</div>
        <div class="label" style="margin-top:20px">Les chiffres (kcal, protéines)</div>
        <div class="stack">
          ${[[true, '🔢', 'Les afficher', 'Jauge chiffrée, kcal des repas et des recettes'], [false, '🙈', 'Les masquer', 'Tu vois juste si ta journée est complète, sans aucun chiffre']].map(([v, e, ti, hi]) => html`<button type="button" class=${`ob-card sm ${(p.showNumbers !== false) === v ? 'on' : ''}`} onClick=${() => set({ showNumbers: v })}>
            <span class="ob-emoji">${e}</span><span class="grow"><b>${ti}</b><small>${hi}</small></span>
            <span class=${`check ${(p.showNumbers !== false) === v ? 'on' : ''}`}><${Icon} name="check" size=${16} stroke=${3} /></span></button>`)}
        </div>
        <p class="subtle" style="margin-top:10px">Modifiable à tout moment dans ton profil.</p>
      </div>` },
    { ok: (p.stores || []).length > 0, body: html`<div>
        <h1 class="ob-title">Tes magasins</h1>
        <p class="muted">Ceux où tu vas le plus. Les produits et les prix s'adaptent.</p>
        <div class="ob-grid" style="margin-top:18px">${Object.entries(STORES).map(([k, st]) => {
          const on = p.stores.includes(k);
          return html`<button type="button" class=${`ob-store ${on ? 'on' : ''}`} onClick=${() => set({ stores: on ? p.stores.filter((x) => x !== k) : [...p.stores, k] })}>
            <span class="ob-dot" style=${{ background: st.color }}></span>${st.name}${on && html`<${Icon} name="check" size=${16} stroke=${3} />`}</button>`;
        })}</div>
        ${p.stores.length > 1 && html`<p class="subtle" style="margin-top:10px">Le premier choisi (${STORES[p.stores[0]].name}) sert par défaut.</p>`}
      </div>` },
    { ok: true, body: html`<div>
        <h1 class="ob-title">Ton matériel</h1>
        <p class="muted">Seules les recettes faisables avec ton équipement seront proposées.</p>
        <div class="ob-grid" style="margin-top:18px">${COOKING_EQUIPMENT.map((k) => {
          const on = p.equipment.includes(k);
          return html`<button type="button" class=${`ob-store ${on ? 'on' : ''}`} onClick=${() => set({ equipment: on ? p.equipment.filter((x) => x !== k) : [...p.equipment, k] })}>
            <span>${EQUIPMENT[k].emoji}</span>${EQUIPMENT[k].label}${on && html`<${Icon} name="check" size=${16} stroke=${3} />`}</button>`;
        })}</div>
      </div>` },
    { ok: true, body: html`<div>
        <h1 class="ob-title">Régime et allergies</h1>
        <p class="muted">Facultatif. Les recettes qui ne te conviennent pas sont masquées, ou adaptées quand c’est un accompagnement.</p>
        <div class="label" style="margin-top:18px">Je mange</div>
        <div class="chips">${DIET_KEYS.map((k) => html`<${Chip} sm active=${(p.diets || []).includes(k)} onClick=${() => toggleIn('diets', k)}>${DIETS[k].emoji} ${DIETS[k].label}</${Chip}>`)}</div>
        <div class="label" style="margin-top:18px">Allergies et intolérances</div>
        <div class="chips">${ALLERGY_KEYS.map((k) => html`<${Chip} sm active=${(p.diets || []).includes(k)} onClick=${() => toggleIn('diets', k)}>${DIETS[k].emoji} ${DIETS[k].label}</${Chip}>`)}</div>
        <p class="subtle" style="margin-top:12px">Cocotte t’aide à trier, mais vérifie toujours les étiquettes des produits en cas d’allergie.</p>
      </div>` },
    { ok: true, body: html`<div>
        <h1 class="ob-title">Tes goûts</h1>
        <p class="muted">Facultatif, tout se règle ensuite dans ton profil.</p>
        <div class="label" style="margin-top:18px">💙 Ce qui te fait du bien</div>
        <div class="chips">${TASTES.map((id) => html`<${Chip} sm active=${refuges.includes(id)} onClick=${() => toggle(refuges, setRefuges, id, nogo, setNogo)}>${ING[id].emoji} ${ING[id].name}</${Chip}>`)}</div>
        <div class="label" style="margin-top:18px">🙅 Ce que tu ne manges pas</div>
        <div class="chips">${TASTES.map((id) => html`<${Chip} sm active=${nogo.includes(id)} onClick=${() => toggle(nogo, setNogo, id, refuges, setRefuges)}>${ING[id].emoji} ${ING[id].name}</${Chip}>`)}</div>
      </div>` },
    { ok: true, last: true, body: html`<div>
        <h1 class="ob-title">C'est prêt</h1>
        <p class="muted">${hasData ? 'Tu as déjà des données dans l’app. Que veux-tu en faire ?' : 'Tu préfères partir de zéro ou découvrir avec des exemples ?'}</p>
        <div class="stack" style="margin-top:18px">
          ${hasData && html`<button type="button" class="ob-card on" onClick=${() => finish('keep')}><span class="ob-emoji">📦</span><span class="grow"><b>Garder mes données</b><small>Stock, planning et courses restent en place</small></span><${Icon} name="arrowR" /></button>`}
          <button type="button" class=${`ob-card ${hasData ? '' : 'on'}`} onClick=${() => finish('empty')}><span class="ob-emoji">✨</span><span class="grow"><b>Partir de zéro</b><small>Frigo et semaine vides, à remplir</small></span><${Icon} name="arrowR" /></button>
          <button type="button" class="ob-card" onClick=${() => finish('demo')}><span class="ob-emoji">🧪</span><span class="grow"><b>Voir avec des exemples</b><small>Une semaine, un stock et des courses fictifs</small></span><${Icon} name="arrowR" /></button>
        </div>
      </div>` },
  ];
  const cur2 = steps[step];

  return html`<div class="onboarding">
    <div class="ob-top">
      ${step > 0 ? html`<button type="button" class="icon-btn plain" aria-label="Retour" onClick=${() => setStep(step - 1)}><${Icon} name="arrowL" /></button>` : html`<span style="width:40px"></span>`}
      <div class="ob-progress"><i style=${{ width: `${(step / (steps.length - 1)) * 100}%` }}></i></div>
      <span style="width:40px"></span>
    </div>
    <div class="ob-body" key=${step}>${cur2.body}</div>
    ${!cur2.last && html`<div class="ob-foot">
      <button type="button" class="btn primary block lg" disabled=${!cur2.ok} onClick=${() => setStep(step + 1)}>${step === 0 ? 'Commencer' : 'Continuer'}<${Icon} name="arrowR" size=${18} /></button>
    </div>`}
  </div>`;
}
