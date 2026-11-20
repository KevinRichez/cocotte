import { html, useState, useMemo } from '../lib/h.js';
import { useStore, update, getState, restore, replaceState } from '../store.js';
import { migrate } from '../data/seed.js';
import { Icon, Chip, Badge, Seg, Sheet, Swipeable, Stepper, Empty, TierPicker } from '../components/ui.js';
import { ProductSearch, NutritionTable, Thumb, BrandPill } from '../components/ProductSearch.js';
import { ING, INGREDIENTS, CATEGORIES, fmtQty } from '../data/ingredients.js';
import { STORES, storeLabel, packLabel } from '../data/products.js';
import { EQUIPMENT, COOKING_EQUIPMENT } from '../data/recipes.js';
import { dlcInfo, fmtShort, addDays, today } from '../lib/dates.js';
import { kcalFmt, targets, GOAL_LABEL, getProduct, estimateDlc, TIER_META, TIER_KEYS, allRecipes, norm } from '../lib/engine.js';
import { addStock, updateStockItem, removeStockItem, setTier, setProfile } from '../actions.js';
import { toast } from '../lib/toast.js';

export function ProfileView() {
  const s = useStore();
  const tab = s.ui.profileTab || 'stock';
  const [goalOpen, setGoalOpen] = useState(false);
  const t = targets(s.profile);
  return html`<div class="screen">
    <header class="topbar"><h1 class="h1">Profil</h1></header>

    <button type="button" class="card tint-sage pad-lg tappable goal-card" onClick=${() => setGoalOpen(true)}>
      <div class="row" style="gap:14px">
        <span class="thumb" style="background:#fff">${t.dir === 'gain' ? '🌱' : t.dir === 'lose' ? '🍃' : '⚖️'}</span>
        <div class="grow">
          <div class="strong">${GOAL_LABEL[t.dir]}</div>
          <div class="subtle">${fmtKg(s.profile.weight)} → ${fmtKg(s.profile.weightGoal)} · ${kcalFmt(t.kcal)} kcal/j · ${t.prot} g prot.</div>
        </div>
        <${Icon} name="chevR" size=${18} class="muted" />
      </div>
    </button>

    <div style="margin-top:16px">
      <${Seg} value=${tab} onChange=${(v) => update((d) => { d.ui.profileTab = v; })} options=${[
        { value: 'stock', label: 'Placards & frigo' },
        { value: 'prefs', label: 'Préférences' },
      ]} />
    </div>
    ${tab === 'stock' ? html`<${StockTab} s=${s} />` : html`<${PrefsTab} s=${s} />`}
    <${ProfileSheet} open=${goalOpen} onClose=${() => setGoalOpen(false)} s=${s} />
  </div>`;
}

const fmtKg = (v) => `${String(v).replace('.', ',')} kg`;

