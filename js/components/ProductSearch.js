import { html, useState, useEffect, useRef, useMemo } from '../lib/h.js';
import { Icon, Sheet, Chip, useDebounced } from './ui.js';
import { ING, INGREDIENTS, CATEGORIES, guessIngredient } from '../data/ingredients.js';
import { STORES, AISLES, storeLabel } from '../data/products.js';
import { searchProducts, productPrice, euro, userStores, norm, productTitle, productSize, photoFor } from '../lib/engine.js';
import { searchOnline, lookupBarcode } from '../lib/off.js';
import { startScan, decodeImage } from '../lib/scanner.js';
import { saveCustomProduct } from '../actions.js';
import { toast } from '../lib/toast.js';

const ING_OPTIONS = Object.entries(CATEGORIES).map(([k, c]) => ({ k, c, rows: INGREDIENTS.filter((x) => x.cat === k) }));

function offToCustom(o) {
  return {
    name: o.name, brand: o.brand, barcode: o.barcode, size: o.size, unit: o.unit, ing: o.ing, nutri: o.nutri, image: o.image,
    quantity: o.quantity, nutriscore: o.nutriscore, storage: ING[o.ing]?.storage || 'placard',
    aisle: ING[o.ing]?.aisle || 'Divers', emoji: ING[o.ing]?.emoji || '🛒', price: 0, store: null,
  };
}

const TIER_TONE = { eco: 'eco', bio: 'bio', nat: 'nat', vrac: 'vrac' };
export function BrandPill({ p }) {
  if (!p) return null;
  const st = STORES[p.store];
  if (p.custom || p.barcode) {
    const label = [p.brand, p.quantity].filter(Boolean).join(' · ') || 'Produit perso';
    return html`<span class="bline"><span class="bpill nat">${label}</span>${st && html`<span class="bstore"><i style=${{ background: st.color }}></i>${st.name}</span>`}</span>`;
  }
  const brand = p.tier === 'vrac' ? 'Rayon frais' : p.brand === st?.name ? 'Marque magasin' : p.brand;
  return html`<span class="bline"><span class=${`bpill ${TIER_TONE[p.tier] || 'mdd'}`} style=${p.tier === 'mdd' ? { background: st.color } : null}>${brand}</span><span class="bstore"><i style=${{ background: st.color }}></i>${st.name}</span></span>`;
}

export function Thumb({ p, emoji, ing, cls = 'pick-emoji' }) {
  const src = p?.image || photoFor(ing || p?.ing);
  if (src) return html`<img class=${cls === 'pick-emoji' ? 'pick-img' : 'thumb-img'} src=${src} alt="" loading="lazy" referrerpolicy="no-referrer" />`;
  return html`<span class=${cls}>${emoji || p?.emoji || ING[p?.ing]?.emoji || '🛒'}</span>`;
}

export function ProductRow({ s, p, onClick, right }) {
  return html`<button type="button" class="pick-row" onClick=${onClick}>
    <${Thumb} p=${p} />
    <span class="pick-main">
      <span class="pick-name">${p.barcode && !p.custom ? p.name : productTitle(p)}</span>
      <span class="bline">${productSize(p) && html`<span class="psize">${productSize(p)}</span>`}<${BrandPill} p=${p} /></span>
    </span>
    ${right !== undefined ? right : (productPrice(s, p.id) > 0 && html`<span class="pick-price num">${euro(productPrice(s, p.id))}</span>`)}
  </button>`;
}

