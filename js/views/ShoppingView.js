import { html, useState, useEffect, useMemo } from '../lib/h.js';
import { useStore, update } from '../store.js';
import { Icon, Chip, Badge, Seg, Sheet, Swipeable, Stepper, BrandTag, Toggle, Empty } from '../components/ui.js';
import { AISLES, BRANDS, CATALOG, PRODUCT } from '../data/catalog.js';
import { ING } from '../data/ingredients.js';
import { fmtDayLong, fmtShort, relDay, today, addDays } from '../lib/dates.js';
import { listItemInfo, listTotal, euro, productPrice, estimateDlc } from '../lib/engine.js';
import { catalog } from '../lib/catalogProvider.js';
import { parseTicket, SAMPLE_TICKET } from '../lib/ticket.js';
import {
  toggleItem, setItemQty, removeItem, addToList, addCustomToList, finishShopping, applyTicket, swapItemProduct,
} from '../actions.js';
import { toast } from '../lib/toast.js';

export function ShoppingView() {
  const s = useStore();
  const tab = s.ui.shopTab || 'list';
  const setTabLocal = (v) => update((d) => { d.ui.shopTab = v; });
  const [ticketOpen, setTicketOpen] = useState(false);

  return html`<div class="screen">
    <header class="topbar">
      <div><div class="eyebrow">E.Leclerc</div><h1 class="h1">Courses</h1></div>
      <button class="btn outline sm" onClick=${() => setTicketOpen(true)}><${Icon} name="receipt" size=${16} />Importer un ticket</button>
    </header>
    <${Seg} value=${tab} onChange=${setTabLocal} options=${[
      { value: 'list', label: `Ma liste${s.shoppingList.length ? ` (${s.shoppingList.length})` : ''}` },
      { value: 'catalog', label: 'Catalogue' },
      { value: 'history', label: 'Passées' },
    ]} />
    ${tab === 'list' && html`<${ActiveList} s=${s} />`}
    ${tab === 'catalog' && html`<${CatalogTab} s=${s} />`}
    ${tab === 'history' && html`<${HistoryTab} s=${s} />`}
    <${TicketSheet} open=${ticketOpen} onClose=${() => setTicketOpen(false)} s=${s} />
  </div>`;
}