function StockTab({ s }) {
  const [loc, setLoc] = useState('all');
  const [edit, setEdit] = useState(null);
  const [adding, setAdding] = useState(false);
  const inv = [...s.inventory].sort((a, b) => (a.dlc || '9999').localeCompare(b.dlc || '9999'));
  const soon = inv.filter((x) => { const d = dlcInfo(x.dlc); return d.days <= 2; });
  const shown = inv.filter((x) => loc === 'all' || x.location === loc);
  const frigoN = inv.filter((x) => x.location === 'frigo').length;

  const group = (title, icon, rows) => rows.length > 0 && html`<div>
    <div class="aisle-title"><span class="row" style="gap:6px"><${Icon} name=${icon} size=${14} />${title}</span><span>${rows.length}</span></div>
    <div class="list">${rows.map((x) => html`<${StockRow} key=${x.id} s=${s} x=${x} onEdit=${() => setEdit(x.id)} />`)}</div>
  </div>`;

  return html`<div>
    <button type="button" class="btn primary block lg" style="margin-top:14px" onClick=${() => setAdding(true)}><${Icon} name="plus" size=${19} />Ajouter un produit</button>

    ${soon.length > 0 && html`<div class="card tint-amber" style="margin-top:14px">
      <div class="strong small" style="margin-bottom:8px">À consommer bientôt</div>
      <div class="chips">${soon.map((x) => html`<button type="button" class="chip sm" style="background:#fff" onClick=${() => setEdit(x.id)}>${ING[x.ing]?.emoji || '🛒'} ${x.name} · ${dlcInfo(x.dlc).past ? 'à vérifier' : dlcInfo(x.dlc).label.toLowerCase()}</button>`)}</div>
    </div>`}

    <div style="margin-top:16px" class="chips">
      <${Chip} sm active=${loc === 'all'} onClick=${() => setLoc('all')}>Tout (${inv.length})</${Chip}>
      <${Chip} sm active=${loc === 'frigo'} onClick=${() => setLoc('frigo')}>🧊 Frigo (${frigoN})</${Chip}>
      <${Chip} sm active=${loc === 'placard'} onClick=${() => setLoc('placard')}>📦 Placards (${inv.length - frigoN})</${Chip}>
    </div>

    ${shown.length === 0 && html`<${Empty} emoji="📦" title="Rien ici pour l’instant">Ajoute un produit, importe un ticket ou valide tes courses.</${Empty}>`}
    ${(loc === 'all' || loc === 'frigo') && group('Frigo', 'fridge', shown.filter((x) => x.location === 'frigo'))}
    ${(loc === 'all' || loc === 'placard') && group('Placards', 'box', shown.filter((x) => x.location === 'placard'))}
    ${shown.length > 0 && html`<p class="subtle center" style="margin-top:12px">Glisse vers la gauche quand un produit est fini. Les recettes mangées le déduisent toutes seules.</p>`}

    <${StockEditSheet} id=${edit} s=${s} onClose=${() => setEdit(null)} />
    <${AddStockSheet} open=${adding} s=${s} onClose=${() => setAdding(false)} />
  </div>`;
}

const lotQty = (x) => (ING[x.ing] ? fmtQty(x.qty, ING[x.ing].unit, x.ing) : x.unit ? fmtQty(x.qty, x.unit) : `× ${x.qty}`);

function StockRow({ s, x, onEdit }) {
  const ing = ING[x.ing];
  const d = dlcInfo(x.dlc);
  return html`<${Swipeable} onLeft=${() => removeStockItem(x.id)} leftLabel="Fini">
    <div class="list-item" onClick=${onEdit} style="cursor:pointer">
      <${Thumb} p=${getProduct(s, x.productId)} emoji=${ing?.emoji} cls="thumb sm stock-thumb" />
      <div class="grow" style="min-width:0">
        <div class="small strong clamp2">${x.name}</div>
        <div class="subtle xs">${lotQty(x)}</div>
      </div>
      ${x.dlc && html`<${Badge} tone=${d.tone}>${d.past ? 'À vérifier' : d.label}</${Badge}>`}
    </div>
  </${Swipeable}>`;
}

