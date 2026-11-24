import { html, useState, useMemo } from '../lib/h.js';
import { useStore, update, getState, restore, replaceState, listBackups } from '../store.js';
import { migrate } from '../data/seed.js';
import { Icon, Chip, Badge, Seg, Sheet, Swipeable, Stepper, Empty, TierPicker } from '../components/ui.js';
import { ProductSearch, NutritionTable, Thumb, BrandPill, ScanSheet, IngredientSearch } from '../components/ProductSearch.js';
import { ING, INGREDIENTS, CATEGORIES, fmtQty } from '../data/ingredients.js';
import { STORES, storeLabel, packLabel } from '../data/products.js';
import { EQUIPMENT, COOKING_EQUIPMENT } from '../data/recipes.js';
import { dlcInfo, fmtShort, addDays, today } from '../lib/dates.js';
import { kcalFmt, targets, GOAL_LABEL, getProduct, estimateDlc, TIER_META, TIER_KEYS, allRecipes, norm, cleanName, productTitle, productSize } from '../lib/engine.js';
import { addStock, updateStockItem, removeStockItem, setTier, setProfile, enrichFromScan, resetStockAndHistory, restockCandidates, restockProducts, relinkStockItem, setProductSize, updateProduct, deleteProduct } from '../actions.js';
import { toast } from '../lib/toast.js';
import { confirmAction } from '../lib/confirm.js';
import { PRODUCE_CREDITS } from '../data/produce.js';

export function ProfileView() {
  const s = useStore();
  const tab = s.ui.profileTab || 'stock';
  const [goalOpen, setGoalOpen] = useState(false);
  const [settings, setSettings] = useState(false);
  const t = targets(s.profile);
  return html`<div class="screen">
    <header class="topbar"><h1 class="h1">Profil</h1>
      <button type="button" class="icon-btn" aria-label="Paramètres" onClick=${() => setSettings(true)}><${Icon} name="gear" size=${20} /></button></header>
    <${SettingsSheet} open=${settings} onClose=${() => setSettings(false)} s=${s} />

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
        { value: 'products', label: 'Mes produits' },
        { value: 'prefs', label: 'Préférences' },
      ]} />
    </div>
    ${tab === 'stock' ? html`<${StockTab} s=${s} />` : tab === 'products' ? html`<${ProductsTab} s=${s} />` : html`<${PrefsTab} s=${s} />`}
    <${ProfileSheet} open=${goalOpen} onClose=${() => setGoalOpen(false)} s=${s} />
  </div>`;
}

const fmtKg = (v) => `${String(v).replace('.', ',')} kg`;

