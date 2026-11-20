import { guessIngredient, ING } from '../data/ingredients.js';
import { STORES } from '../data/products.js';

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const SKIP = /(sous[- ]?total|^total|total ttc|total ht|tva|taux|carte|\bcb\b|c\.b|espece|rendu|monnaie|merci|siret|caisse|caissier|fidelite|avantage|remise|reduction|bon d'achat|points|net a payer|a payer|articles?\s*:|nombre d'articles|sac cabas|^sac |ticket|transaction|autorisation|montant|visa|mastercard|contact ?less|sans contact|www\.|\bheure\b|\bdate\b|tel\b|telephone)/i;
const PRICE_END = /(-?\d{1,4}[.,]\d{2})\s*(€|eur)?\s*[A-Z]?\s*$/i;
const ONLY_NUMBERS = /^\s*(\d{1,2}\s+)?(\d+\s*[x×*]\s*)?(\d{1,4}[.,]\d{2}\s*(€|eur)?\s*){1,3}([A-Z]\s*)?$/i;
const WEIGHT_LINE = /(\d+[.,]\d{1,3})\s*kg\s*[x×*]\s*(\d+[.,]\d{2})\s*(€|eur)?\s*\/?\s*kg/i;
const money = (s) => parseFloat(String(s).replace(',', '.'));

const STORE_HINTS = [
  ['leclerc', /leclerc/], ['carrefour', /carrefour/], ['lidl', /lidl/], ['auchan', /auchan/], ['intermarche', /intermarche/],
  ['superu', /super u|hyper u|magasins u|\bsuper\s?u\b/], ['aldi', /aldi/], ['monoprix', /monoprix/], ['casino', /casino/],
];
const BRAND_TOKENS = /\b(mr|m\.r\.|marque repere|repere|eco\s?\+|eco plus|bio village|carrefour|simpl|pouce|auchan|top budget|bien vu|monoprix|essentiel|casino|tous les jours|u bio)\b/gi;

export function parseSize(label) {
  const t = norm(label).replace(',', '.');
  let m = t.match(/(\d+(?:\.\d+)?)\s*(kg|g|gr|grs|l|cl|ml)\b/);
  if (m) {
    const n = parseFloat(m[1]);
    const u = m[2];
    if (u === 'kg') return { size: Math.round(n * 1000), unit: 'g' };
    if (u.startsWith('g')) return { size: Math.round(n), unit: 'g' };
    if (u === 'l') return { size: Math.round(n * 1000), unit: 'ml' };
    if (u === 'cl') return { size: Math.round(n * 10), unit: 'ml' };
    return { size: Math.round(n), unit: 'ml' };
  }
  m = t.match(/\bx\s?(\d{1,3})\b/) || t.match(/\b(\d{1,3})\s?x\b/) || t.match(/\b(\d{1,3})\s?(pieces|pcs|tranches|tr|oeufs|pots|steaks)\b/);
  if (m) return { size: parseInt(m[1], 10), unit: 'pc' };
  return null;
}

export function prettyName(label) {
  const clean = label.replace(BRAND_TOKENS, ' ').replace(/\s{2,}/g, ' ').trim().toLowerCase();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export const ticketKey = (label) => norm(label).replace(/[^a-z0-9%]+/g, ' ').trim();

function tierHint(text, store) {
  const st = STORES[store];
  if (/\bbio\b/.test(text)) return 'bio';
  if (st.eco && text.includes(norm(st.eco).replace('+', ''))) return 'eco';
  if (/\beco\s?\+|\bpouce\b|\bsimpl\b|top budget|bien vu|premier prix/.test(text)) return 'eco';
  return 'mdd';
}

function mergeLines(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const next = lines[i + 1];
    const nextIsAmount = next && (ONLY_NUMBERS.test(next) || (WEIGHT_LINE.test(next) && PRICE_END.test(next) && !/[a-z]{4}/i.test(next.replace(WEIGHT_LINE, ''))));
    if (!PRICE_END.test(line) && nextIsAmount && /[a-z]{3}/i.test(line) && !SKIP.test(norm(line))) {
      out.push(`${line}   ${next}`);
      i++;
    } else out.push(line);
  }
  return out;
}

