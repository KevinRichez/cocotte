// Parseur de ticket E.Leclerc dématérialisé (texte collé).
// Reconnaît les lignes "LIBELLE ... 1,25", "2 x 0,89 LIBELLE 1,78" ou "LIBELLE 2 x 0,89 1,78".
import { CATALOG, BRANDS } from '../data/catalog.js';

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const SKIP = /(total|sous-total|tva|carte|cb |c\.b|espece|rendu|ticket|merci|siret|caisse|ticket|fidelite|avantage|remise|bon d'achat|points|net a payer|a payer|articles?\s*:)/i;
const money = (s) => parseFloat(s.replace(',', '.'));

function brandHint(text) {
  if (/\b(mr|marque repere|repere)\b/.test(text)) return 'Marque Repère';
  if (/eco\s?\+|eco plus|\beco\b/.test(text)) return 'Eco+';
  if (/bio village|\bbio\b/.test(text)) return 'Bio Village';
  return null;
}

function matchProduct(label) {
  const text = norm(label);
  const brand = brandHint(text);
  let best = null;
  for (const prod of CATALOG) {
    let score = 0;
    for (const kw of prod.keywords) {
      const k = norm(kw);
      if (k.length > 2 && text.includes(k)) score += k.length > 5 ? 2 : 1.5;
    }
    if (!score) continue;
    if (brand && prod.brand === brand) score += 1.5;
    if (!brand && prod.brand === 'Bio Village') score -= 0.5;
    if (!best || score > best.score) best = { prod, score };
  }
  return best && best.score >= 1.5 ? best.prod : null;
}

export function parseTicket(raw) {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const items = [];
  const ignored = [];
  for (const line of lines) {
    if (SKIP.test(norm(line))) { ignored.push(line); continue; }
    const priceMatch = line.match(/(-?\d+[.,]\d{2})\s*(€|eur)?\s*[A-Z]?$/i);
    if (!priceMatch) { ignored.push(line); continue; }
    let total = money(priceMatch[1]);
    if (total <= 0) { ignored.push(line); continue; }
    let label = line.slice(0, priceMatch.index).trim();
    let qty = 1;
    let unit = total;
    const qx = label.match(/(\d+)\s*[x×*]\s*(\d+[.,]\d{2})/i);
    if (qx) {
      qty = parseInt(qx[1], 10);
      unit = money(qx[2]);
      label = label.replace(qx[0], ' ').trim();
    }
    label = label.replace(/\s{2,}/g, ' ');
    const prod = matchProduct(label);
    if (prod) items.push({ line, label, productId: prod.id, qty, unitPrice: unit, total });
    else ignored.push(line);
  }
  return { items, ignored };
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

export { BRANDS };