function StockTab({ s }) {
  const [loc, setLoc] = useState('all');
  const [edit, setEdit] = useState(null);
  const [adding, setAdding] = useState(false);
  const [restock, setRestock] = useState(false);
  const cands = restockCandidates(s);
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
    ${cands.length > 0 && s.inventory.length === 0 && html`<button type="button" class="btn soft block" style="margin-top:10px" onClick=${() => setRestock(true)}><${Icon} name="refresh" size=${17} />Remettre en stock mes produits connus (${cands.length})</button>`}

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
    <${RestockSheet} open=${restock} cands=${cands} onClose=${() => setRestock(false)} />
  </div>`;
}

function lotQty(x, p) {
  if (x.leftoverOf) return `${String(x.qty).replace('.', ',')} portion${x.qty > 1 ? 's' : ''} · plat cuisiné`;
  const unit = ING[x.ing]?.unit || x.unit;
  const pUnit = p?.unit || ING[p?.ing]?.unit;
  if (p?.size && unit && unit !== 'pc' && pUnit === unit) {
    const n = x.qty / p.size;
    if (n >= 1 && Math.abs(n - Math.round(n)) < 0.01) return Math.round(n) === 1 ? productSize(p) : `${Math.round(n)} × ${productSize(p)}`;
  }
  return unit ? fmtQty(x.qty, unit, x.ing) : `× ${x.qty}`;
}

function StockRow({ s, x, onEdit }) {
  const ing = ING[x.ing];
  const d = dlcInfo(x.dlc);
  return html`<${Swipeable} onLeft=${() => removeStockItem(x.id)} leftLabel="Fini">
    <div class="list-item" onClick=${onEdit} style="cursor:pointer">
      <${Thumb} p=${getProduct(s, x.productId)} ing=${x.ing} emoji=${ing?.emoji} cls="thumb sm stock-thumb" />
      <div class="grow" style="min-width:0">
        <div class="small strong clamp2">${cleanName(x.name)}</div>
        <div class="subtle xs">${lotQty(x, getProduct(s, x.productId))}</div>
      </div>
      ${x.dlc && html`<${Badge} tone=${d.tone}>${d.past ? 'À vérifier' : d.label}</${Badge}>`}
    </div>
  </${Swipeable}>`;
}

function RestockSheet({ open, cands, onClose }) {
  const [off, setOff] = useState({});
  const ids = cands.filter((p) => !off[p.id]).map((p) => p.id);
  const toggle = (id) => setOff({ ...off, [id]: !off[id] });
  const go = () => { restockProducts(ids); setOff({}); onClose(); };
  return html`<${Sheet} open=${open} onClose=${onClose} title="Remettre en stock" tall
    footer=${html`<button type="button" class="btn primary block lg" disabled=${!ids.length} onClick=${go}><${Icon} name="check" size=${18} />Ranger ${ids.length} produit${ids.length > 1 ? 's' : ''}</button>`}>
    <p class="subtle" style="margin:0 2px 10px">Tes produits déjà scannés ou importés, avec leur photo, leur nom et leur grammage. Décoche ceux que tu n’as plus. Les dates sont estimées, tu peux les ajuster ensuite.</p>
    <div class="row" style="gap:8px;margin-bottom:8px">
      <button type="button" class="btn ghost sm" onClick=${() => setOff({})}>Tout cocher</button>
      <button type="button" class="btn ghost sm" onClick=${() => setOff(Object.fromEntries(cands.map((p) => [p.id, true])))}>Tout décocher</button>
    </div>
    <div class="list">${cands.map((p) => html`<label class="list-item" key=${p.id} style="cursor:pointer">
      <input type="checkbox" checked=${!off[p.id]} onChange=${() => toggle(p.id)} style="width:20px;height:20px;accent-color:var(--primary, #1F4D3A)" />
      ${p.image ? html`<img class="pick-img" src=${p.image} alt="" loading="lazy" referrerpolicy="no-referrer" />` : html`<span class="thumb sm" style="background:var(--surface-2)">${p.emoji || ING[p.ing]?.emoji || '🛒'}</span>`}
      <div class="grow" style="min-width:0"><div class="small strong clamp2">${productTitle(p)}</div>
        <div class="subtle xs">${[productSize(p), (p.storage || ING[p.ing]?.storage) === 'frigo' ? 'Frigo' : 'Placard'].filter(Boolean).join(' · ')}</div></div>
    </label>`)}</div>
  </${Sheet}>`;
}

function AddStockSheet({ open, s, onClose }) {
  const [pid, setPid] = useState(null);
  const [f, setF] = useState(null);
  const [burst, setBurst] = useState(false);
  const [searchKey, setSearchKey] = useState(0);
  const close = () => { setPid(null); setF(null); setBurst(false); setSearchKey(0); onClose(); };
  const choose = (id, via) => {
    setBurst(via === 'scan');
    const st = getState();
    const p = getProduct(st, id);
    if (!p) return;
    const ing = ING[p.ing];
    setPid(id);
    setF({ packs: 1, grams: p.size || (ing?.unit === 'pc' ? 1 : 100), unit: p.unit || 'pc', dlc: estimateDlc(st, id, p.ing), location: p.storage || ing?.storage || 'placard' });
  };
  const p = pid ? getProduct(s, pid) : null;
  const ing = p && ING[p.ing];
  const hasPack = p && p.size && (ing || p.unit);
  const freeUnit = p && !ing && !hasPack ? f.unit : null;
  const qty = !p ? 0 : hasPack ? p.size * f.packs : ing ? f.grams : freeUnit && freeUnit !== 'pc' ? f.grams : f.packs;
  const sizeLabel = hasPack ? (ing ? packLabel(ing, p.size) : fmtQty(p.size, p.unit)) : '';
  const save = (next) => {
    addStock({ productId: p.id, ing: ing ? p.ing : null, name: productTitle(p), qty, unit: !ing ? (hasPack ? p.unit : freeUnit) : null, dlc: f.dlc || null, location: f.location, nutri: p.nutri });
    if (next) { setPid(null); setF(null); setSearchKey(searchKey + 1); } else close();
  };
  const set = (patch) => setF({ ...f, ...patch });
  const nutri = p?.nutri || (ing && ing.unit !== 'pc' ? { kcal: ing.kcal, prot: ing.prot } : null);
  return html`<${Sheet} open=${open} onClose=${close} title=${p ? 'Ranger le produit' : 'Ajouter un produit'} tall=${!p}
    footer=${p ? (burst
      ? html`<div class="row"><button type="button" class="btn ghost" onClick=${() => save(false)}>Ranger et fermer</button>
          <button type="button" class="btn primary grow" onClick=${() => save(true)}><${Icon} name="barcode" size=${18} />Ranger · scanner le suivant</button></div>`
      : html`<div class="row"><button type="button" class="btn ghost" onClick=${() => { setPid(null); setF(null); }}>Retour</button>
          <button type="button" class="btn primary grow" onClick=${() => save(false)}><${Icon} name="check" size=${18} />Ranger au ${f.location === 'frigo' ? 'frigo' : 'placard'}</button></div>`) : null}>
    ${!p && html`<${ProductSearch} key=${searchKey} s=${s} onPick=${choose} autoScan=${searchKey > 0} placeholder="Steak, riz, lait…" />`}
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
            : freeUnit && freeUnit !== 'pc' ? html`<${Stepper} value=${f.grams} min=${10} step=${freeUnit === 'ml' ? 50 : 50} onChange=${(v) => set({ grams: v })} format=${(v) => fmtQty(v, freeUnit)} />`
            : html`<${Stepper} value=${f.packs} min=${1} max=${50} onChange=${(v) => set({ packs: v })} format=${(v) => `${v} pièce${v > 1 ? 's' : ''}`} />`}
        </div>
        ${freeUnit && html`<div class="row between" style="margin-top:10px"><b class="small">Unité</b>
          <div class="chips">${[['g', 'g'], ['ml', 'ml'], ['pc', 'pièces']].map(([u, l]) => html`<${Chip} sm active=${freeUnit === u} onClick=${() => set({ unit: u, grams: f.grams || 100 })}>${l}</${Chip}>`)}</div></div>`}
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