/* ---------------- Liste active ---------------- */
function ActiveList({ s }) {
  const [q, setQ] = useState('');
  const [finishOpen, setFinishOpen] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const storeMode = s.profile.storeMode;
  const items = s.shoppingList;
  const total = listTotal(s, items);
  const checked = items.filter((x) => x.checked);
  const cartTotal = listTotal(s, checked);

  useStoreWakeLock(storeMode);

  const groups = useMemo(() => {
    const g = {};
    for (const it of items) {
      if (storeMode && it.checked) continue;
      const info = listItemInfo(s, it);
      (g[info.aisle] = g[info.aisle] || []).push({ it, info });
    }
    return AISLES.filter((a) => g[a]).map((a) => ({ aisle: a, rows: g[a] }));
  }, [items, storeMode, s.priceOverrides]);

  const suggestions = q.trim().length >= 2 ? catalog.searchSync(q).slice(0, 6) : [];
  const submit = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    if (suggestions[0]) addToList(suggestions[0].id); else { addCustomToList(q.trim()); toast(`« ${q.trim()} » ajouté`); }
    setQ('');
  };

  return html`<div class=${storeMode ? 'store-mode' : ''}>
    <div class="card pad-lg" style="margin-top:14px">
      <div class="row between">
        <div>
          <div class="eyebrow">Panier estimé</div>
          <div class="h1 num" style="font-size:30px">${euro(total)}</div>
        </div>
        <div style="text-align:right">
          <div class="subtle">Dans le caddie</div>
          <div class="h3 num">${euro(cartTotal)}</div>
        </div>
      </div>
      <div class="bar" style="margin-top:12px"><i style=${{ width: `${items.length ? (checked.length / items.length) * 100 : 0}%` }}></i></div>
      <div class="row between" style="margin-top:10px">
        <span class="subtle">${checked.length}/${items.length} articles</span>
        <label class="row small strong" style="gap:8px">Mode magasin
          <${Toggle} on=${storeMode} label="Mode magasin" onChange=${(v) => update((d) => { d.profile.storeMode = v; })} /></label>
      </div>
    </div>

    <form onSubmit=${submit} style="margin-top:14px">
      <div class="search"><${Icon} name="plus" size=${18} />
        <input class="field" placeholder="Ajouter un produit (ex : poulet, riz...)" value=${q} onInput=${(e) => setQ(e.currentTarget.value)} />
      </div>
    </form>
    ${suggestions.length > 0 && html`<div class="chips scroll" style="margin-top:10px">
      ${suggestions.map((p) => html`<${Chip} sm onClick=${() => { addToList(p.id); setQ(''); }}>
        ${ING[p.ing]?.emoji} ${p.name} · ${euro(productPrice(s, p.id))}</${Chip}>`)}
    </div>`}

    ${items.length === 0 && html`<${Empty} emoji="🧺" title="Ta liste est vide">Génère-la depuis « Ma semaine » ou ajoute des produits ci-dessus.</${Empty}>`}

    ${groups.map(({ aisle, rows }) => html`<div key=${aisle}>
      <div class="aisle-title"><span>${aisle}</span><span>${euro(rows.reduce((n, r) => n + r.info.unitPrice * r.it.qty, 0))}</span></div>
      <div class="list">
        ${rows.map(({ it, info }) => html`<${Swipeable} key=${it.id}
            onRight=${() => toggleItem(it.id)} rightLabel=${it.checked ? 'Décocher' : 'Dans le caddie'}
            onLeft=${() => removeItem(it.id)} leftLabel="Retirer">
          <div class=${`list-item ${it.checked ? 'checked' : ''}`} onClick=${() => toggleItem(it.id)} style="cursor:pointer">
            <span class=${`check ${it.checked ? 'on pop' : ''}`}><${Icon} name="check" size=${16} stroke=${3} /></span>
            <div class="grow" style="min-width:0">
              <div class="item-name strong small ellipsis">${info.emoji} ${info.name}</div>
              <div class="row" style="gap:6px;margin-top:3px">
                ${info.brand && html`<${BrandTag} brand=${info.brand} />`}
                <span class="subtle xs num">${euro(info.unitPrice)}/u</span>
                ${it.source === 'plan' && html`<span class="badge sage" style="height:18px;font-size:10px">Planning</span>`}
                ${info.prod && CATALOG.filter((p) => p.ing === info.ing).length > 1 && html`<button class="subtle xs" style="text-decoration:underline" onClick=${(e) => { e.stopPropagation(); setEditItem(it); }}>Changer</button>`}
              </div>
            </div>
            <${Stepper} value=${it.qty} min=${0} onChange=${(v) => setItemQty(it.id, v)} />
            <span class="price strong small num" style="min-width:56px;text-align:right">${euro(info.unitPrice * it.qty)}</span>
          </div>
        </${Swipeable}>`)}
      </div>
    </div>`)}

    ${storeMode && checked.length > 0 && html`<div>
      <button class="collapse-btn" onClick=${() => setShowCart(!showCart)}>
        <span>🛒 Dans le caddie (${checked.length})</span><${Icon} name=${showCart ? 'chevU' : 'chevD'} size=${18} /></button>
      ${showCart && html`<div class="list">${checked.map((it) => {
        const info = listItemInfo(s, it);
        return html`<div class="list-item checked" key=${it.id} onClick=${() => toggleItem(it.id)}>
          <span class="check on"><${Icon} name="check" size=${16} stroke=${3} /></span>
          <div class="grow item-name small strong">${info.name}</div><span class="price small num">${euro(info.unitPrice * it.qty)}</span></div>`;
      })}</div>`}
    </div>`}

    ${items.length > 0 && html`<p class="subtle center" style="margin-top:12px">Astuce : glisse un article vers la droite pour le cocher, vers la gauche pour le retirer.</p>`}

    ${items.length > 0 && html`<div style="margin-top:16px">
      <button class="btn dark block lg" disabled=${!checked.length} onClick=${() => setFinishOpen(true)}>
        <${Icon} name="bag" size=${19} />J’ai fini mes courses${checked.length ? ` · ${euro(cartTotal)}` : ''}</button>
    </div>`}

    <${FinishSheet} open=${finishOpen} onClose=${() => setFinishOpen(false)} s=${s} />
    <${ProductSwapSheet} item=${editItem} s=${s} onClose=${() => setEditItem(null)} />
  </div>`;
}

function useStoreWakeLock(on) {
  useEffect(() => {
    if (!on || !('wakeLock' in navigator)) return;
    let lock;
    navigator.wakeLock.request('screen').then((l) => { lock = l; }).catch(() => {});
    return () => { lock?.release?.().catch(() => {}); };
  }, [on]);
}