export function ProductSearch({ s, onPick, placeholder = 'Rechercher un produit', autoFocus = true, autoScan = false }) {
  const [q, setQ] = useState('');
  const [online, setOnline] = useState({ q: '', list: [], loading: false, error: null });
  const [scanning, setScanning] = useState(autoScan);
  const [creating, setCreating] = useState(null);
  const input = useRef(null);
  const dq = useDebounced(q, 160);
  const local = useMemo(() => searchProducts(s, dq, { limit: 40 }), [dq, s.customProducts, s.profile.stores]);
  useEffect(() => { if (autoFocus && !autoScan) setTimeout(() => input.current?.focus(), 250); }, []);

  const runOnline = async (query = q) => {
    if (norm(query).length < 3) return;
    setOnline({ q: query, list: [], loading: true, error: null });
    try { setOnline({ q: query, list: await searchOnline(query), loading: false, error: null }); }
    catch { setOnline({ q: query, list: [], loading: false, error: 'Recherche en ligne indisponible pour le moment.' }); }
  };
  // Produit déjà connu (scanné ou corrigé avant) : on garde ta fiche telle quelle
  const pickOff = (o, via) => {
    const known = o.barcode && (s.customProducts.find((p) => p.barcode === o.barcode)?.id
      || Object.entries(s.productOverrides || {}).find(([, ov]) => ov.barcode === o.barcode)?.[0]);
    onPick(known || saveCustomProduct(offToCustom(o)), via);
  };
  const showOnline = online.q && norm(online.q) === norm(q);

  return html`<div class="psearch">
    <div class="psearch-bar">
      <div class="search grow"><${Icon} name="search" size=${18} />
        <input ref=${input} class="field" type="search" enterkeyhint="search" autocomplete="off" placeholder=${placeholder} value=${q}
          onInput=${(e) => setQ(e.currentTarget.value)} onKeyDown=${(e) => { if (e.key === 'Enter' && local[0]) onPick(local[0].id); }} /></div>
      <button type="button" class="icon-btn lgx" aria-label="Scanner un code-barres" onClick=${() => setScanning(true)}><${Icon} name="barcode" size=${20} /></button>
    </div>

    ${norm(q).length >= 2 && html`<div class="pick-list" role="listbox">
      ${local.map((p) => html`<${ProductRow} key=${p.id} s=${s} p=${p} onClick=${() => onPick(p.id)} />`)}
      ${showOnline && online.list.map((o) => html`<${ProductRow} key=${o.barcode} s=${s} p=${{ ...o, id: o.barcode, emoji: ING[o.ing]?.emoji }} onClick=${() => pickOff(o)}
        right=${o.nutriscore ? html`<span class=${`nutri ns-${o.nutriscore}`}>${o.nutriscore.toUpperCase()}</span>` : null} />`)}
      ${showOnline && online.loading && html`<div class="pick-note">Recherche en ligne…</div>`}
      ${showOnline && online.error && html`<div class="pick-note">${online.error}</div>`}
      ${showOnline && !online.loading && !online.error && !online.list.length && html`<div class="pick-note">Rien trouvé en ligne.</div>`}
      ${!showOnline && norm(q).length >= 3 && html`<button type="button" class="pick-action" onClick=${() => runOnline()}>
        <${Icon} name="globe" size=${17} />Chercher « ${q.trim()} » dans toutes les marques</button>`}
      <button type="button" class="pick-action" onClick=${() => setCreating({ name: q.trim() })}>
        <${Icon} name="plus" size=${17} />Créer « ${q.trim()} »</button>
    </div>`}

    <${ScanSheet} open=${scanning} s=${s} direct onClose=${() => setScanning(false)}
      onFound=${(o) => { setScanning(false); pickOff(o, 'scan'); }}
      onUnknown=${(code) => { setScanning(false); setCreating({ name: '', barcode: code }); }} />
    <${CreateProductSheet} draft=${creating} s=${s} onClose=${() => setCreating(null)}
      onSaved=${(id) => { const via = creating?.barcode ? 'scan' : 'create'; setCreating(null); onPick(id, via); }} />
  </div>`;
}