function ProductsTab({ s }) {
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState(null);
  const ids = [...new Set([...s.customProducts.map((p) => p.id).reverse(), ...Object.keys(s.productOverrides || {})])];
  const nq = norm(q);
  const list = ids.map((id) => getProduct(s, id)).filter((p) => p && (!nq || norm(`${productTitle(p)} ${p.name || ''} ${ING[p.ing]?.name || ''}`).includes(nq)));
  return html`<div style="margin-top:14px">
    <p class="subtle" style="margin:0 2px 10px">Toutes tes fiches enregistrées (tickets, scans, créations), même hors stock. Touche-en une pour corriger son nom, son format ou son aliment.</p>
    <div class="search"><${Icon} name="search" size=${18} />
      <input class="field" type="search" placeholder="Chercher dans mes produits" value=${q} onInput=${(e) => setQ(e.currentTarget.value)} /></div>
    ${list.length === 0 && html`<${Empty} emoji="🧾" title="Aucune fiche">Importe un ticket ou scanne un produit.</${Empty}>`}
    <div class="list" style="margin-top:10px">${list.map((p) => html`<button type="button" class="list-item" style="width:100%;text-align:left" key=${p.id} onClick=${() => setEdit(p.id)}>
      <${Thumb} p=${p} cls="thumb sm stock-thumb" />
      <div class="grow" style="min-width:0"><div class="small strong clamp2">${productTitle(p)}</div>
        <div class="subtle xs">${[productSize(p), p.ing ? ING[p.ing]?.name : 'Aucun aliment', p.ignored ? 'ignoré' : ''].filter(Boolean).join(' · ')}</div></div>
      <${Icon} name="edit" size=${15} class="muted" />
    </button>`)}</div>
    <${ProductEditSheet} id=${edit} s=${s} onClose=${() => setEdit(null)} />
  </div>`;
}