function AddStockSheet({ open, s, onClose }) {
  const [pid, setPid] = useState(null);
  const [f, setF] = useState(null);
  const close = () => { setPid(null); setF(null); onClose(); };
  const choose = (id) => {
    const st = getState();
    const p = getProduct(st, id);
    if (!p) return;
    const ing = ING[p.ing];
    setPid(id);
    setF({ packs: 1, grams: p.size || (ing?.unit === 'pc' ? 1 : 100), dlc: estimateDlc(st, id, p.ing), location: p.storage || ing?.storage || 'placard' });
  };
  const p = pid ? getProduct(s, pid) : null;
  const ing = p && ING[p.ing];
  const hasPack = p && p.size && (ing || p.unit);
  const qty = !p ? 0 : hasPack ? p.size * f.packs : ing ? f.grams : f.packs;
  const sizeLabel = hasPack ? (ing ? packLabel(ing, p.size) : fmtQty(p.size, p.unit)) : '';
  const save = () => {
    addStock({ productId: p.id, ing: ing ? p.ing : null, name: p.name, qty, unit: !ing && hasPack ? p.unit : null, dlc: f.dlc || null, location: f.location, nutri: p.nutri });
    close();
  };
  const set = (patch) => setF({ ...f, ...patch });
  const nutri = p?.nutri || (ing && ing.unit !== 'pc' ? { kcal: ing.kcal, prot: ing.prot } : null);
  return html`<${Sheet} open=${open} onClose=${close} title=${p ? 'Ranger le produit' : 'Ajouter un produit'} tall=${!p}
    footer=${p ? html`<div class="row"><button type="button" class="btn ghost" onClick=${() => { setPid(null); setF(null); }}>Retour</button>
      <button type="button" class="btn primary grow" onClick=${save}><${Icon} name="check" size=${18} />Ranger au ${f.location === 'frigo' ? 'frigo' : 'placard'}</button></div>` : null}>
    ${!p && html`<${ProductSearch} s=${s} onPick=${choose} placeholder="Steak, riz, lait…" />`}
    ${p && html`<div>
      <div class="card flat row" style="gap:12px">
        ${p.image ? html`<img class="pick-img lg" src=${p.image} alt="" referrerpolicy="no-referrer" />` : html`<span class="thumb sm" style="background:var(--surface-2)">${p.emoji || ing?.emoji || '🛒'}</span>`}
        <div class="grow" style="min-width:0"><div class="strong clamp2">${p.name}</div><${BrandPill} p=${p} /></div>
      </div>
      <div class="card flat" style="margin-top:12px">
        <div class="row between"><b class="small">Quantité</b>
          ${hasPack
            ? html`<${Stepper} value=${f.packs} min=${1} max=${50} onChange=${(v) => set({ packs: v })} format=${(v) => `${v} × ${sizeLabel}`} />`
            : ing ? html`<${Stepper} value=${f.grams} min=${ing.unit === 'pc' ? 1 : 10} step=${ing.unit === 'pc' ? 1 : 50} onChange=${(v) => set({ grams: v })} format=${(v) => fmtQty(v, ing.unit, p.ing)} />`
            : html`<${Stepper} value=${f.packs} min=${1} max=${50} onChange=${(v) => set({ packs: v })} format=${(v) => `× ${v}`} />`}
        </div>
        <div class="hr"></div>
        <div class="row between"><b class="small">À consommer avant</b>
          <input type="date" class="field" style="width:170px;height:40px" value=${f.dlc || ''} onInput=${(e) => set({ dlc: e.currentTarget.value || null })} /></div>
        <div class="chips" style="margin-top:10px">${[[3, '3 jours'], [7, '1 semaine'], [30, '1 mois'], [180, '6 mois']].map(([n, l]) => html`<${Chip} sm active=${f.dlc === addDays(today(), n)} onClick=${() => set({ dlc: addDays(today(), n) })}>${l}</${Chip}>`)}</div>
        <div class="hr"></div>
        <div class="row between"><b class="small">Rangement</b>
          <div class="chips">
            <${Chip} sm active=${f.location === 'frigo'} onClick=${() => set({ location: 'frigo' })}>🧊 Frigo</${Chip}>
            <${Chip} sm active=${f.location === 'placard'} onClick=${() => set({ location: 'placard' })}>📦 Placard</${Chip}>
          </div></div>
      </div>
      ${nutri && html`<div style="margin-top:12px"><${NutritionTable} nutri=${nutri} /></div>`}
      ${!ing && html`<p class="subtle xs" style="margin-top:10px">Produit non relié à un aliment : il ne sera pas déduit automatiquement par les recettes.</p>`}
    </div>`}
  </${Sheet}>`;
}