export function ScanSheet({ open, onClose, onFound, onUnknown, direct }) {
  const video = useRef(null);
  const [status, setStatus] = useState('');
  const [found, setFound] = useState(null);
  const [code, setCode] = useState('');
  const busy = useRef(false);

  const handle = async (raw) => {
    if (busy.current) return;
    busy.current = true;
    setStatus('Recherche du produit…');
    try {
      const p = await lookupBarcode(raw);
      if (p && direct) { setStatus(''); onFound(p); }
      else if (p) { setFound(p); setStatus(''); }
      else { setStatus(''); onUnknown(String(raw).replace(/\D/g, '')); }
    } catch (e) { setStatus(e.message === 'Code-barres invalide' ? e.message : 'Connexion impossible, réessaie.'); busy.current = false; }
  };

  useEffect(() => {
    if (!open) return;
    setFound(null); setCode(''); setStatus('Vise le code-barres'); busy.current = false;
    let stop = null, cancelled = false;
    startScan(video.current, (c) => handle(c))
      .then((fn) => { if (cancelled) fn(); else stop = fn; })
      .catch(() => setStatus('Caméra indisponible. Tape le code ou prends une photo.'));
    return () => { cancelled = true; stop?.(); };
  }, [open]);

  const onPhoto = async (e) => {
    const f = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!f) return;
    setStatus('Lecture de la photo…');
    try { handle(await decodeImage(f)); } catch { setStatus('Code-barres illisible sur la photo.'); }
  };

  return html`<${Sheet} open=${open} onClose=${onClose} title="Scanner un produit">
    ${!found && html`<div>
      <div class="scan-box"><video ref=${video} playsinline muted></video><span class="scan-line"></span></div>
      ${status && html`<p class="subtle center" style="margin-top:10px">${status}</p>`}
      <form class="row" style="margin-top:12px" onSubmit=${(e) => { e.preventDefault(); handle(code); }}>
        <input class="field grow" inputmode="numeric" pattern="[0-9]*" placeholder="Ou tape le code" value=${code} onInput=${(e) => setCode(e.currentTarget.value)} />
        <button class="btn dark" disabled=${code.replace(/\D/g, '').length < 8}>OK</button>
      </form>
      <label class="btn outline block" style="margin-top:10px;cursor:pointer"><${Icon} name="camera" size=${17} />Prendre une photo du code
        <input type="file" accept="image/*" capture="environment" hidden onChange=${onPhoto} /></label>
      <p class="subtle xs center" style="margin-top:10px">Infos produits : Open Food Facts, base libre et collaborative.</p>
    </div>`}
    ${found && html`<div>
      <div class="card flat row" style="gap:12px">
        ${found.image ? html`<img class="pick-img lg" src=${found.image} alt="" referrerpolicy="no-referrer" />` : html`<span class="pick-emoji">🛒</span>`}
        <div class="grow"><div class="strong">${found.name}</div><div class="subtle">${[found.brand, found.quantity].filter(Boolean).join(' · ')}</div>
          ${found.nutriscore && html`<span class=${`nutri ns-${found.nutriscore}`} style="margin-top:6px">Nutri-Score ${found.nutriscore.toUpperCase()}</span>`}</div>
      </div>
      <${NutritionTable} nutri=${found.nutri} />
      <div class="row" style="margin-top:14px">
        <button type="button" class="btn ghost" onClick=${() => { setFound(null); busy.current = false; setStatus('Vise le code-barres'); }}>Autre</button>
        <button type="button" class="btn primary grow" onClick=${() => onFound(found)}><${Icon} name="check" size=${17} />Choisir ce produit</button>
      </div>
    </div>`}
  </${Sheet}>`;
}

const NUTRI_ROWS = [['kcal', 'Énergie', 'kcal'], ['prot', 'Protéines', 'g'], ['carbs', 'Glucides', 'g'], ['sugars', 'dont sucres', 'g'], ['fat', 'Lipides', 'g'], ['satFat', 'dont saturés', 'g'], ['fiber', 'Fibres', 'g'], ['salt', 'Sel', 'g']];

export function NutritionTable({ nutri, editable, onChange, perLabel = 'pour 100 g' }) {
  if (!nutri && !editable) return null;
  const n = nutri || {};
  return html`<details class="nutri-box">
    <summary><span>Infos nutritionnelles</span><span class="subtle xs">${perLabel}</span><${Icon} name="chevD" size=${16} /></summary>
    <div class="nutri-grid">
      ${NUTRI_ROWS.map(([k, label, unit]) => html`<div class=${`nrow ${k === 'sugars' || k === 'satFat' ? 'sub' : ''}`}>
        <span>${label}</span>
        ${editable
          ? html`<input class="field xs num" inputmode="decimal" value=${n[k] ?? ''} placeholder="·" onInput=${(e) => { const v = parseFloat(e.currentTarget.value.replace(',', '.')); onChange({ ...n, [k]: isFinite(v) ? v : null }); }} />`
          : html`<b class="num">${n[k] == null ? '·' : `${String(n[k]).replace('.', ',')} ${unit}`}</b>`}
      </div>`)}
    </div>
  </details>`;
}