export function ProductEditSheet({ id, s, onClose }) {
  const [scanning, setScanning] = useState(false);
  const p = id && getProduct(s, id);
  if (!p) return html`<${Sheet} open=${false} />`;
  const unit = p.unit || ING[p.ing]?.unit || 'pc';
  const del = async () => {
    if (await confirmAction({ title: 'Supprimer cette fiche ?', message: 'Les produits déjà en stock restent, mais ne seront plus reliés à cette fiche.', confirm: 'Supprimer' })) { deleteProduct(p.id); onClose(); }
  };
  return html`<${Sheet} open=${true} onClose=${onClose} title="Fiche produit" subtitle=${p.custom ? 'Produit enregistré' : 'Produit du catalogue'}
    footer=${html`<div class="row">${p.custom && html`<button type="button" class="btn ghost" onClick=${del}><${Icon} name="trash" size=${16} />Supprimer</button>`}
      <button type="button" class="btn primary grow" onClick=${onClose}>OK</button></div>`}>
    <div class="row" style="gap:12px;margin-bottom:12px">
      <${Thumb} p=${p} cls="thumb sm stock-thumb" />
      <button type="button" class="btn outline grow" onClick=${() => setScanning(true)}><${Icon} name="barcode" size=${18} />${p.barcode ? 'Re-scanner' : 'Scanner'} (photo, nutrition)</button>
    </div>
    <${ScanSheet} open=${scanning} onClose=${() => setScanning(false)}
      onFound=${(o) => { setScanning(false); enrichFromScan({ productId: p.id }, o); }}
      onUnknown=${() => { setScanning(false); toast('Produit inconnu d’Open Food Facts'); }} />
    <label class="label" for="pe-name">Nom</label>
    <input id="pe-name" class="field" maxlength="80" value=${productTitle(p)} onChange=${(e) => { const v = e.currentTarget.value.trim(); if (v) updateProduct(p.id, { name: v.slice(0, 80) }); }} />
    <div class="card flat" style="margin-top:12px">
      <div class="row between"><span class="small strong">Format d’un paquet</span>
        <div class="row" style="gap:6px"><input class="field num" style="width:96px;height:40px" inputmode="decimal" placeholder="Ex : 1000"
          value=${p.size ?? ''} onChange=${(e) => { const v = parseFloat(e.currentTarget.value.replace(',', '.')); updateProduct(p.id, { size: isFinite(v) && v > 0 ? v : null, unit }); }} />
          <span class="small">${unit === 'pc' ? 'pièces' : unit}</span></div></div>
      <div class="hr"></div>
      <div class="row between"><span class="small strong">Unité</span>
        <div class="chips">${[['g', 'g'], ['ml', 'ml'], ['pc', 'pièces']].map(([u, l]) => html`<${Chip} sm active=${unit === u} onClick=${() => { if (u !== unit) updateProduct(p.id, { unit: u, ...(p.ing && ING[p.ing].unit !== u ? { ing: null } : {}) }); }}>${l}</${Chip}>`)}</div></div>
      <div class="hr"></div>
      <div class="row between"><span class="small strong">Rangement</span>
        <div class="chips">
          <${Chip} sm active=${(p.storage || ING[p.ing]?.storage) === 'frigo'} onClick=${() => updateProduct(p.id, { storage: 'frigo' })}>🧊 Frigo</${Chip}>
          <${Chip} sm active=${(p.storage || ING[p.ing]?.storage) !== 'frigo'} onClick=${() => updateProduct(p.id, { storage: 'placard' })}>📦 Placard</${Chip}>
        </div></div>
    </div>
    <div class="small strong" style="margin:14px 2px 6px">Compte dans les recettes comme</div>
    <${IngredientSearch} value=${p.ing} allowNone onPick=${(v) => updateProduct(p.id, { ing: v })} />
    <p class="subtle xs" style="margin-top:10px">Tes corrections sont reprises partout : stock, liste, recettes et prochains tickets.</p>
  </${Sheet}>`;
}

