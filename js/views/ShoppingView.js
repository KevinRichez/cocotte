import { html, useState, useEffect, useMemo } from '../lib/h.js';
import { useStore, update } from '../store.js';
import { Icon, Chip, Seg, Sheet, Swipeable, Stepper, Toggle, Empty, useDebounced } from '../components/ui.js';
import { ProductSearch, ProductRow, BrandPill, Thumb } from '../components/ProductSearch.js';
import { AISLES, STORES, storeLabel } from '../data/products.js';
import { ING } from '../data/ingredients.js';
import { fmtDayLong, fmtShort, relDay, today } from '../lib/dates.js';
import {
  listItemInfo, listTotal, euro, productPrice, estimateDlc, getProduct, productsForIng, unitPriceLabel, searchProducts, userStores,
} from '../lib/engine.js';
import { parseTicket, SAMPLE_TICKET } from '../lib/ticket.js';
import { toggleItem, checkAll, setItemQty, removeItem, addToList, finishShopping, applyTicket, swapItemProduct } from '../actions.js';

export function ShoppingView() {
  const s = useStore();
  const tab = s.ui.shopTab || 'list';
  const setTabLocal = (v) => update((d) => { d.ui.shopTab = v; });
  const [ticketOpen, setTicketOpen] = useState(false);
  return html`<div class="screen">
    <header class="topbar">
      <h1 class="h1">Courses</h1>
      <button type="button" class="btn outline sm" onClick=${() => setTicketOpen(true)}><${Icon} name="receipt" size=${16} />Importer un ticket</button>
    </header>
    <${Seg} value=${tab} onChange=${setTabLocal} options=${[
      { value: 'list', label: `Ma liste${s.shoppingList.length ? ` (${s.shoppingList.length})` : ''}` },
      { value: 'catalog', label: 'Produits' },
      { value: 'history', label: 'Passées' },
    ]} />
    ${tab === 'list' && html`<${ActiveList} s=${s} />`}
    ${tab === 'catalog' && html`<${CatalogTab} s=${s} />`}
    ${tab === 'history' && html`<${HistoryTab} s=${s} />`}
    <${TicketSheet} open=${ticketOpen} onClose=${() => setTicketOpen(false)} s=${s} />
  </div>`;
}

