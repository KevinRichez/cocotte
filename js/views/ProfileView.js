import { html, useState } from '../lib/h.js';
import { useStore, update, resetDemo } from '../store.js';
import { Icon, Chip, Badge, Seg, Sheet, Swipeable, Stepper, Toggle, Empty } from '../components/ui.js';
import { ING, INGREDIENTS, CATEGORIES, fmtQty } from '../data/ingredients.js';
import { dlcInfo, fmtShort } from '../lib/dates.js';
import { kcalFmt } from '../lib/engine.js';
import { quickAddStock, updateStockItem, removeStockItem, setPref, setProfile } from '../actions.js';
import { toast } from '../lib/toast.js';

const norm = (x) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function ProfileView() {
  const s = useStore();
  const tab = s.ui.profileTab || 'stock';
  const [goalOpen, setGoalOpen] = useState(false);
  return html`<div class="screen">
    <header class="topbar">
      <div><div class="eyebrow">Mon espace</div><h1 class="h1">Profil & stock</h1></div>
      <button class="icon-btn" aria-label="Réglages" onClick=${() => setGoalOpen(true)}><${Icon} name="edit" size=${18} /></button>
    </header>

    <button class="card tint-sage pad-lg tappable" style="width:100%;text-align:left" onClick=${() => setGoalOpen(true)}>
      <div class="row" style="gap:14px">
        <span class="thumb" style="background:#fff">🌱</span>
        <div class="grow">
          <div class="strong">Prise de masse en douceur</div>
          <div class="subtle">${[
            s.profile.showWeight && `Objectif ${s.profile.weightGoal} kg`,
            s.profile.showKcal ? `repère souple ~${kcalFmt(s.profile.kcalTarget)} kcal` : 'repères caloriques masqués',
          ].filter(Boolean).join(' · ')}</div>
        </div>
        <${Icon} name="chevR" size=${18} class="muted" />
      </div>
    </button>

    <div style="margin-top:16px">
      <${Seg} value=${tab} onChange=${(v) => update((d) => { d.ui.profileTab = v; })} options=${[
        { value: 'stock', label: 'Placards & Frigo' },
        { value: 'prefs', label: 'Préférences' },
      ]} />
    </div>
    ${tab === 'stock' ? html`<${StockTab} s=${s} />` : html`<${PrefsTab} s=${s} />`}
    <${GoalSheet} open=${goalOpen} onClose=${() => setGoalOpen(false)} s=${s} />
  </div>`;
}