function StockEditSheet({ id, s, onClose }) {
  const [scanning, setScanning] = useState(false);
  const [editProduct, setEditProduct] = useState(false);
  const x = s.inventory.find((i) => i.id === id);
  if (!x) return html`<${Sheet} open=${false} />`;
  const ing = ING[x.ing];
  const unit = ing?.unit || x.unit;
  const prodX = getProduct(s, x.productId);
  const packSize = prodX?.size && (prodX.unit || ING[prodX.ing]?.unit) === unit ? prodX.size : null;
  const step = !unit || unit === 'pc' ? 1 : x.qty <= 100 ? 10 : 50;
  const askRemove = async () => {
    if (await confirmAction({ title: `Plus de ${cleanName(x.name).toLowerCase()} ?`, message: 'Le produit sera retiré de ton stock. Sa fiche reste enregistrée.', confirm: 'Retirer du stock', cancel: 'Garder' })) { removeStockItem(x.id); onClose(); }
  };
  const nutri = x.nutri || getProduct(s, x.productId)?.nutri || (ing && ing.unit !== 'pc' ? { kcal: ing.kcal, prot: ing.prot } : null);
  return html`<${Sheet} open=${true} onClose=${onClose} title=${cleanName(x.name)} subtitle=${x.addedAt ? `Ajouté le ${fmtShort(x.addedAt)}` : ''}
    footer=${html`<div class="row">
      <button type="button" class="btn ghost" onClick=${() => { removeStockItem(x.id); onClose(); }}><${Icon} name="trash" size=${17} />Fini</button>
      <button type="button" class="btn primary grow" onClick=${onClose}>OK</button></div>`}>
    <div class="row" style="gap:12px;margin-bottom:12px">
      <${Thumb} p=${getProduct(s, x.productId)} emoji=${ing?.emoji} cls="thumb sm stock-thumb" />
      <button type="button" class="btn outline grow" onClick=${() => setScanning(true)}><${Icon} name="barcode" size=${18} />${getProduct(s, x.productId)?.barcode ? 'Re-scanner le produit' : 'Scanner ce produit'}</button>
    </div>
    <p class="subtle xs" style="margin:-4px 2px 12px">Le scan ajoute la vraie photo, la nutrition et le grammage exact à la fiche. Elle sera réutilisée pour tes listes et tes prochains tickets.</p>
    <${ScanSheet} open=${scanning} onClose=${() => setScanning(false)}
      onFound=${(o) => { setScanning(false); enrichFromScan({ lotId: x.id }, o); }}
      onUnknown=${() => { setScanning(false); toast('Produit inconnu d’Open Food Facts'); }} />
    ${x.productId && html`<button type="button" class="btn ghost sm block" style="margin-bottom:12px" onClick=${() => setEditProduct(true)}><${Icon} name="edit" size=${15} />Modifier la fiche produit (nom, format, aliment)</button>`}
    ${editProduct && html`<${ProductEditSheet} id=${x.productId} s=${s} onClose=${() => setEditProduct(false)} />`}
    <label class="label" for="st-name">Nom</label>
    <input id="st-name" class="field" maxlength="80" value=${x.name} onChange=${(e) => { const v = e.currentTarget.value.trim(); if (v) updateStockItem(x.id, { name: v.slice(0, 80) }); }} />
    <div class="card flat" style="margin-top:12px">
      <div class="row between"><span class="small strong">Quantité</span>
        <${Stepper} value=${x.qty} min=${0} step=${step} format=${(v) => lotQty({ ...x, qty: v }, prodX)}
          onChange=${(v) => { if (v <= 0) askRemove(); else updateStockItem(x.id, { qty: v }); }} /></div>
      ${x.productId && unit && unit !== 'pc' && html`<div class="hr"></div>
      <div class="row between"><span class="small strong">Format d’un paquet</span>
        <div class="row" style="gap:6px"><input class="field num" style="width:96px;height:40px" inputmode="decimal" placeholder="Ex : 1000"
          value=${packSize ?? ''} onChange=${(e) => { const v = parseFloat(e.currentTarget.value.replace(',', '.')); setProductSize(x.id, isFinite(v) && v > 0 ? v : null); }} /><span class="small">${unit}</span></div></div>
      <div class="subtle xs" style="margin-top:6px">Ex : 3000 g en stock avec un format de 1000 g s’affiche « 3 × 1 kg ». La recette déduit les grammes, le format du paquet ne change jamais.</div>`}
      <div class="hr"></div>
      <div class="row between"><span class="small strong">Unité</span>
        <div class="chips">${[['g', 'g'], ['ml', 'ml'], ['pc', 'pièces']].map(([u, l]) => html`<${Chip} sm active=${unit === u} onClick=${() => { if (unit !== u) relinkStockItem(x.id, { ing: ing?.unit === u ? x.ing : null, unit: u }); }}>${l}</${Chip}>`)}</div></div>
      <div class="hr"></div>
      <div class="small strong" style="margin-bottom:6px">Compte dans les recettes comme</div>
      ${!x.ing && html`<div class="subtle xs" style="margin-bottom:6px">Aucun aliment : ce produit n’est pas déduit par les recettes.</div>`}
      <${IngredientSearch} value=${x.ing} allowNone onPick=${(v) => relinkStockItem(x.id, { ing: v, unit })} />
      <div class="subtle xs" style="margin-top:6px">Ex : tes tortillas comptent comme « Tortillas de blé ». Ton choix est retenu pour tes prochains tickets.</div>
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
    <button type="button" class="btn soft block" style="margin-top:12px" onClick=${() => setPicking(true)}><${Icon} name="plus" size=${16} />Classer des ${kind === 'recipe' ? 'recettes' : kind === 'epice' ? 'épices' : 'aliments'}</button>
    <div class="stack" style="margin-top:12px">
      ${TIER_KEYS.map((tk) => {
        const ids = Object.keys(map).filter((id) => map[id] === tk && byId[id]);
        return html`<div class="card" key=${tk}>
          <div class="row between"><div class="h3">${TIER_META[tk].emoji} ${TIER_META[tk].label}</div><${Badge} tone=${TIER_META[tk].tone}>${ids.length}</${Badge}></div>
          <div class="subtle" style="margin:4px 0 10px">${TIER_META[tk].hint}</div>
          <div class="chips">${ids.map((id) => html`<${Chip} sm onClick=${() => setTier(prefKind, id, null)} title="Retirer">${byId[id].emoji} ${byId[id].name}<span class="x"><${Icon} name="x" size=${13} /></span></${Chip}>`)}</div>
        </div>`;
      })}
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
    if (!(await confirmAction({ title: 'Restaurer ce fichier ?', message: 'Toutes tes données actuelles seront remplacées par celles du fichier.', confirm: 'Restaurer' }))) return;
    const prev = getState();
    replaceState(data);
    toast('Sauvegarde restaurée', { action: 'Annuler', onAction: () => restore(prev) });
  } catch { toast('Ce fichier n’est pas une sauvegarde Cocotte'); }
}

function AutoBackups({ onClose }) {
  const list = listBackups();
  if (!list.length) return null;
  const when = (iso) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  };
  const back = async (b) => {
    if (!(await confirmAction({ title: 'Restaurer cette sauvegarde ?', message: 'Ton stock, ton historique et tes produits reviennent à cet état. Ta semaine et tes goûts ne bougent pas.', confirm: 'Restaurer' }))) return;
    const prev = getState();
    const next = { ...b.state, plan: prev.plan, prefs: prev.prefs, profile: prev.profile, ui: prev.ui };
    replaceState(next);
    onClose();
    toast('Stock et historique restaurés', { action: 'Annuler', onAction: () => restore(prev), duration: 8000 });
  };
  return html`<div class="card flat" style="margin-top:12px">
    <b class="small">Sauvegardes automatiques</b>
    <div class="subtle xs" style="margin:2px 0 8px">Prises chaque jour et avant chaque remise à zéro. Restaurer remet le stock, l’historique et les produits, sans toucher à ta semaine ni à tes goûts.</div>
    <div class="list">${list.map((b) => html`<div class="list-item" key=${b.at}>
      <div class="grow" style="min-width:0"><div class="small strong">${when(b.at)}</div>
        <div class="subtle xs">${b.stock} produit${b.stock > 1 ? 's' : ''} en stock · ${b.tickets} course${b.tickets > 1 ? 's' : ''}</div></div>
      <button type="button" class="btn soft sm" onClick=${() => back(b)}>Restaurer</button>
    </div>`)}</div>
  </div>`;
}

const ACTIVITY = [[1.2, 'Plutôt assis'], [1.4, 'Un peu actif'], [1.6, 'Actif'], [1.8, 'Très actif']];

const WEEK_DAYS = [[1, 'Lun'], [2, 'Mar'], [3, 'Mer'], [4, 'Jeu'], [5, 'Ven'], [6, 'Sam'], [0, 'Dim']];

function SettingsSheet({ open, onClose, s }) {
  const [restock, setRestock] = useState(false);
  const cands = open ? restockCandidates(s) : [];
  const ws = s.profile.weekStart ?? 6;
  const reset = async () => {
    if (!(await confirmAction({ title: 'Refaire l’accueil ?', message: 'Tu repasses par les questions de départ. Tes données sont gardées.', confirm: 'Refaire l’accueil' }))) return;
    const prev = getState();
    onClose();
    update((d) => { d.profile.onboarded = false; });
    toast('Accueil relancé', { action: 'Annuler', onAction: () => restore(prev) });
  };
  const wipe = async () => {
    if (!(await confirmAction({ title: 'Vider placards, frigo et historique ?', message: 'Ton stock et tes courses passées seront effacés. Une sauvegarde automatique est faite juste avant.', confirm: 'Tout vider' }))) return;
    onClose();
    resetStockAndHistory();
  };
  return html`<${Sheet} open=${open} onClose=${onClose} title="Paramètres"
    footer=${html`<button type="button" class="btn primary block" onClick=${onClose}>OK</button>`}>
    <div class="label">Jour des courses (début de ta semaine)</div>
    <div class="chips">${WEEK_DAYS.map(([d, l]) => html`<${Chip} sm active=${ws === d} onClick=${() => setProfile({ weekStart: d })}>${l}</${Chip}>`)}</div>

    <div class="card flat" style="margin-top:16px">
      <div class="row between" style="gap:12px">
        <div><b class="small">Agrandir les portions automatiquement</b>
          <div class="subtle xs">Désactivé : chaque recette est proposée pour 1 portion, tu ajustes toi-même.</div></div>
        <${Chip} sm active=${!!s.profile.autoPortions} onClick=${() => setProfile({ autoPortions: !s.profile.autoPortions })}>${s.profile.autoPortions ? 'Oui' : 'Non'}</${Chip}>
      </div>
    </div>

    <div class="card flat" style="margin-top:12px">
      <b class="small">Mes données</b>
      <div class="subtle xs" style="margin:2px 0 10px">Tout est stocké sur ton téléphone. Les recherches de produits en ligne passent par Open Food Facts.</div>
      <div class="row wrap" style="gap:8px">
        <button type="button" class="btn ghost sm" onClick=${exportData}><${Icon} name="download" size=${15} />Télécharger une sauvegarde</button>
        <label class="btn ghost sm" style="cursor:pointer"><${Icon} name="refresh" size=${15} />Restaurer un fichier
          <input type="file" accept="application/json,.json" hidden onChange=${importData} /></label>
      </div>
    </div>
    <${AutoBackups} onClose=${onClose} />

    <div class="card flat" style="margin-top:12px">
      <b class="small">Stock</b>
      <div class="row wrap" style="gap:8px;margin-top:10px">
        ${cands.length > 0 && html`<button type="button" class="btn ghost sm" onClick=${() => setRestock(true)}><${Icon} name="refresh" size=${15} />Remettre en stock mes produits connus (${cands.length})</button>`}
        <button type="button" class="btn ghost sm" onClick=${wipe}><${Icon} name="trash" size=${15} />Vider placards, frigo et historique</button>
        <button type="button" class="btn ghost sm" onClick=${reset}><${Icon} name="refresh" size=${15} />Refaire l’accueil</button>
      </div>
    </div>
    <details class="subtle xs" style="margin-top:12px"><summary>Crédits photos des fruits et légumes</summary>
      <div style="margin-top:6px">${PRODUCE_CREDITS.map((c) => html`<div>${ING[c.ing]?.name} : ${c.author}, ${c.license}, Wikimedia Commons</div>`)}</div></details>
    <${RestockSheet} open=${restock} cands=${cands} onClose=${() => setRestock(false)} />
  </${Sheet}>`;
}

function ProfileSheet({ open, onClose, s }) {
  const p = s.profile;
  const t = targets(p);
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
  </${Sheet}>`;
}