function ProductSwapSheet({ item, s, onClose }) {
  if (!item) return html`<${Sheet} open=${false} />`;
  const cur = PRODUCT[item.productId];
  const opts = CATALOG.filter((p) => p.ing === cur.ing);
  return html`<${Sheet} open=${true} onClose=${onClose} title="Choisir le produit" subtitle=${ING[cur.ing].name}>
    <div class="list">${opts.map((p) => html`<button class="list-item" style="width:100%;text-align:left" onClick=${() => { swapItemProduct(item.id, p.id); onClose(); }}>
      <span class=${`check ${p.id === cur.id ? 'on' : ''}`}><${Icon} name="check" size=${16} stroke=${3} /></span>
      <div class="grow"><div class="small strong">${p.name}</div><div class="row" style="gap:6px;margin-top:2px"><${BrandTag} brand=${p.brand} /><span class="subtle xs">${pricePerUnit(s, p)}</span></div></div>
      <span class="strong num">${euro(productPrice(s, p.id))}</span>
    </button>`)}</div>
    <p class="subtle" style="margin-top:10px">Ton choix sera retenu pour les prochaines listes générées.</p>
  </${Sheet}>`;
}

function pricePerUnit(s, p) {
  const ing = ING[p.ing];
  const price = productPrice(s, p.id);
  if (ing.unit === 'g') return `${euro((price / p.size) * 1000)}/kg`;
  if (ing.unit === 'ml') return `${euro((price / p.size) * 1000)}/L`;
  return `${euro(price / p.size)}/${ing.unitLabel || 'pièce'}`;
}

function FinishSheet({ open, onClose, s }) {
  const [keep, setKeep] = useState(false);
  const [dlc, setDlc] = useState({});
  const checked = s.shoppingList.filter((x) => x.checked);
  const unchecked = s.shoppingList.length - checked.length;
  const total = listTotal(s, checked);
  const confirm = () => { finishShopping({ keepUnchecked: keep, dlcOverrides: dlc }); setDlc({}); onClose(); };
  return html`<${Sheet} open=${open} onClose=${onClose} title="Valider mes courses" subtitle=${`${fmtDayLong(today())} · ${checked.length} articles`}
    footer=${html`<button class="btn primary block lg" onClick=${confirm}><${Icon} name="check" size=${18} />Archiver & ranger · ${euro(total)}</button>`}>
    <div class="card tint-sage">
      <div class="small"><b>Ce qui va se passer :</b></div>
      <div class="small" style="margin-top:6px">📦 Les courses sont archivées dans « Passées »<br />🧊 Les articles rejoignent ton frigo et tes placards avec leur DLC<br />🧺 La liste active est vidée</div>
    </div>
    <div class="label" style="margin-top:16px">DLC estimées (modifiables)</div>
    <div class="list">${checked.map((it) => {
      const info = listItemInfo(s, it);
      const prod = PRODUCT[it.productId];
      const est = prod ? estimateDlc(prod.id, prod.ing) : '';
      return html`<div class="list-item" key=${it.id} style="min-height:56px">
        <span style="font-size:20px">${info.emoji}</span>
        <div class="grow" style="min-width:0"><div class="small strong ellipsis">${info.name}</div>
          <div class="subtle xs">${prod ? (ING[prod.ing].storage === 'frigo' ? '🧊 Frigo' : '📦 Placard') : 'Divers'} · ×${it.qty}</div></div>
        <input type="date" class="field" style="width:148px;height:38px;font-size:13px;padding:0 8px" value=${dlc[it.id] || est}
          onInput=${(e) => setDlc({ ...dlc, [it.id]: e.currentTarget.value })} />
      </div>`;
    })}</div>
    ${unchecked > 0 && html`<div class="row between card flat" style="margin-top:14px">
      <div class="small"><b>Garder les ${unchecked} articles non cochés</b><div class="subtle">Pour ta prochaine visite</div></div>
      <${Toggle} on=${keep} onChange=${setKeep} label="Garder les non cochés" />
    </div>`}
  </${Sheet}>`;
}

