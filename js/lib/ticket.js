import { guessIngredient, ING } from '../data/ingredients.js';
import { STORES, bankProduct } from '../data/products.js';

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const SKIP = /(total|sous-total|tva|carte|cb |c\.b|espece|rendu|ticket|merci|siret|caisse|fidelite|avantage|remise|bon d'achat|points|net a payer|a payer|articles?\s*:|sac cabas|sac )/i;
const money = (s) => parseFloat(s.replace(',', '.'));

const STORE_HINTS = [
  ['leclerc', /leclerc/], ['carrefour', /carrefour/], ['lidl', /lidl/], ['auchan', /auchan/], ['intermarche', /intermarche/],
  ['superu', /super u|hyper u|magasins u|\bsuper\s?u\b/], ['aldi', /aldi/], ['monoprix', /monoprix/], ['casino', /casino/],
];

function tierHint(text, store) {
  const st = STORES[store];
  if (/\bbio\b/.test(text)) return 'bio';
  if (st.eco && text.includes(norm(st.eco).replace('+', ''))) return 'eco';
  if (/\beco\s?\+|\bpouce\b|\bsimpl\b|top budget|bien vu|premier prix/.test(text)) return 'eco';
  return null;
}

function productFor(store, ing, tier) {
  const fresh = ING[ing].fresh;
  const order = tier ? [tier] : [];
  order.push(fresh ? 'vrac' : 'mdd', 'eco', 'nat', 'bio', 'vrac');
  for (const t of order) { const p = bankProduct(`${store}.${ing}.${t}`); if (p) return p; }
  return null;
}

export function parseTicket(raw, defaultStore = 'leclerc') {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const head = norm(lines.slice(0, 6).join(' '));
  const store = STORE_HINTS.find(([, re]) => re.test(head))?.[0] || defaultStore;
  const items = [];
  const ignored = [];
  lines.forEach((line, n) => {
    const t = norm(line);
    if (SKIP.test(t)) { ignored.push(line); return; }
    const priceMatch = line.match(/(-?\d+[.,]\d{2})\s*(€|eur)?\s*[A-Z]?$/i);
    if (!priceMatch) { ignored.push(line); return; }
    const total = money(priceMatch[1]);
    if (total <= 0) { ignored.push(line); return; }
    let label = line.slice(0, priceMatch.index).trim();
    let qty = 1, unit = total;
    const qx = label.match(/(\d+)\s*[x×*]\s*(\d+[.,]\d{2})/i);
    if (qx) { qty = parseInt(qx[1], 10); unit = money(qx[2]); label = label.replace(qx[0], ' ').trim(); }
    label = label.replace(/\s{2,}/g, ' ');
    const ing = guessIngredient(label);
    const prod = ing && productFor(store, ing, tierHint(norm(label), store));
    if (prod) items.push({ key: `t${n}`, line, label, productId: prod.id, qty, unitPrice: unit, total });
    else ignored.push(line);
  });
  return { store, items, ignored };
}

export const SAMPLE_TICKET = `E.LECLERC
TICKET DE CAISSE
TORSADES MR 1KG              1,25
FILETS POULET MR X4          6,49
2 x 0,89  MOZZARELLA MR      1,78
OEUFS PLEIN AIR MR X12       3,55
FROMAGE BLANC 3,2% MR 1KG    1,99
BANANES                      1,85
RIZ LONG ECO+ 1KG            1,25
STEAKS HACHES 15% MR X4      3,89
EMMENTAL RAPE MR 200G        1,85
LAIT DEMI ECREME MR 1L       0,99
SAC CABAS                    0,10
TOTAL                       23,99
CB                          23,99`;
