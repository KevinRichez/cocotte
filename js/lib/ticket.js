import { INGREDIENTS, ING } from '../data/ingredients.js';

const STOP = new Set(['les', 'des', 'aux', 'avec', 'sans', 'pour', 'bte', 'btl', 'slee', 'sleek', 'pet', 'fl', 'ls', 'jard', 'pack', 'lot', 'format', 'familial', 'maxi', 'offre', 'sachet', 'barquette', 'bocal', 'boite', 'extra', 'origine', 'france', 'label', 'ses', 'the']);
const wordsOf = (s) => s.split(/[^a-z0-9%]+/).filter(Boolean);
const wmatch = (a, b) => a === b || (Math.min(a.length, b.length) >= 4 && (a.startsWith(b) || b.startsWith(a)));
const ING_INDEX = INGREDIENTS.map((ing) => ({
  ing,
  keys: [...new Set(wordsOf(ing.keys).filter((w) => w.length >= 3))],
  name: wordsOf(ing.name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()).filter((w) => w.length >= 3),
  pcts: (ing.keys.match(/\d+%/g) || []),
}));

export function matchIngredient(label) {
  const t = norm(label).replace(BRAND_TOKENS, ' ');
  const pct = t.match(/(\d+)\s?%/)?.[1];
  const words = wordsOf(t.replace(/\d+\s?x\s?\d+\s?(g|kg|cl|ml|l)?\b|\d+([.,]\d+)?\s?(kg|g|gr|l|cl|ml)\b|\bx\s?\d+\b|\d+\s?%|\b\d+\b/g, ' '))
    .filter((w) => w.length >= 3 && !STOP.has(w) && !/^\d/.test(w));
  if (!words.length) return null;
  let best = null;
  for (const { ing, keys, name, pcts } of ING_INDEX) {
    const matched = words.filter((w) => keys.some((k) => wmatch(w, k)));
    if (!matched.length) continue;
    let score = matched.reduce((n, w) => n + (w.length > 5 ? 2 : 1), 0);
    if (pct && pcts.length) score += pcts.includes(`${pct}%`) ? 3 : -3;
    const nameHits = name.filter((n) => words.some((w) => wmatch(w, n))).length;
    if (!nameHits) score -= 1;
    const first = keys.some((k) => wmatch(words[0], k));
    if (first) score += 1;
    const coverage = matched.length / words.length;
    const ok = score >= 3 || (score >= 1 && coverage >= 0.5) || (first && score >= 2);
    if (!ok) continue;
    const rank = score + coverage + (name.length ? nameHits / name.length : 0);
    if (!best || rank > best.rank) best = { id: ing.id, rank };
  }
  return best?.id || null;
}

const NONFOOD_SECTION = /maison|entretien|hygiene|parfumerie|bazar|droguerie|textile|animal|jardin|papeterie|electro|multimedia|jouet|culture|auto/;
const NONFOOD_WORDS = /essuie|eponge|brosse|lessive|papier toilette|papier wc|mouchoir|shampo|gel douche|dentifrice|sac poubelle|liquide vaisselle|rouleau|recharge|rechar|javel|desodorisant|coton|rasoir|serviette|couche|litiere|piles?\b|ampoule/;
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
  let m = t.match(/\b(\d{1,2})\s?x\s?(\d+(?:\.\d+)?)\s?(kg|g|gr|cl|ml|l)\b/);
  if (m) {
    const each = parseFloat(m[2]) * (m[3] === 'kg' || m[3] === 'l' ? 1000 : m[3] === 'cl' ? 10 : 1);
    return { size: parseInt(m[1], 10), unit: 'pc', each: Math.round(each), eachUnit: /l$/.test(m[3]) ? 'ml' : 'g' };
  }
  m = t.match(/(\d+(?:\.\d+)?)\s*(kg|g|gr|grs|l|cl|ml)\b/);
  if (m) {
    const n = parseFloat(m[1]);
    const u = m[2];
    if (u === 'kg') return { size: Math.round(n * 1000), unit: 'g' };
    if (u.startsWith('g')) return { size: Math.round(n), unit: 'g' };
    if (u === 'l') return { size: Math.round(n * 1000), unit: 'ml' };
    if (u === 'cl') return { size: Math.round(n * 10), unit: 'ml' };
    return { size: Math.round(n), unit: 'ml' };
  }
  m = t.match(/\bx\s?(\d{1,3})\b/) || t.match(/\b(\d{1,3})\s?x\b/) || t.match(/\b(\d{1,3})\s?(pieces|pcs|tranches|tr|t|oeufs|pots|steaks)\b/) || t.match(/^(\d{1,2})\s+[a-z]{3}/);
  if (m) return { size: parseInt(m[1], 10), unit: 'pc' };
  return null;
}