function StockEditSheet({ id, s, onClose }) {
  const x = s.inventory.find((i) => i.id === id);
  if (!x) return html`<${Sheet} open=${false} />`;
  const ing = ING[x.ing];
  const unit = ing?.unit || x.unit;
  const step = !unit || unit === 'pc' ? 1 : unit === 'ml' ? 100 : 50;
  const nutri = x.nutri || getProduct(s, x.productId)?.nutri || (ing && ing.unit !== 'pc' ? { kcal: ing.kcal, prot: ing.prot } : null);
  return html`<${Sheet} open=${true} onClose=${onClose} title=${x.name} subtitle=${x.addedAt ? `Ajouté le ${fmtShort(x.addedAt)}` : ''}
    footer=${html`<div class="row">
      <button type="button" class="btn ghost" onClick=${() => { removeStockItem(x.id); onClose(); }}><${Icon} name="trash" size=${17} />Fini</button>
      <button type="button" class="btn primary grow" onClick=${onClose}>OK</button></div>`}>
    <label class="label" for="st-name">Nom</label>
    <input id="st-name" class="field" maxlength="80" value=${x.name} onChange=${(e) => { const v = e.currentTarget.value.trim(); if (v) updateStockItem(x.id, { name: v.slice(0, 80) }); }} />
    <div class="card flat" style="margin-top:12px">
      <div class="row between"><span class="small strong">Quantité</span>
        <${Stepper} value=${x.qty} min=${0} step=${step} format=${(v) => (unit ? fmtQty(v, unit, x.ing) : v)}
          onChange=${(v) => { if (v <= 0) { removeStockItem(x.id); onClose(); } else updateStockItem(x.id, { qty: v }); }} /></div>
      <div class="hr"></div>
      <div class="row between"><span class="small strong">Rangement</span>
        <div class="chips">
          <${Chip} sm active=${x.location === 'frigo'} onClick=${() => updateStockItem(x.id, { location: 'frigo' })}>🧊 Frigo</${Chip}>
          <${Chip} sm active=${x.location === 'placard'} onClick=${() => updateStockItem(x.id, { location: 'placard' })}>📦 Placard</${Chip}>
        </div></div>
      <div class="hr"></div>
      <div class="row between"><span class="small strong">À consommer avant</span>
        <input type="date" class="field" style="width:170px;height:40px" value=${x.dlc || ''} onInput=${(e) => updateStockItem(x.id, { dlc: e.currentTarget.value || null })} /></div>
    </div>
    <div class="label" style="margin-top:16px">Ouvert ? Raccourcir la date</div>
    <div class="chips">${[1, 2, 3, 5].map((n) => html`<${Chip} sm onClick=${() => { updateStockItem(x.id, { dlc: addDays(today(), n) }); toast(`Date réglée à ${n} jour${n > 1 ? 's' : ''}`); }}>${n === 1 ? 'Demain' : `Dans ${n} j`}</${Chip}>`)}</div>
    ${nutri && html`<div style="margin-top:14px"><${NutritionTable} nutri=${nutri} /></div>`}
  </${Sheet}>`;
}

function PrefsTab({ s }) {
  const [kind, setKind] = useState('ing');
  const [picking, setPicking] = useState(false);
  const items = kind === 'recipe'
    ? allRecipes(s).map((r) => ({ id: r.id, name: r.name, emoji: r.emoji }))
    : INGREDIENTS.filter((i) => (kind === 'epice' ? i.cat === 'epice' : i.cat !== 'epice')).map((i) => ({ id: i.id, name: i.name, emoji: i.emoji }));
  const prefKind = kind === 'recipe' ? 'recipe' : 'ing';
  const map = s.prefs[prefKind];
  const byId = Object.fromEntries(items.map((x) => [x.id, x]));
  return html`<div style="margin-top:14px">
    <div class="meal-tabs" style="margin-top:0">
      ${[['ing', 'Aliments'], ['epice', 'Épices'], ['recipe', 'Recettes']].map(([k, l]) => html`<button type="button" class=${kind === k ? 'on' : ''} onClick=${() => setKind(k)}>${l}</button>`)}
    </div>
    <div class="stack" style="margin-top:12px">
      ${TIER_KEYS.map((tk) => {
        const ids = Object.keys(map).filter((id) => map[id] === tk && byId[id]);
        return html`<div class="card" key=${tk}>
          <div class="row between"><div class="h3">${TIER_META[tk].emoji} ${TIER_META[tk].label}</div><${Badge} tone=${TIER_META[tk].tone}>${ids.length}</${Badge}></div>
          <div class="subtle" style="margin:4px 0 10px">${TIER_META[tk].hint}</div>
          <div class="chips">${ids.map((id) => html`<${Chip} sm onClick=${() => setTier(prefKind, id, null)} title="Retirer">${byId[id].emoji} ${byId[id].name}<span class="x"><${Icon} name="x" size=${13} /></span></${Chip}>`)}</div>
        </div>`;
      })}
      <button type="button" class="btn soft block" onClick=${() => setPicking(true)}><${Icon} name="plus" size=${16} />Classer des ${kind === 'recipe' ? 'recettes' : kind === 'epice' ? 'épices' : 'aliments'}</button>
    </div>
    <${TierListSheet} open=${picking} title=${kind === 'recipe' ? 'Mes recettes' : kind === 'epice' ? 'Mes épices' : 'Mes aliments'} items=${items} map=${map}
      grouped=${kind === 'ing'} onSet=${(id, t) => setTier(prefKind, id, t)} onClose=${() => setPicking(false)} />
  </div>`;
}