export function parseTicket(raw, defaultStore = 'leclerc', memory = []) {
  const lines = mergeLines(raw.split(/\r?\n/).map((l) => l.replace(/\s+$/, '').trim()).filter(Boolean));
  const head = norm(lines.slice(0, 8).join(' '));
  const store = STORE_HINTS.find(([, re]) => re.test(head))?.[0] || defaultStore;
  const remembered = new Map(memory.filter((p) => p.ticketKey).map((p) => [p.ticketKey, p]));
  const items = [];
  const ignored = [];

  lines.forEach((line, n) => {
    const t = norm(line);
    const weight = line.match(WEIGHT_LINE);
    if (weight && !/[a-z]{4}/i.test(line.replace(WEIGHT_LINE, ''))) {
      const last = items[items.length - 1];
      if (last && last.lineIndex === n - 1) { last.size = Math.round(money(weight[1]) * 1000); last.unit = 'g'; last.sizeFromTicket = true; }
      else ignored.push(line);
      return;
    }
    if (SKIP.test(t)) { ignored.push(line); return; }
    const priceMatch = line.match(PRICE_END);
    if (!priceMatch) { ignored.push(line); return; }
    const total = money(priceMatch[1]);
    let label = line.slice(0, priceMatch.index).trim();
    if (total <= 0 || !/[a-z]{3}/i.test(label)) { ignored.push(line); return; }

    let qty = 1, unit = total;
    const qx = label.match(/(\d+)\s*[x×*]\s*(\d+[.,]\d{2})/i);
    const cols = label.match(/\s(\d{1,2})\s+(\d+[.,]\d{2})\s*(€|eur)?\s*$/i);
    if (qx) { qty = parseInt(qx[1], 10); unit = money(qx[2]); label = label.replace(qx[0], ' '); }
    else if (cols && Math.abs(parseInt(cols[1], 10) * money(cols[2]) - total) < 0.05) { qty = parseInt(cols[1], 10); unit = money(cols[2]); label = label.slice(0, cols.index); }
    else if (cols) label = label.slice(0, cols.index);
    if (weight) { label = label.replace(WEIGHT_LINE, ' '); }
    label = label.replace(/\s{2,}/g, ' ').replace(/^[\d\s*-]+(?=[a-z])/i, '').trim();
    if (!label) { ignored.push(line); return; }

    const key = ticketKey(label);
    const mem = remembered.get(key);
    const sz = weight ? { size: Math.round(money(weight[1]) * 1000), unit: 'g' } : parseSize(label);
    const ing = mem ? mem.ing : guessIngredient(label);
    const base = ing ? ING[ing] : null;
    items.push({
      key: `t${n}`, lineIndex: n, line, label, ticketKey: key, store, tier: tierHint(t, store),
      name: mem?.name || prettyName(label),
      ing: ing || null,
      size: mem?.size ?? sz?.size ?? base?.pack.size ?? null,
      unit: mem?.unit ?? sz?.unit ?? base?.unit ?? 'pc',
      sizeFromTicket: !!(mem || sz),
      qty, unitPrice: unit, total: Math.round(unit * qty * 100) / 100,
      remembered: !!mem, productId: mem?.id || null,
      storage: mem?.storage || base?.storage || 'placard',
    });
  });
  return { store, items, ignored: ignored.filter((l) => /[a-z]{3}/i.test(l) && !SKIP.test(norm(l))) };
}

export const SAMPLE_TICKET = `E.LECLERC
TICKET DE CAISSE
TORSADES MR 1KG              1,25
FILETS POULET MR X4          6,49
2 x 0,89  MOZZARELLA MR      1,78
OEUFS PLEIN AIR MR X12       3,55
FROMAGE BLANC 3,2% MR 1KG    1,99
BANANES                      1,85
CHAIR A SAUCISSE MR 500G     3,79
STEAK HACHE 5% MR X2         2,39
EMMENTAL RAPE MR 200G        1,85
LAIT DEMI ECREME MR 1L       0,99
SAC CABAS                    0,10
TOTAL                       25,94
CB                          25,94`;