/* ---------------- Stock ---------------- */
function StockTab({ s }) {
  const [loc, setLoc] = useState('all');
  const [edit, setEdit] = useState(null);
  const [adding, setAdding] = useState(false);
  const inv = [...s.inventory].sort((a, b) => (a.dlc || '9999').localeCompare(b.dlc || '9999'));
  const soon = inv.filter((x) => { const d = dlcInfo(x.dlc); return d.days >= 0 && d.days <= 2; });
  const past = inv.filter((x) => dlcInfo(x.dlc).past);
  const shown = inv.filter((x) => loc === 'all' || x.location === loc);
  const frigoN = inv.filter((x) => x.location === 'frigo').length;
  const placardN = inv.length - frigoN;
  const quick = [...new Set([...s.prefs.refuges, 'lait', 'banane', 'riz', 'pain_mie', 'emmental', 'beurre_cac', 'jambon', 'creme', 'avoine'])]
    .filter((id) => ING[id] && !s.prefs.nogo.includes(id));

  const group = (title, icon, rows) => rows.length > 0 && html`<div>
    <div class="aisle-title"><span class="row" style="gap:6px"><${Icon} name=${icon} size=${14} />${title}</span><span>${rows.length}</span></div>
    <div class="list">${rows.map((x) => html`<${StockRow} key=${x.id} x=${x} onEdit=${() => setEdit(x.id)} />`)}</div>
  </div>`;

  return html`<div>
    ${(soon.length > 0 || past.length > 0) && html`<div class="card tint-amber" style="margin-top:14px">
      <div class="strong small" style="margin-bottom:8px">🍃 À consommer bientôt</div>
      <div class="chips">
        ${soon.map((x) => html`<button class="chip sm" style="background:#fff" onClick=${() => setEdit(x.id)}>${ING[x.ing]?.emoji || '🛒'} ${x.name} · ${dlcInfo(x.dlc).label.toLowerCase()}</button>`)}
        ${past.map((x) => html`<button class="chip sm" style="background:#fff;color:var(--mute)" onClick=${() => setEdit(x.id)}>${ING[x.ing]?.emoji || '🛒'} ${x.name} · à vérifier</button>`)}
      </div>
      ${past.length > 0 && html`<div class="subtle" style="margin-top:8px">Date passée : regarde, sens, goûte. Tu sais juger 👃</div>`}
    </div>`}

    <div class="section-title"><div class="h2">Ajout rapide</div>
      <button class="btn soft sm" onClick=${() => setAdding(true)}><${Icon} name="search" size=${15} />Autre</button></div>
    <div class="chips scroll">
      ${quick.map((id) => html`<${Chip} sm onClick=${() => quickAddStock(id)}>${ING[id].emoji} ${ING[id].name}</${Chip}>`)}
    </div>

    <div style="margin-top:16px" class="chips">
      <${Chip} sm active=${loc === 'all'} onClick=${() => setLoc('all')}>Tout (${inv.length})</${Chip}>
      <${Chip} sm active=${loc === 'frigo'} onClick=${() => setLoc('frigo')}>🧊 Frigo (${frigoN})</${Chip}>
      <${Chip} sm active=${loc === 'placard'} onClick=${() => setLoc('placard')}>📦 Placards (${placardN})</${Chip}>
    </div>

    ${shown.length === 0 && html`<${Empty} emoji="📦" title="Rien ici pour l’instant" />`}
    ${(loc === 'all' || loc === 'frigo') && group('Frigo', 'fridge', shown.filter((x) => x.location === 'frigo'))}
    ${(loc === 'all' || loc === 'placard') && group('Placards', 'box', shown.filter((x) => x.location === 'placard'))}
    ${shown.length > 0 && html`<p class="subtle center" style="margin-top:12px">Glisse vers la gauche quand un produit est fini.</p>`}

    <${StockEditSheet} id=${edit} s=${s} onClose=${() => setEdit(null)} />
    <${IngredientPicker} open=${adding} title="Ajouter au stock" s=${s} onClose=${() => setAdding(false)}
      onPick=${(id) => { quickAddStock(id); setAdding(false); }} />
  </div>`;
}

function StockRow({ x, onEdit }) {
  const ing = ING[x.ing];
  const d = dlcInfo(x.dlc);
  return html`<${Swipeable} onLeft=${() => removeStockItem(x.id)} leftLabel="Fini">
    <div class="list-item" onClick=${onEdit} style="cursor:pointer">
      <span class="thumb sm" style="background:var(--surface-2)">${ing?.emoji || '🛒'}</span>
      <div class="grow" style="min-width:0">
        <div class="small strong ellipsis">${x.name}</div>
        <div class="subtle xs">${ing ? fmtQty(x.qty, ing.unit, x.ing) : `× ${x.qty}`}</div>
      </div>
      ${x.dlc && html`<${Badge} tone=${d.tone}>${d.past ? 'À vérifier' : d.label}</${Badge}>`}
    </div>
  </${Swipeable}>`;
}