function TierListSheet({ open, title, items, map, onSet, onClose, grouped }) {
  const [q, setQ] = useState('');
  const nq = norm(q);
  const list = items.filter((x) => !nq || norm(x.name).includes(nq));
  const groups = grouped && !nq
    ? Object.entries(CATEGORIES).filter(([k]) => k !== 'epice').map(([k, c]) => ({ k, label: `${c.emoji} ${c.label}`, rows: list.filter((x) => ING[x.id]?.cat === k) })).filter((g) => g.rows.length)
    : [{ k: 'all', label: null, rows: list }];
  return html`<${Sheet} open=${open} onClose=${() => { setQ(''); onClose(); }} title=${title} tall>
    <div class="search" style="margin-bottom:12px"><${Icon} name="search" size=${18} />
      <input class="field" type="search" placeholder="Chercher" value=${q} onInput=${(e) => setQ(e.currentTarget.value)} /></div>
    <div class="tier-legend">${TIER_KEYS.map((k) => html`<span>${TIER_META[k].emoji} ${TIER_META[k].label}</span>`)}</div>
    ${groups.map((g) => html`<div key=${g.k}>
      ${g.label && html`<div class="aisle-title">${g.label}</div>`}
      <div class="list">${g.rows.map((x) => html`<div class="list-item tier-row" key=${x.id}>
        <span class="tier-emoji">${x.emoji}</span>
        <span class="grow small strong clamp2">${x.name}</span>
        <${TierPicker} compact value=${map[x.id] || null} onChange=${(t) => onSet(x.id, t)} />
      </div>`)}</div>
    </div>`)}
  </${Sheet}>`;
}