/* ---------------- Catalogue ---------------- */
function CatalogTab({ s }) {
  const [q, setQ] = useState('');
  const [brand, setBrand] = useState(null);
  const results = catalog.searchSync(q, { brand });
  const byAisle = AISLES.map((a) => ({ aisle: a, rows: results.filter((p) => p.aisle === a) })).filter((g) => g.rows.length);
  const inList = new Set(s.shoppingList.map((x) => x.productId));
  return html`<div>
    <div class="search" style="margin-top:14px"><${Icon} name="search" size=${18} />
      <input class="field" placeholder="Chercher dans le catalogue" value=${q} onInput=${(e) => setQ(e.currentTarget.value)} /></div>
    <div class="chips scroll" style="margin-top:10px">
      <${Chip} sm active=${!brand} onClick=${() => setBrand(null)}>Toutes</${Chip}>
      ${Object.keys(BRANDS).map((b) => html`<${Chip} sm active=${brand === b} onClick=${() => setBrand(brand === b ? null : b)}>${b}</${Chip}>`)}
    </div>
    <p class="subtle" style="margin:10px 2px 0">${catalog.name}${s.lastTicketSync ? ` · prix réels synchronisés le ${fmtShort(s.lastTicketSync)}` : ''}</p>
    ${byAisle.map(({ aisle, rows }) => html`<div key=${aisle}>
      <div class="aisle-title"><span>${aisle}</span><span>${rows.length}</span></div>
      <div class="list">${rows.map((p) => {
        const synced = s.priceOverrides[p.id];
        return html`<div class="list-item" key=${p.id}>
          <span class="thumb sm" style="background:var(--surface-2)">${ING[p.ing]?.emoji}</span>
          <div class="grow" style="min-width:0">
            <div class="small strong ellipsis">${p.name}</div>
            <div class="row" style="gap:6px;margin-top:2px"><${BrandTag} brand=${p.brand} /><span class="subtle xs">${pricePerUnit(s, p)}</span>
              ${synced && html`<span class="badge mint" style="height:18px;font-size:10px">Prix ticket</span>`}</div>
          </div>
          <span class="strong small num">${euro(productPrice(s, p.id))}</span>
          <button class=${`icon-btn sm ${inList.has(p.id) ? '' : ''}`} style=${inList.has(p.id) ? 'background:var(--sage-50);color:var(--sage-700);border-color:var(--sage-100)' : ''}
            aria-label="Ajouter à la liste" onClick=${() => addToList(p.id)}><${Icon} name=${inList.has(p.id) ? 'check' : 'plus'} size=${16} /></button>
        </div>`;
      })}</div>
    </div>`)}
  </div>`;
}

/* ---------------- Historique ---------------- */
function HistoryTab({ s }) {
  const [open, setOpen] = useState(null);
  const h = s.history;
  const avg = h.length ? h.reduce((n, x) => n + x.total, 0) / h.length : 0;
  const month = h.filter((x) => x.date.slice(0, 7) === today().slice(0, 7)).reduce((n, x) => n + x.total, 0);
  return html`<div>
    <div class="row" style="margin-top:14px;gap:10px">
      <div class="card grow"><div class="subtle">Ce mois-ci</div><div class="h2 num">${euro(month)}</div></div>
      <div class="card grow"><div class="subtle">Moyenne / course</div><div class="h2 num">${euro(avg)}</div></div>
    </div>
    ${!h.length && html`<${Empty} emoji="🧾" title="Pas encore de courses archivées" />`}
    <div class="stack" style="margin-top:14px">
      ${h.map((x) => html`<div class="card tappable" key=${x.id} onClick=${() => setOpen(open === x.id ? null : x.id)}>
        <div class="hist-item">
          <span class="thumb sm" style="background:var(--sage-50)">${x.source === 'ticket' ? '🧾' : '🛒'}</span>
          <div class="grow">
            <div class="strong">${relDay(x.date) === fmtDayLong(x.date) ? fmtDayLong(x.date) : `${relDay(x.date)} · ${fmtShort(x.date)}`}</div>
            <div class="subtle">${x.count} articles${x.source === 'ticket' ? ' · ticket importé' : ''}</div>
          </div>
          <div class="h3 num">${euro(x.total)}</div>
          <${Icon} name=${open === x.id ? 'chevU' : 'chevD'} size=${18} class="muted" />
        </div>
        ${open === x.id && html`<div style="margin-top:12px">
          ${x.items.map((it) => html`<div class="kv"><span class="row" style="gap:6px;min-width:0"><span class="ellipsis">${it.qty > 1 ? `${it.qty} × ` : ''}${it.name}</span>${it.brand && html`<${BrandTag} brand=${it.brand} />`}</span><span class="num strong">${euro(it.price * it.qty)}</span></div>`)}
          <button class="btn soft sm block" style="margin-top:10px" onClick=${(e) => { e.stopPropagation(); x.items.forEach((it) => it.productId && addToList(it.productId, it.qty)); }}>
            <${Icon} name="refresh" size=${15} />Remettre dans ma liste</button>
        </div>`}
      </div>`)}
    </div>
  </div>`;
}

