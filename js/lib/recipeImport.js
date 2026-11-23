// Import d'une recette depuis un texte collé ou une photo (lu sur le téléphone, rien n'est envoyé)
import { ING, matchIngredientText } from '../data/ingredients.js';

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const FRAC = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 };

const ING_HEAD = /^(ingr[eé]dients?|il vous faut|liste des ingr[eé]dients)\b/i;
const STEP_HEAD = /^(pr[eé]paration|[eé]tapes?|instructions?|recette|d[eé]roul[eé]|r[eé]alisation|m[eé]thode)\b/i;
const SERVES = /pour\s+(\d{1,2})\s*(personnes?|pers\.?|portions?|parts?|gourmands?)|(\d{1,2})\s*(personnes?|portions?|parts?)\b/i;

function parseNumber(s) {
  if (!s) return null;
  if (FRAC[s]) return FRAC[s];
  if (/^\d+\/\d+$/.test(s)) { const [a, b] = s.split('/').map(Number); return b ? a / b : null; }
  const n = parseFloat(s.replace(',', '.'));
  return isFinite(n) ? n : null;
}

const QTY = /^[-•*·▪◦\s]*(\d+(?:[.,]\d+)?|\d+\/\d+|[½¼¾⅓⅔])?\s*(kg|kilos?|g|gr|grammes?|cl|ml|l|litres?|c\.?\s*[aà]\s*(?:soupe|s\.?)|cs|cas|c\.?\s*[aà]\s*(?:caf[eé]|c\.?)|cc|cac|cuill[eè]res?\s*[aà]\s*(?:soupe|caf[eé])|pinc[eé]es?|tranches?|sachets?|bo[iî]tes?|gousses?|brins?|filets?|pots?|verres?|poign[eé]es?)?\.?\s+(?:de\s+|d['’]\s*)?(.+)$/i;

function toQty(n, unitRaw, ing) {
  const u = norm(unitRaw || '').replace(/\s+/g, ' ');
  const target = ING[ing].unit;
  let q = n ?? 1, unit = null;
  if (/^(kg|kilo)/.test(u)) { q *= 1000; unit = 'g'; }
  else if (/^(g|gr|gramme)/.test(u)) unit = 'g';
  else if (/^l(itre)?s?$/.test(u)) { q *= 1000; unit = 'ml'; }
  else if (u === 'cl') { q *= 10; unit = 'ml'; }
  else if (u === 'ml') unit = 'ml';
  else if (/soupe|^cs$|^cas$|c\.? ?a ?s/.test(u)) { q *= 15; unit = target === 'ml' ? 'ml' : 'g'; }
  else if (/cafe|^cc$|^cac$|c\.? ?a ?c/.test(u)) { q *= 5; unit = target === 'ml' ? 'ml' : 'g'; }
  else if (/pincee/.test(u)) { q *= 1; unit = 'g'; }
  else if (/verre/.test(u)) { q *= 200; unit = target === 'g' ? 'g' : 'ml'; }
  else if (/poignee/.test(u)) { q *= 30; unit = 'g'; }
  else unit = 'pc';
  if (unit === target || (unit === 'g' && target === 'ml') || (unit === 'ml' && target === 'g')) return q;
  if (unit === 'pc' && target !== 'pc') return q * (ING[ing].portion || 100);
  if (unit !== 'pc' && target === 'pc') return Math.max(1, Math.round(q / 100));
  return q;
}

function guessEquipment(text) {
  const t = norm(text);
  const eq = [];
  if (/\bfour\b|enfourn|gratin/.test(t)) eq.push('four');
  if (/poele|faire revenir|dorer|saisir/.test(t)) eq.push('poele');
  if (/casserole|faire bouillir|eau bouillante|cuire les pates|cuire le riz/.test(t)) eq.push('casserole');
  if (/micro[- ]?onde/.test(t)) eq.push('micro-ondes');
  if (/air ?fryer|friteuse sans huile/.test(t)) eq.push('airfryer');
  if (/mixer|blender|mixeur/.test(t)) eq.push('blender');
  return eq;
}

export function parseRecipeText(raw) {
  const lines = String(raw || '').replace(/\r/g, '').split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 200);
  if (!lines.length) return null;
  const serves = parseInt((raw.match(SERVES) || [])[1] || (raw.match(SERVES) || [])[3] || '0', 10) || null;
  let name = lines.find((l) => !ING_HEAD.test(l) && !STEP_HEAD.test(l) && !SERVES.test(l) && l.length > 3 && l.length < 80) || 'Recette importée';
  name = name.replace(/^#+\s*/, '').replace(/\s*[-|:].*(marmiton|750g|cuisine az|journal des femmes).*$/i, '').trim();

  let mode = null;
  const ingLines = [], stepLines = [];
  for (const l of lines) {
    if (l === name) continue;
    if (ING_HEAD.test(l)) { mode = 'ing'; continue; }
    if (STEP_HEAD.test(l)) { mode = 'step'; continue; }
    if (SERVES.test(l) && l.length < 40) continue;
    const looksIng = l.length < 70 && (QTY.test(l) && /^[-•*·▪◦\s]*(\d|[½¼¾⅓⅔])/.test(l) || (!/[.!?]$/.test(l) && matchIngredientText(l) && l.split(' ').length <= 6));
    if (mode === 'ing' || (!mode && looksIng)) ingLines.push(l);
    else if (mode === 'step' || l.length >= 25) stepLines.push(l.replace(/^(\d+[.)-]|étape\s*\d+\s*:?|[-•*·])\s*/i, ''));
  }

  const div = serves || 1;
  const ingredients = [], unknown = [];
  for (const l of ingLines) {
    const m = l.match(QTY);
    const rest = m ? m[3] : l.replace(/^[-•*·▪◦\s]+/, '');
    const ing = matchIngredientText(rest) || matchIngredientText(l);
    if (!ing) { unknown.push(l.replace(/^[-•*·▪◦\s]+/, '')); continue; }
    const n = m ? parseNumber(m[1]) : null;
    let qty = ING[ing].staple && !n ? 2 : toQty(n, m?.[2], ing) / div;
    qty = ING[ing].unit === 'pc' ? Math.max(0.5, Math.round(qty * 2) / 2) : Math.max(1, Math.round(qty));
    const ex = ingredients.find((x) => x.ing === ing);
    if (ex) ex.qty += qty; else ingredients.push({ ing, qty });
  }
  const all = lines.join(' ');
  const mins = [...all.matchAll(/(\d{1,3})\s*(?:min|minutes)\b/gi)].map((x) => +x[1]).filter((x) => x <= 240);
  const cook = mins.length ? Math.min(240, mins.reduce((a, b) => a + b, 0)) : 15;
  return {
    name: name.slice(0, 70), serves, ingredients, unknown,
    steps: stepLines.map((x) => x.slice(0, 240)).slice(0, 20),
    equipment: guessEquipment(all), prep: 10, cook: Math.min(cook, 180),
  };
}