function exportData() {
  const blob = new Blob([JSON.stringify(getState())], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `cocotte-sauvegarde-${today()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('Sauvegarde téléchargée');
}

async function importData(e) {
  const f = e.currentTarget.files?.[0];
  e.currentTarget.value = '';
  if (!f || f.size > 20 * 1024 * 1024) return;
  try {
    const data = migrate(JSON.parse(await f.text()));
    if (!data) throw new Error();
    const prev = getState();
    replaceState(data);
    toast('Sauvegarde restaurée', { action: 'Annuler', onAction: () => restore(prev) });
  } catch { toast('Ce fichier n’est pas une sauvegarde Cocotte'); }
}

const ACTIVITY = [[1.2, 'Plutôt assis'], [1.4, 'Un peu actif'], [1.6, 'Actif'], [1.8, 'Très actif']];

function ProfileSheet({ open, onClose, s }) {
  const p = s.profile;
  const t = targets(p);
  const reset = () => {
    const prev = getState();
    update((d) => { d.profile.onboarded = false; });
    toast('Accueil relancé', { action: 'Annuler', onAction: () => restore(prev) });
  };
  return html`<${Sheet} open=${open} onClose=${onClose} title="Mon profil"
    footer=${html`<button type="button" class="btn primary block" onClick=${onClose}>OK</button>`}>
    <div class="ob-result" style="margin-top:0">
      <span>${GOAL_LABEL[t.dir]}</span>
      <b class="num">${kcalFmt(t.kcal)} kcal / jour</b>
      <small>${t.prot} g de protéines · se recalcule tout seul</small>
    </div>
    <div class="card flat" style="margin-top:12px">
      <div class="row between"><b class="small">Poids actuel</b><${Stepper} value=${p.weight} min=${30} max=${250} step=${0.5} onChange=${(v) => setProfile({ weight: v })} format=${fmtKg} /></div>
      <div class="hr"></div>
      <div class="row between"><b class="small">Poids visé</b><${Stepper} value=${p.weightGoal} min=${30} max=${250} step=${0.5} onChange=${(v) => setProfile({ weightGoal: v })} format=${fmtKg} /></div>
      <div class="hr"></div>
      <div class="row between"><b class="small">Rythme</b><div class="chips">
        <${Chip} sm active=${p.pace !== 'actif'} onClick=${() => setProfile({ pace: 'doux' })}>Doux</${Chip}>
        <${Chip} sm active=${p.pace === 'actif'} onClick=${() => setProfile({ pace: 'actif' })}>Plus rapide</${Chip}></div></div>
      <div class="hr"></div>
      <div class="row between"><b class="small">Taille</b><${Stepper} value=${p.height} min=${130} max=${220} onChange=${(v) => setProfile({ height: v })} format=${(v) => `${v} cm`} /></div>
      <div class="hr"></div>
      <div class="row between"><b class="small">Âge</b><${Stepper} value=${p.age} min=${14} max=${99} onChange=${(v) => setProfile({ age: v })} format=${(v) => `${v} ans`} /></div>
      <div class="hr"></div>
      <div class="row between"><b class="small">Je suis</b><div class="chips">
        ${[['f', 'Femme'], ['m', 'Homme'], ['x', 'Autre']].map(([v, l]) => html`<${Chip} sm active=${p.sex === v} onClick=${() => setProfile({ sex: v })}>${l}</${Chip}>`)}</div></div>
    </div>
    <div class="label" style="margin-top:14px">Activité</div>
    <div class="chips">${ACTIVITY.map(([v, l]) => html`<${Chip} sm active=${p.activity === v} onClick=${() => setProfile({ activity: v })}>${l}</${Chip}>`)}</div>
    <div class="label" style="margin-top:14px">Mes magasins</div>
    <div class="chips">${Object.entries(STORES).map(([k, st]) => {
      const on = p.stores.includes(k);
      return html`<${Chip} sm active=${on} onClick=${() => { const next = on ? p.stores.filter((x) => x !== k) : [...p.stores, k]; if (next.length) setProfile({ stores: next }); }}>${st.name}</${Chip}>`;
    })}</div>
    <div class="label" style="margin-top:14px">Mon matériel</div>
    <div class="chips">${COOKING_EQUIPMENT.map((k) => {
      const on = p.equipment.includes(k);
      return html`<${Chip} sm active=${on} onClick=${() => setProfile({ equipment: on ? p.equipment.filter((x) => x !== k) : [...p.equipment, k] })}>${EQUIPMENT[k].emoji} ${EQUIPMENT[k].label}</${Chip}>`;
    })}</div>
    <div class="card flat" style="margin-top:16px">
      <div class="small">Tout est stocké sur ton téléphone. Les recherches de produits en ligne passent par Open Food Facts.</div>
      <div class="row wrap" style="gap:8px;margin-top:10px">
        <button type="button" class="btn ghost sm" onClick=${exportData}><${Icon} name="upload" size=${15} />Sauvegarder mes données</button>
        <label class="btn ghost sm" style="cursor:pointer"><${Icon} name="refresh" size=${15} />Restaurer une sauvegarde
          <input type="file" accept="application/json,.json" hidden onChange=${importData} /></label>
        <button type="button" class="btn ghost sm" onClick=${() => { onClose(); reset(); }}><${Icon} name="refresh" size=${15} />Refaire l’accueil</button>
      </div>
    </div>
  </${Sheet}>`;
}