const ABBREV = {
  rb: 'Red Bull', plet: 'poulet', poul: 'poulet', pou: 'poulet', plt: 'poulet', dde: 'dinde', dind: 'dinde', bf: 'bœuf', boeuf: 'bœuf',
  vde: 'viande', vd: 'viande', vbf: 'viande bovine', vb: 'viande bovine', hach: 'haché', jbon: 'jambon', jbn: 'jambon', jamb: 'jambon',
  sauc: 'saucisses', sauciss: 'saucisses', lard: 'lardons', allum: 'allumettes', fum: 'fumé', fume: 'fumé', fumes: 'fumées', fumee: 'fumée',
  emm: 'emmental', emment: 'emmental', fromag: 'fromage', from: 'fromage', moz: 'mozzarella', mozza: 'mozzarella',
  yt: 'yaourt', yts: 'yaourts', yaou: 'yaourt', ya: 'yaourt', lt: 'lait', ent: 'entier', ecr: 'écrémé', cr: 'crème', crm: 'crème', fraich: 'fraîche',
  nat: 'nature', choc: 'chocolat', chocol: 'chocolat', cara: 'caramel', vanil: 'vanille', fram: 'framboise', framb: 'framboise', abric: 'abricot',
  pom: 'pomme', pomm: 'pommes', ban: 'banane', leg: 'légumes', legum: 'légumes', pdt: 'pommes de terre', pdts: 'pommes de terre', carot: 'carottes',
  courg: 'courgettes', tom: 'tomates', tomat: 'tomates', champ: 'champignons', champi: 'champignons', oign: 'oignons', haric: 'haricots',
  pts: 'petits', ptits: 'petits', spag: 'spaghetti', spagh: 'spaghetti', torsad: 'torsades', coquil: 'coquillettes', basm: 'basmati',
  floc: 'flocons', flc: 'flocons', cereal: 'céréales', bisc: 'biscuits', brioch: 'brioche', "brioch'burgers": 'brioche burgers', baguet: 'baguette',
  conf: 'confiture', huil: 'huile', oliv: 'olive', tourn: 'tournesol', vinaig: 'vinaigre', moutar: 'moutarde', mayo: 'mayonnaise', ketch: 'ketchup',
  sce: 'sauce', bolo: 'bolognaise', bolog: 'bolognaise', carbo: 'carbonara', pz: 'pizza', burritos: 'burrito', tr: 'tranches', trs: 'tranches',
  pr: 'pour', ss: 'sans', av: 'avec', ac: 'avec', demi: 'demi',
  fr: '', bte: '', btl: '', bt: '', slee: '', sleek: '', ls: '', pet: '', fl: '', bq: '', barq: '', surg: '', csn: '', sn: '', pq: '', pqt: '', uht: '', x: '',
};
const DROP_WORDS = new Set(['extra', 'extratendre', 'tendre', 'tendres', 'fondant', 'fondante', 'original', 'origin', 'originale', 'origine', 'classique',
  'tradition', 'traditionnel', 'traditionnelle', 'recette', 'premium', 'selection', 'authentique', 'gourmand', 'gourmande', 'maxi', 'format',
  'familial', 'offre', 'promo', 'bparis', 'csni', 'sni', 'nitrites', 'sup', 'dd', 'dg', 'ddg', 'decouenne', 'degraisse', 'csn', 'lot', 'pack', 'special', 'speciale', 'qualite', 'superieure', 'superieur', 'francais', 'francaise', 'gratuit', 'ferial',
  'lg', 'herta', 'fleury', 'michon', 'charal', 'panzani', 'barilla', 'lustucru', 'old', 'paso', 'maitre', 'coq', 'pere', 'dodu', 'bonduelle',
  'cassegrain', 'saurin', 'william', 'president', 'danone', 'yoplait', 'lactel', 'candia', 'nestle', 'kelloggs', 'heinz', 'amora', 'lesieur',
  'puget', 'mutti', 'aucy', 'tipiak', 'knorr', 'maggi', 'galbani', 'elle', 'vire', 'labeyrie', 'connetable', 'navire', 'gaulois', 'socopa', 'bigard']);