function ActiveList({ s }) {
  const [finishOpen, setFinishOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const storeMode = s.profile.storeMode;
  const items = s.shoppingList;
  const total = listTotal(s, items);
  const checked = items.filter((x) => x.checked);
  const cartTotal = listTotal(s, checked);
  const allChecked = items.length > 0 && checked.length === items.length;
  useStoreWakeLock(storeMode);

  const groups = useMemo(() => {
    const rows = items.filter((it) => !(storeMode && it.checked)).map((it) => ({ it, info: listItemInfo(s, it) }));
    const stores = [...new Set(rows.map((r) => r.info.store || 'autre'))];
    const multi = stores.length > 1;
    const out = [];
    for (const st of multi ? stores : [null]) {
      const inStore = multi ? rows.filter((r) => (r.info.store || 'autre') === st) : rows;
      const byAisle = {};
      for (const r of inStore) (byAisle[r.info.aisle] = byAisle[r.info.aisle] || []).push(r);
      const aisles = AISLES.filter((a) => byAisle[a]).concat(Object.keys(byAisle).filter((a) => !AISLES.includes(a)));
      out.push({ store: multi ? (STORES[st]?.name || 'Autres') : null, aisles: aisles.map((a) => ({ aisle: a, rows: byAisle[a] })) });
    }
    return out;
  }, [items, storeMode, s.priceOverrides, s.customProducts]);

  return html`<div class=${storeMode ? 'store-mode' : ''}>
    <div class="card pad-lg" style="margin-top:14px">
      <div class="row between">
        <div><div class="subtle">Panier estimé</div><div class="h1 num" style="font-size:30px">${euro(total)}</div></div>
        <div style="text-align:right"><div class="subtle">Dans le caddie</div><div class="h3 num">${euro(cartTotal)}</div></div>
      </div>
      <div class="bar" style="margin-top:12px"><i style=${{ width: `${items.length ? (checked.length / items.length) * 100 : 0}%` }}></i></div>
      <div class="row between" style="margin-top:10px">
        <span class="subtle">${checked.length}/${items.length} articles</span>
        <label class="row small strong" style="gap:8px">Mode magasin
          <${Toggle} on=${storeMode} label="Mode magasin" onChange=${(v) => update((d) => { d.profile.storeMode = v; })} /></label>
      </div>
    </div>

    <div class="row" style="gap:8px;margin-top:14px">
      <button type="button" class="btn primary grow" onClick=${() => setAdding(true)}><${Icon} name="plus" size=${18} />Ajouter un produit</button>
      ${items.length > 0 && html`<button type="button" class="btn outline" onClick=${() => checkAll(!allChecked)}><${Icon} name="checks" size=${18} />${allChecked ? 'Tout décocher' : 'Tout cocher'}</button>`}
    </div>

    ${items.length === 0 && html`<${Empty} emoji="🧺" title="Ta liste est vide">Génère-la depuis « Ma semaine » ou ajoute des produits.</${Empty}>`}

    ${groups.map((g) => html`<div key=${g.store || 'one'}>
      ${g.store && html`<div class="store-title">${g.store}</div>`}
      ${g.aisles.map(({ aisle, rows }) => html`<div key=${aisle}>
        <div class="aisle-title"><span>${aisle}</span><span class="num">${euro(rows.reduce((n, r) => n + r.info.unitPrice * r.it.qty, 0))}</span></div>
        <div class="list">${rows.map(({ it, info }) => html`<${Swipeable} key=${it.id}
            onRight=${() => toggleItem(it.id)} rightLabel=${it.checked ? 'Décocher' : 'Dans le caddie'}
            onLeft=${() => removeItem(it.id)} leftLabel="Retirer">
          <div class=${`list-item ${it.checked ? 'checked' : ''}`} onClick=${() => toggleItem(it.id)} style="cursor:pointer">
            <span class=${`check ${it.checked ? 'on pop' : ''}`}><${Icon} name="check" size=${16} stroke=${3} /></span>
            <div class="grow" style="min-width:0">
              <div class="item-name strong small clamp2">${info.prod?.image ? html`<img class="inline-img" src=${info.prod.image} alt="" loading="lazy" referrerpolicy="no-referrer" />` : info.emoji} ${info.name}</div>
              <div class="item-sub">
                ${info.prod && html`<${BrandPill} p=${info.prod} />`}
                ${it.source === 'plan' && html`<span class="badge sage xs">Planning</span>`}
                ${info.prod?.ing && productsForIng(s, info.prod.ing).length > 1 && html`<button type="button" class="link-btn" onClick=${(e) => { e.stopPropagation(); setEditItem(it); }}>Changer</button>`}
              </div>
            </div>
            <div class="item-right">
              <span class="price strong small num">${info.unitPrice ? euro(info.unitPrice * it.qty) : ''}</span>
              <${Stepper} value=${it.qty} min=${0} onChange=${(v) => setItemQty(it.id, v)} />
            </div>
          </div>
        </${Swipeable}>`)}</div>
      </div>`)}
    </div>`)}

    ${storeMode && checked.length > 0 && html`<div>
      <button type="button" class="collapse-btn" onClick=${() => setShowCart(!showCart)}>
        <span>🛒 Dans le caddie (${checked.length})</span><${Icon} name=${showCart ? 'chevU' : 'chevD'} size=${18} /></button>
      ${showCart && html`<div class="list">${checked.map((it) => {
        const info = listItemInfo(s, it);
        return html`<div class="list-item checked" key=${it.id} onClick=${() => toggleItem(it.id)}>
          <span class="check on"><${Icon} name="check" size=${16} stroke=${3} /></span>
          <div class="grow item-name small strong clamp2">${info.name}</div><span class="price small num">${euro(info.unitPrice * it.qty)}</span></div>`;
      })}</div>`}
    </div>`}

    ${items.length > 0 && html`<div style="margin-top:16px">
      <button type="button" class="btn dark block lg" disabled=${!checked.length} onClick=${() => setFinishOpen(true)}>
        <${Icon} name="bag" size=${19} />J’ai fini mes courses${checked.length ? ` · ${euro(cartTotal)}` : ''}</button>
    </div>`}

    <${AddToListSheet} open=${adding} s=${s} onClose=${() => setAdding(false)} />
    <${FinishSheet} open=${finishOpen} onClose=${() => setFinishOpen(false)} s=${s} />
    <${ProductSwapSheet} item=${editItem} s=${s} onClose=${() => setEditItem(null)} />
  </div>`;
}

function AddToListSheet({ open, s, onClose }) {
  const [count, setCount] = useState(0);
  const [key, setKey] = useState(0);
  const close = () => { setCount(0); onClose(); };
  const pick = (id) => { addToList(id); setCount((c) => c + 1); setKey((k) => k + 1); };
  return html`<${Sheet} open=${open} onClose=${close} title="Ajouter à la liste" subtitle=${count ? `${count} ajouté${count > 1 ? 's' : ''}` : 'Tape un produit, scanne ou crée-le'} tall
    footer=${count ? html`<button type="button" class="btn primary block" onClick=${close}><${Icon} name="check" size=${18} />Terminé</button>` : null}>
    <${ProductSearch} key=${key} s=${s} onPick=${pick} placeholder="Poulet, steak 5 %, riz…" />
  </${Sheet}>`;
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
  const cur = getProduct(s, item.productId);
  const opts = productsForIng(s, cur.ing);
  return html`<${Sheet} open=${true} onClose=${onClose} title="Choisir le produit" subtitle=${ING[cur.ing]?.name} tall>
    <div class="pick-list">${opts.map((p) => html`<${ProductRow} key=${p.id} s=${s} p=${p} onClick=${() => { swapItemProduct(item.id, p.id); onClose(); }}
      right=${html`<span class="pick-right"><b class="num">${euro(productPrice(s, p.id))}</b><small>${unitPriceLabel(s, p)}</small>${p.id === cur.id ? html`<${Icon} name="check" size=${16} />` : null}</span>`} />`)}</div>
    <p class="subtle" style="margin-top:10px">Ton choix sera retenu pour les prochaines listes.</p>
  </${Sheet}>`;
}

function FinishSheet({ open, onClose, s }) {
  const [keep, setKeep] = useState(false);
  const [dlc, setDlc] = useState({});
  const checked = s.shoppingList.filter((x) => x.checked);
  const unchecked = s.shoppingList.length - checked.length;
  const total = listTotal(s, checked);
  const confirm = () => { finishShopping({ keepUnchecked: keep, dlcOverrides: dlc }); setDlc({}); onClose(); };
  return html`<${Sheet} open=${open} onClose=${onClose} title="Ranger mes courses" subtitle=${`${checked.length} articles · tout va au frigo et aux placards`}
    footer=${html`<button type="button" class="btn primary block lg" onClick=${confirm}><${Icon} name="check" size=${18} />Ranger · ${euro(total)}</button>`}>
    <div class="label">Dates estimées (modifiables)</div>
    <div class="list">${checked.map((it) => {
      const info = listItemInfo(s, it);
      const prod = getProduct(s, it.productId);
      const est = prod ? estimateDlc(s, prod.id, prod.ing) : '';
      const where = prod ? (prod.storage || ING[prod.ing]?.storage) : 'placard';
      return html`<div class="list-item" key=${it.id} style="min-height:58px">
<${Thumb} p=${prod} emoji=${info.emoji} />
        <div class="grow" style="min-width:0"><div class="small strong clamp2">${info.name}</div>
          <div class="subtle xs">${where === 'frigo' ? '🧊 Frigo' : '📦 Placard'} · ×${it.qty}</div></div>
        <input type="date" class="field date-sm" value=${dlc[it.id] || est} onInput=${(e) => setDlc({ ...dlc, [it.id]: e.currentTarget.value })} />
      </div>`;
    })}</div>
    ${unchecked > 0 && html`<div class="row between card flat" style="margin-top:14px">
      <div class="small"><b>Garder les ${unchecked} articles non cochés</b><div class="subtle">Pour la prochaine fois</div></div>
      <${Toggle} on=${keep} onChange=${setKeep} label="Garder les non cochés" />
    </div>`}
  </${Sheet}>`;
}

function CatalogTab({ s }) {
  const [q, setQ] = useState('');
  const dq = useDebounced(q, 160);
  const results = useMemo(() => searchProducts(s, dq, { limit: 60 }), [dq, s.customProducts, s.profile.stores]);
  const inList = new Set(s.shoppingList.map((x) => x.productId));
  return html`<div>
    <div class="search" style="margin-top:14px"><${Icon} name="search" size=${18} />
      <input class="field" type="search" placeholder="Chercher parmi des milliers de produits" value=${q} onInput=${(e) => setQ(e.currentTarget.value)} /></div>
    <p class="subtle" style="margin:10px 2px 0">${userStores(s).map((k) => STORES[k].name).join(', ')} · prix indicatifs${s.lastTicketSync ? `, prix réels du ticket du ${fmtShort(s.lastTicketSync)}` : ''}</p>
    ${dq.trim().length < 2 && html`<${Empty} emoji="🔎" title="Tape un produit">Ex : steak 5 %, skyr, riz basmati.</${Empty}>`}
    ${results.length > 0 && html`<div class="pick-list" style="margin-top:10px">${results.map((p) => html`<${ProductRow} key=${p.id} s=${s} p=${p} onClick=${() => addToList(p.id)}
      right=${html`<span class="pick-right"><b class="num">${euro(productPrice(s, p.id))}</b><small>${s.priceOverrides[p.id] ? 'prix ticket' : unitPriceLabel(s, p)}</small></span>
        <span class=${`icon-btn sm ${inList.has(p.id) ? 'in' : 'add'}`}><${Icon} name=${inList.has(p.id) ? 'check' : 'plus'} size=${16} /></span>`} />`)}</div>`}
  </div>`;
}

const MONTHS_FULL = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const pad2 = (n) => String(n).padStart(2, '0');
const sum = (arr) => arr.reduce((n, x) => n + x.total, 0);

function HistoryTab({ s }) {
  const [open, setOpen] = useState(null);
  const curMonth = today().slice(0, 7);
  const [openMonths, setOpenMonths] = useState({ [curMonth]: true });
  const h = [...s.history].sort((a, b) => b.date.localeCompare(a.date));
  const [y, m] = curMonth.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const inMonth = h.filter((x) => x.date.startsWith(curMonth));
  const months = [...new Set(h.map((x) => x.date.slice(0, 7)))];
  const avgMonthTrip = inMonth.length ? sum(inMonth) / inMonth.length : 0;
  const avgTrip = h.length ? sum(h) / h.length : 0;
  const avgMonth = months.length ? sum(h) / months.length : 0;
  const years = [...new Set(months.map((k) => k.slice(0, 4)))];

  return html`<div>
    <div class="card pad-lg" style="margin-top:14px">
      <div class="row between"><div><div class="strong">Ce mois-ci</div><div class="subtle xs">Du 01/${pad2(m)} au ${lastDay}/${pad2(m)}</div></div>
        <div class="h1 num" style="font-size:28px">${euro(sum(inMonth))}</div></div>
      <div class="stats3">
        <div><b class="num">${euro(avgMonthTrip)}</b><span>Moy. par course ce mois</span></div>
        <div><b class="num">${euro(avgTrip)}</b><span>Moy. par course (global)</span></div>
        <div><b class="num">${euro(avgMonth)}</b><span>Dépense moy. par mois</span></div>
      </div>
    </div>
    ${!h.length && html`<${Empty} emoji="🧾" title="Pas encore de courses rangées" />`}
    ${years.map((yr) => html`<div key=${yr}>
      <div class="store-title">${yr}</div>
      ${months.filter((k) => k.startsWith(yr)).map((k) => {
        const trips = h.filter((x) => x.date.startsWith(k));
        const isOpen = !!openMonths[k];
        return html`<div key=${k}>
          <button type="button" class="month-head" onClick=${() => setOpenMonths({ ...openMonths, [k]: !isOpen })} aria-expanded=${isOpen}>
            <span class="grow"><b>${MONTHS_FULL[+k.slice(5) - 1].replace(/^./, (c) => c.toUpperCase())}</b><small>${trips.length} course${trips.length > 1 ? 's' : ''}</small></span>
            <b class="num">${euro(sum(trips))}</b><${Icon} name=${isOpen ? 'chevU' : 'chevD'} size=${18} />
          </button>
          ${isOpen && html`<div class="stack">${trips.map((x) => html`<${Trip} key=${x.id} s=${s} x=${x} open=${open === x.id} onToggle=${() => setOpen(open === x.id ? null : x.id)} />`)}</div>`}
        </div>`;
      })}
    </div>`)}
  </div>`;
}

function Trip({ s, x, open, onToggle }) {
  return html`<div class="card tappable" onClick=${onToggle}>
        <div class="hist-item">
          <span class="thumb sm" style="background:var(--sage-50)">${x.source === 'ticket' ? '🧾' : '🛒'}</span>
          <div class="grow">
            <div class="strong">${relDay(x.date) === fmtDayLong(x.date) ? fmtDayLong(x.date) : `${relDay(x.date)} · ${fmtShort(x.date)}`}</div>
            <div class="subtle">${x.count} articles${x.items[0]?.store ? ` · ${STORES[x.items[0].store]?.name || ''}` : ''}${x.source === 'ticket' ? ' · ticket' : ''}</div>
          </div>
          <div class="h3 num">${euro(x.total)}</div>
          <${Icon} name=${open ? 'chevU' : 'chevD'} size=${18} class="muted" />
        </div>
        ${open && html`<div style="margin-top:12px">
          ${x.items.map((it) => html`<div class="kv"><span class="clamp2" style="min-width:0">${it.qty > 1 ? `${it.qty} × ` : ''}${it.name}</span><span class="num strong">${euro(it.price * it.qty)}</span></div>`)}
          <button type="button" class="btn soft sm block" style="margin-top:10px" onClick=${(e) => { e.stopPropagation(); x.items.forEach((it) => it.productId && getProduct(s, it.productId) && addToList(it.productId, it.qty, { silent: true })); }}>
            <${Icon} name="refresh" size=${15} />Remettre dans ma liste</button>
        </div>`}
      </div>`;
}

function TicketSheet({ open, onClose, s }) {
  const [raw, setRaw] = useState('');
  const [parsed, setParsed] = useState(null);
  const [dlcs, setDlcs] = useState({});
  const close = () => { setRaw(''); setParsed(null); setDlcs({}); onClose(); };
  const analyse = () => {
    const res = parseTicket(raw.slice(0, 20000), userStores(s)[0]);
    const est = {};
    for (const it of res.items) { const p = getProduct(s, it.productId); est[it.key] = estimateDlc(s, p.id, p.ing); }
    setDlcs(est); setParsed(res);
  };
  const apply = () => { applyTicket(parsed.items, dlcs); close(); };
  const footer = parsed
    ? html`<div class="row"><button type="button" class="btn ghost" onClick=${() => setParsed(null)}>Retour</button>
        <button type="button" class="btn primary grow" disabled=${!parsed.items.length} onClick=${apply}><${Icon} name="check" size=${18} />Tout ranger (${parsed.items.length})</button></div>`
    : html`<button type="button" class="btn primary block lg" disabled=${!raw.trim()} onClick=${analyse}><${Icon} name="sparkles" size=${18} />Analyser le ticket</button>`;

  return html`<${Sheet} open=${open} onClose=${close} title="Importer mon ticket" subtitle=${parsed ? `${STORES[parsed.store].name} · vérifie juste les dates` : 'Ticket dématérialisé de ton magasin'} footer=${footer}>
    ${!parsed && html`<div>
      <button type="button" class="btn outline sm" style="margin-bottom:12px" onClick=${() => setRaw(SAMPLE_TICKET)}><${Icon} name="clipboard" size=${16} />Coller un exemple</button>
      <textarea class="field" maxlength="20000" placeholder="Colle ici le texte de ton ticket (appli du magasin, mail…)" value=${raw} onInput=${(e) => setRaw(e.currentTarget.value)}></textarea>
      <p class="subtle" style="margin-top:8px">Les produits vont directement au frigo ou au placard, les prix réels remplacent les prix indicatifs et ta liste est cochée. Rien n’est envoyé en ligne.</p>
    </div>`}
    ${parsed && html`<div>
      <div class="list">${parsed.items.map((it) => {
        const p = getProduct(s, it.productId);
        const where = ING[p.ing]?.storage;
        return html`<div class="list-item" key=${it.key} style="min-height:60px">
          <span style="font-size:20px">${ING[p.ing]?.emoji}</span>
          <div class="grow" style="min-width:0"><div class="small strong clamp2">${p.name}</div>
            <div class="subtle xs">${where === 'frigo' ? '🧊 Frigo' : '📦 Placard'} · ${it.qty > 1 ? `${it.qty} × ` : ''}${euro(it.unitPrice)}</div></div>
          <input type="date" class="field date-sm" value=${dlcs[it.key] || ''} onInput=${(e) => setDlcs({ ...dlcs, [it.key]: e.currentTarget.value })} />
        </div>`;
      })}</div>
      ${parsed.ignored.length > 0 && html`<details style="margin-top:10px"><summary class="subtle">${parsed.ignored.length} lignes non reconnues</summary>
        <pre class="subtle xs" style="white-space:pre-wrap">${parsed.ignored.join('\n')}</pre></details>`}
    </div>`}
  </${Sheet}>`;
}