/* ---------------- Import ticket ---------------- */
function TicketSheet({ open, onClose, s }) {
  const [raw, setRaw] = useState('');
  const [parsed, setParsed] = useState(null);
  const [opts, setOpts] = useState({ updatePrices: true, addStock: true, archive: true, checkList: true });
  const close = () => { setRaw(''); setParsed(null); onClose(); };
  const analyse = () => setParsed(parseTicket(raw));
  const apply = () => { applyTicket(parsed.items, opts); close(); };
  const onScan = (e) => {
    if (e.currentTarget.files?.length) toast('Scan reçu. La lecture OCR arrive avec l’API : colle le texte du ticket en attendant.');
    e.currentTarget.value = '';
  };
  const opt = (k, label, hint) => html`<div class="row between" style="padding:10px 0">
    <div class="small"><b>${label}</b><div class="subtle">${hint}</div></div>
    <${Toggle} on=${opts[k]} label=${label} onChange=${(v) => setOpts({ ...opts, [k]: v })} /></div>`;

  const footer = parsed
    ? html`<div class="row"><button class="btn ghost" onClick=${() => setParsed(null)}>Retour</button>
        <button class="btn primary grow" disabled=${!parsed.items.length} onClick=${apply}><${Icon} name="check" size=${18} />Synchroniser ${parsed.items.length} produits</button></div>`
    : html`<button class="btn primary block lg" disabled=${!raw.trim()} onClick=${analyse}><${Icon} name="sparkles" size=${18} />Analyser le ticket</button>`;

  return html`<${Sheet} open=${open} onClose=${close} title="Importer mon ticket" subtitle="Ticket dématérialisé E.Leclerc" footer=${footer}>
    ${!parsed && html`<div>
      <div class="row" style="gap:8px;margin-bottom:12px">
        <label class="btn outline sm grow" style="cursor:pointer"><${Icon} name="camera" size=${16} />Scanner
          <input type="file" accept="image/*" capture="environment" style="display:none" onChange=${onScan} /></label>
        <button class="btn outline sm grow" onClick=${() => setRaw(SAMPLE_TICKET)}><${Icon} name="clipboard" size=${16} />Coller un exemple</button>
      </div>
      <textarea class="field" placeholder="Colle ici le texte de ton ticket (appli E.Leclerc, mail...)" value=${raw} onInput=${(e) => setRaw(e.currentTarget.value)}></textarea>
      <p class="subtle" style="margin-top:8px">Les prix réels remplacent les prix indicatifs du catalogue. Rien n’est envoyé en ligne.</p>
    </div>`}
    ${parsed && html`<div>
      <div class="label">${parsed.items.length} produits reconnus</div>
      <div class="list">${parsed.items.map((it) => {
        const p = PRODUCT[it.productId];
        const old = productPrice(s, p.id);
        const diff = it.unitPrice - old;
        return html`<div class="list-item" style="min-height:56px">
          <span style="font-size:20px">${ING[p.ing].emoji}</span>
          <div class="grow" style="min-width:0"><div class="small strong ellipsis">${p.name}</div>
            <div class="subtle xs ellipsis">${it.label}</div></div>
          <div style="text-align:right"><div class="small strong num">${it.qty > 1 ? `${it.qty} × ` : ''}${euro(it.unitPrice)}</div>
            ${Math.abs(diff) >= 0.01 && html`<div class="xs num" style=${{ color: 'var(--ink-3)' }}>${diff > 0 ? '+' : ''}${euro(diff)}</div>`}</div>
        </div>`;
      })}</div>
      ${parsed.ignored.length > 0 && html`<details style="margin-top:10px"><summary class="subtle">${parsed.ignored.length} lignes ignorées</summary>
        <pre class="subtle xs" style="white-space:pre-wrap">${parsed.ignored.join('\n')}</pre></details>`}
      <div class="card flat" style="margin-top:14px;padding:4px 14px">
        ${opt('updatePrices', 'Mettre à jour les prix', 'Le catalogue utilise tes prix réels')}
        ${opt('addStock', 'Ajouter au stock', 'Avec DLC estimées par produit')}
        ${opt('checkList', 'Cocher ma liste', 'Les produits trouvés sont cochés')}
        ${opt('archive', 'Archiver dans « Passées »', 'Crée une course datée d’aujourd’hui')}
      </div>
    </div>`}
  </${Sheet}>`;
}