const ACCENTS = {
  hache: 'haché', hachee: 'hachée', haches: 'hachés', pelees: 'pelées', ecreme: 'écrémé', ecremee: 'écrémée', rape: 'râpé', rapee: 'râpée',
  creme: 'crème', cremes: 'crèmes', pate: 'pâte', pates: 'pâtes', oeuf: 'œuf', oeufs: 'œufs', legumes: 'légumes', epinards: 'épinards',
  cereales: 'céréales', cafe: 'café', puree: 'purée', poelee: 'poêlée', roti: 'rôti', rotie: 'rôtie', the: 'thé', gruyere: 'gruyère',
  emince: 'émincé', eminces: 'émincés', epices: 'épices', peche: 'pêche', fraiche: 'fraîche', frais: 'frais', entiere: 'entière',
  speciale: 'spéciale', reduit: 'réduit', allege: 'allégé', mais: 'maïs', grillee: 'grillée', grilles: 'grillés', dore: 'doré',
  edition: 'édition', etouffee: 'étouffée', etuvee: 'étuvée', braise: 'braisé', cuit: 'cuit', fumé: 'fumé', epaisse: 'épaisse', a: 'à', fumes: 'fumées', fume: 'fumé', fumees: 'fumées', nitrite: 'nitrite', cote: 'côte', cotes: 'côtes', pate: 'pâte', ble: 'blé', ses: 'sésame', eponges: 'éponges', eponge: 'éponge', ecrase: 'écrasé', petales: 'pétales', allumettes: 'allumettes', legere: 'légère', cuisine: 'cuisiné', cuisinee: 'cuisinée', saute: 'sauté', melange: 'mélange', premiere: 'première',
};

export function prettyName(label) {
  let s = norm(label).replace(BRAND_TOKENS, ' ');
  s = s.replace(/\b\d{1,2}\s?x\s?\d+([.,]\d+)?\s?(kg|g|gr|cl|ml|l)\b/g, ' ')
    .replace(/\b\d+([.,]\d+)?\s?(kg|g|gr|grs|cl|ml|l)\b/g, ' ')
    .replace(/\bx\s?\d+(=\d+)?\b/g, ' ').replace(/\b\d{1,2}\s?x\b/g, ' ')
    .replace(/\b\d+\/\d+\b/g, ' ').replace(/\b[a-z]\/[a-z]+\b/g, ' ').replace(/(\.[a-z0-9+]{1,3})+\.?\+?/g, ' ')
    .replace(/-[a-z]{2,3}\b/g, ' ').replace(/[€*=+]/g, ' ').replace(/^\d{1,2}\s+/, '')
    .replace(/\d+([.,]\d+)?\s?%\s?(mg)?/g, ' ').replace(/\b\d+\s?t\b/g, ' ').replace(/\bmg\b/g, ' ');
  const fix = (w) => (Object.prototype.hasOwnProperty.call(ABBREV, w) ? ABBREV[w] : ACCENTS[w] || w);
  const words = s.split(/\s+/).filter(Boolean)
    .filter((w) => !DROP_WORDS.has(w) && !/\d/.test(w))
    .map((w) => (w.includes("'") && !Object.prototype.hasOwnProperty.call(ABBREV, w) ? w.split("'").map(fix).join("'") : fix(w)))
    .filter(Boolean);
  const out = words.join(' ').replace(/\s{2,}/g, ' ').trim();
  return out ? out.charAt(0).toUpperCase() + out.slice(1) : label;
}

export function cleanTitle(name) {
  const out = String(name || '')
    .replace(/\d+([.,]\d+)?\s?%\s?(mg)?/gi, ' ')
    .replace(/\b\d+([.,]\d+)?\s?(kg|g|gr|cl|ml|l)\b/gi, ' ')
    .replace(/\b\d+\s?x\s?\d*\b|\bx\s?\d+\b/gi, ' ')
    .replace(/\s{2,}/g, ' ').trim();
  return out || name;
}