export function CreateProductSheet({ draft, s, onClose, onSaved }) {
  const [f, setF] = useState(null);
  useEffect(() => {
    if (!draft) return;
    const ing = guessIngredient(draft.name);
    setF({ name: draft.name || '', brand: '', barcode: draft.barcode || '', size: '', ing: ing || '', store: userStores(s)[0], price: '', storage: ING[ing]?.storage || 'placard', nutri: null });
  }, [draft]);
  if (!draft || !f) return html`<${Sheet} open=${false} />`;
  const set = (patch) => setF((cur) => ({ ...cur, ...patch }));
  const ing = ING[f.ing];
  const unit = ing?.unit || 'g';
  const save = () => {
    const name = f.name.trim();
    if (!name) { toast('Donne un nom au produit'); return; }
    const size = parseFloat(String(f.size).replace(',', '.'));
    const price = parseFloat(String(f.price).replace(',', '.'));
    const id = saveCustomProduct({
      name: name.slice(0, 80), brand: f.brand.trim().slice(0, 40), barcode: f.barcode || undefined,
      ing: f.ing || null, size: isFinite(size) && size > 0 ? size : (ing?.pack.size || null), store: f.store || null,
      price: isFinite(price) && price > 0 ? price : 0, storage: f.storage, aisle: ing?.aisle || 'Divers', emoji: ing?.emoji || '🛒', nutri: f.nutri,
    });
    toast(`${name} créé`);
    onSaved(id);
  };
  return html`<${Sheet} open=${true} onClose=${onClose} title="Nouveau produit" subtitle="Il sera retenu pour la suite"
    footer=${html`<button type="button" class="btn primary block lg" onClick=${save}><${Icon} name="check" size=${18} />Créer le produit</button>`}>
    <div class="form">
      <p class="subtle xs" style="margin:0 2px 10px"><span class="req">*</span> champ obligatoire</p>
      <label class="label" for="np-name">Nom <span class="req">*</span></label>
      <input id="np-name" class="field" value=${f.name} maxlength="80" placeholder="Ex : Steak haché 5 % Charal x2" onInput=${(e) => set({ name: e.currentTarget.value, ing: f.ing || guessIngredient(e.currentTarget.value) || '' })} />
      <div class="row" style="gap:10px;margin-top:12px">
        <div class="grow"><label class="label" for="np-brand">Marque (optionnel)</label>
          <input id="np-brand" class="field" value=${f.brand} maxlength="40" onInput=${(e) => set({ brand: e.currentTarget.value })} /></div>
        <div style="width:120px"><label class="label" for="np-size">${unit === 'pc' ? 'Pièces' : unit === 'ml' ? 'Contenance (ml)' : 'Grammage (g)'}</label>
          <input id="np-size" class="field num" inputmode="decimal" placeholder="Optionnel" value=${f.size} onInput=${(e) => set({ size: e.currentTarget.value })} /></div>
      </div>
      <label class="label" for="np-ing" style="margin-top:12px">C'est quoi comme aliment ?</label>
      <select id="np-ing" class="field" value=${f.ing} onChange=${(e) => { const v = e.currentTarget.value; set({ ing: v, storage: ING[v]?.storage || f.storage }); }}>
        <option value="">Autre (non suivi dans les recettes)</option>
        ${ING_OPTIONS.map(({ k, c, rows }) => html`<optgroup key=${k} label=${c.label}>${rows.map((x) => html`<option value=${x.id}>${x.name}</option>`)}</optgroup>`)}
      </select>
      <p class="subtle xs" style="margin:6px 2px 0">Sert à déduire le stock quand tu cuisines une recette.</p>
      <div class="row" style="gap:10px;margin-top:12px">
        <div class="grow"><label class="label" for="np-store">Magasin</label>
          <select id="np-store" class="field" value=${f.store} onChange=${(e) => set({ store: e.currentTarget.value })}>
            ${Object.entries(STORES).map(([k, st]) => html`<option value=${k}>${st.name}</option>`)}
          </select></div>
        <div style="width:120px"><label class="label" for="np-price">Prix (€)</label>
          <input id="np-price" class="field num" inputmode="decimal" placeholder="Optionnel" value=${f.price} onInput=${(e) => set({ price: e.currentTarget.value })} /></div>
      </div>
      <div class="label" style="margin-top:12px">Rangement</div>
      <div class="chips">
        <${Chip} sm active=${f.storage === 'frigo'} onClick=${() => set({ storage: 'frigo' })}>🧊 Frigo</${Chip}>
        <${Chip} sm active=${f.storage === 'placard'} onClick=${() => set({ storage: 'placard' })}>📦 Placard</${Chip}>
      </div>
      <div style="margin-top:12px"><${NutritionTable} editable nutri=${f.nutri} onChange=${(n) => set({ nutri: n })} /></div>
    </div>
  </${Sheet}>`;
}

export { AISLES };