function StockEditSheet({ id, s, onClose }) {
  const x = s.inventory.find((i) => i.id === id);
  if (!x) return html`<${Sheet} open=${false} />`;
  const ing = ING[x.ing];
  const step = !ing ? 1 : ing.unit === 'pc' ? 1 : ing.unit === 'ml' ? 100 : 50;
  return html`<${Sheet} open=${true} onClose=${onClose} title=${`${ing?.emoji || '🛒'} ${x.name}`}
    subtitle=${x.addedAt ? `Ajouté le ${fmtShort(x.addedAt)}` : ''}
    footer=${html`<div class="row">
      <button class="btn ghost" onClick=${() => { removeStockItem(x.id); onClose(); }}><${Icon} name="trash" size=${17} />Fini</button>
      <button class="btn primary grow" onClick=${onClose}>OK</button></div>`}>
    <div class="card flat">
      <div class="row between"><span class="small strong">Quantité</span>
        <${Stepper} value=${x.qty} min=${0} step=${step} format=${(v) => (ing ? fmtQty(v, ing.unit, x.ing) : v)}
          onChange=${(v) => { if (v <= 0) { removeStockItem(x.id); onClose(); } else updateStockItem(x.id, { qty: v }); }} /></div>
      <div class="hr"></div>
      <div class="row between"><span class="small strong">Rangement</span>
        <div class="chips">
          <${Chip} sm active=${x.location === 'frigo'} onClick=${() => updateStockItem(x.id, { location: 'frigo' })}>🧊 Frigo</${Chip}>
          <${Chip} sm active=${x.location === 'placard'} onClick=${() => updateStockItem(x.id, { location: 'placard' })}>📦 Placard</${Chip}>
        </div></div>
      <div class="hr"></div>
      <div class="row between"><span class="small strong">DLC</span>
        <input type="date" class="field" style="width:170px;height:40px" value=${x.dlc || ''} onInput=${(e) => updateStockItem(x.id, { dlc: e.currentTarget.value || null })} /></div>
      ${x.dlc && html`<div class="subtle" style="margin-top:8px">${dlcInfo(x.dlc).past ? 'Date passée : fie-toi à ton nez et à l’aspect.' : `À consommer : ${dlcInfo(x.dlc).label.toLowerCase()}`}</div>`}
    </div>
    <div class="label" style="margin-top:16px">Ouvert ? Raccourcir la DLC</div>
    <div class="chips">${[1, 2, 3, 5].map((n) => html`<${Chip} sm onClick=${() => {
      const d = new Date(); d.setDate(d.getDate() + n);
      updateStockItem(x.id, { dlc: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` });
      toast(`DLC réglée à ${n} jour${n > 1 ? 's' : ''}`);
    }}>${n === 1 ? 'Demain' : `Dans ${n} j`}</${Chip}>`)}</div>
  </${Sheet}>`;
}

/* ---------------- Préférences ---------------- */
const PREF_CATS = [
  { key: 'refuges', title: 'Aliments refuges', emoji: '💙', tone: 'sky', hint: 'Ceux qui te font du bien. Mis en avant dans les suggestions.' },
  { key: 'defis', title: 'Défis en douceur', emoji: '🌱', tone: 'lav', hint: 'Proposés de temps en temps, jamais imposés. Tu peux toujours les échanger.' },
  { key: 'nogo', title: 'No-Go', emoji: '🙅', tone: 'mute', hint: 'Totalement masqués des suggestions et des recettes.' },
];

function PrefsTab({ s }) {
  const [picking, setPicking] = useState(null);
  return html`<div class="stack" style="margin-top:14px">
    ${PREF_CATS.map((c) => html`<div class="card" key=${c.key}>
      <div class="row between"><div class="h3">${c.emoji} ${c.title}</div><${Badge} tone=${c.tone}>${s.prefs[c.key].length}</${Badge}></div>
      <div class="subtle" style="margin:4px 0 12px">${c.hint}</div>
      <div class="chips">
        ${s.prefs[c.key].map((id) => html`<${Chip} sm onClick=${() => setPref(id, null)} title="Retirer">${ING[id]?.emoji} ${ING[id]?.name}<span class="x"><${Icon} name="x" size=${13} /></span></${Chip}>`)}
        <${Chip} sm dashed onClick=${() => setPicking(c)}><${Icon} name="plus" size=${14} />Ajouter</${Chip}>
      </div>
    </div>`)}
    <div class="card tint-lav">
      <div class="small">🌿 <b>Ici, pas de règle stricte.</b> Les repères sont là pour t’aider à bien manger, pas pour juger. Sauter une collation ou manger dehors, c’est normal.</div>
    </div>
    <div class="card flat">
      <div class="h3">Données</div>
      <div class="subtle" style="margin:4px 0 10px">Tout est stocké sur ton téléphone, rien n’est envoyé en ligne.</div>
      <button class="btn ghost sm" onClick=${() => { if (confirm('Remettre les données de démo ? Tes modifications seront perdues.')) { resetDemo(); toast('Données de démo restaurées'); } }}>
        <${Icon} name="refresh" size=${15} />Réinitialiser la démo</button>
    </div>
    <${IngredientPicker} open=${!!picking} title=${picking ? `${picking.emoji} ${picking.title}` : ''} s=${s} highlight=${picking?.key}
      onClose=${() => setPicking(null)} onPick=${(id) => { setPref(id, picking.key); toast(`${ING[id].name} → ${picking.title.toLowerCase()}`); }} />
  </div>`;
}

function IngredientPicker({ open, title, s, onClose, onPick, highlight }) {
  const [q, setQ] = useState('');
  const where = (id) => PREF_CATS.find((c) => s.prefs[c.key].includes(id));
  const list = INGREDIENTS.filter((i) => !q || norm(i.name).includes(norm(q)));
  const cats = Object.entries(CATEGORIES).map(([k, c]) => ({ k, c, rows: list.filter((i) => i.cat === k) })).filter((g) => g.rows.length);
  return html`<${Sheet} open=${open} onClose=${() => { setQ(''); onClose(); }} title=${title}>
    <div class="search" style="margin-bottom:12px"><${Icon} name="search" size=${18} />
      <input class="field" placeholder="Chercher un aliment" value=${q} onInput=${(e) => setQ(e.currentTarget.value)} /></div>
    ${cats.map(({ k, c, rows }) => html`<div key=${k} style="margin-bottom:14px">
      <div class="label">${c.emoji} ${c.label}</div>
      <div class="chips">${rows.map((i) => {
        const w = where(i.id);
        const active = highlight && w?.key === highlight;
        return html`<${Chip} sm active=${active} onClick=${() => onPick(i.id)}>${i.emoji} ${i.name}${w && !active ? ` ${w.emoji}` : ''}</${Chip}>`;
      })}</div>
    </div>`)}
  </${Sheet}>`;
}

/* ---------------- Objectif ---------------- */
function GoalSheet({ open, onClose, s }) {
  const p = s.profile;
  return html`<${Sheet} open=${open} onClose=${onClose} title="Mon objectif" subtitle="Tout est ajustable, à ton rythme"
    footer=${html`<button class="btn primary block" onClick=${onClose}>OK</button>`}>
    <div class="card flat">
      <div class="row between"><div class="small"><b>Afficher les repères caloriques</b><div class="subtle">Masque tous les chiffres si tu préfères</div></div>
        <${Toggle} on=${p.showKcal} label="Repères caloriques" onChange=${(v) => setProfile({ showKcal: v })} /></div>
      ${p.showKcal && html`<div class="hr"></div>
        <div class="row between"><div class="small"><b>Repère journalier</b><div class="subtle">Un ordre d’idée, pas un objectif à atteindre</div></div>
          <${Stepper} value=${p.kcalTarget} step=${100} min=${1500} format=${(v) => kcalFmt(v)} onChange=${(v) => setProfile({ kcalTarget: v })} /></div>`}
      <div class="hr"></div>
      <div class="row between"><div class="small"><b>Afficher l’objectif de poids</b></div>
        <${Toggle} on=${p.showWeight} label="Objectif de poids" onChange=${(v) => setProfile({ showWeight: v })} /></div>
      ${p.showWeight && html`<div class="hr"></div>
        <div class="row between"><div class="small"><b>Objectif</b></div>
          <${Stepper} value=${p.weightGoal} step=${1} min=${35} format=${(v) => `${v} kg`} onChange=${(v) => setProfile({ weightGoal: v })} /></div>`}
    </div>
    <p class="subtle" style="margin-top:12px">Si un chiffre te pèse, masque-le. L’app fonctionne aussi bien sans.</p>
  </${Sheet}>`;
}