const NOT_FOR_RECIPES_ING = new Set(['soda', 'sirop', 'smoothie', 'cafe', 'the', 'patate_chips', 'boisson_proteinee', 'jus_multifruit']);
const NOT_FOR_RECIPES = /\b(red ?bull|rb|monster|coca|cola|pepsi|fanta|sprite|orangina|oasis|ice ?tea|lipton|schweppes|perrier|badoit|vittel|evian|cristaline|volvic|san pellegrino|eau|biere|bieres|vin|vins|whisky|vodka|rhum|champagne|cidre|energy|soda|chips|pringles|bonbons?|haribo|chewing|tabac|cigarettes?|tic tac|mentos)\b/;

export function ignoreReason(label, section, ing) {
  const t = norm(label);
  if (NONFOOD_SECTION.test(section) || NONFOOD_WORDS.test(t)) return 'Non alimentaire';
  if ((ing && NOT_FOR_RECIPES_ING.has(ing)) || NOT_FOR_RECIPES.test(t)) return 'Boisson ou snack';
  if (/alcool|vins|bieres|spiritueux/.test(section)) return 'Boisson ou snack';
  return null;
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

  const firstSection = lines.findIndex((l) => /^\*?\s*>>/.test(l));
  let section = '';
  let done = false;
  lines.forEach((line, n) => {
    if (done || (firstSection >= 0 && n < firstSection)) { ignored.push(line); return; }
    const t = norm(line);
    const sec = line.match(/^\*?\s*>>\s*(.+)$/);
    if (sec) { section = norm(sec[1]); return; }
    if (items.length && (/^total\b/.test(t.trim()) || /^-{6,}/.test(t.trim()))) { done = true; ignored.push(line); return; }
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
    label = label.replace(/^\s*\*\s*/, '').replace(/\s{2,}/g, ' ').trim();
    const sz = weight ? { size: Math.round(money(weight[1]) * 1000), unit: 'g' } : parseSize(label);
    label = label.replace(/^\d{1,2}\s+(?=[a-z]{3})/i, (m) => (sz?.unit === 'pc' ? m : '')).trim();
    if (!label) { ignored.push(line); return; }

    const key = ticketKey(label);
    const mem = remembered.get(key);
    const pctTxt = label.match(/\d+([.,]\d+)?\s?%/)?.[0] || '';
    const guessed = mem ? mem.ing : (matchIngredient(`${prettyName(label)} ${pctTxt}`) || matchIngredient(label));
    const reason = mem ? (mem.ignored ? mem.ignoredReason || 'Ignoré' : null) : ignoreReason(label, section, guessed);
    const ing = reason && reason !== 'Boisson ou snack' ? null : guessed;
    const base = ing ? ING[ing] : null;
    let size = sz?.size ?? null, sizeUnit = sz?.unit ?? null, packCount = 1;
    if (sz?.each && (!base || base.unit !== 'pc')) { size = sz.each; sizeUnit = sz.eachUnit; packCount = sz.size; }
    let estimated = false;
    if (!size && base && !base.staple) {
      const perUnit = base.pack.price / base.pack.size;
      size = base.unit === 'pc' ? Math.max(1, Math.round(unit / perUnit)) : Math.max(10, Math.round(unit / perUnit / 10) * 10);
      sizeUnit = base.unit;
      estimated = true;
    }
    const frozen = /surgel/.test(section);
    items.push({
      key: `t${n}`, lineIndex: n, line, label, ticketKey: key, store, tier: tierHint(t, store), section,
      name: mem ? (mem.offName || cleanTitle(mem.name)) : prettyName(label),
      ing: ing || null,
      size: mem?.size ?? size,
      unit: mem?.unit ?? sizeUnit ?? base?.unit ?? 'pc',
      sizeFromTicket: !!mem || (!!sz && !estimated),
      qty, packCount: mem?.packCount ?? packCount, unitPrice: unit, total: Math.round(unit * qty * 100) / 100,
      remembered: !!mem, productId: mem?.id || null, ignored: !!reason, ignoredReason: reason, frozen,
      image: mem?.image || null, nutri: mem?.nutri || null, barcode: mem?.barcode || null, brand: mem?.brand || null,
      storage: mem?.storage || (frozen ? 'frigo' : base?.storage) || (/cremerie|boucherie|charcuterie|traiteur|frais|poissonnerie|fromage/.test(section) ? 'frigo' : 'placard'),
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
