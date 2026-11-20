const pad = (n) => String(n).padStart(2, '0');
export const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => iso(new Date());
export const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
export const diffDays = (a, b) => Math.round((parse(a) - parse(b)) / 86400000);
export const mondayOf = (s) => { const d = parse(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); };
export const weekDays = (monday) => Array.from({ length: 7 }, (_, i) => addDays(monday, i));

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const DAYS_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

export const dayShort = (s) => DAYS[parse(s).getDay()];
export const dayNum = (s) => parse(s).getDate();
export const fmtDayLong = (s) => { const d = parse(s); return `${DAYS_FULL[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`; };
export const fmtShort = (s) => { const d = parse(s); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
export const fmtRange = (a, b) => `${fmtShort(a)} au ${fmtShort(b)}`;

export function relDay(s) {
  const d = diffDays(s, today());
  if (d === 0) return "Aujourd'hui";
  if (d === 1) return 'Demain';
  if (d === -1) return 'Hier';
  return fmtDayLong(s);
}

export function dlcInfo(dlc) {
  if (!dlc) return { days: Infinity, label: 'Sans date', tone: 'neutral', soon: false };
  const days = diffDays(dlc, today());
  if (days < 0) return { days, label: 'Date passée', tone: 'mute', soon: true, past: true };
  if (days === 0) return { days, label: "Aujourd'hui", tone: 'peach', soon: true };
  if (days === 1) return { days, label: 'Demain', tone: 'peach', soon: true };
  if (days <= 3) return { days, label: `Dans ${days} j`, tone: 'amber', soon: days <= 2 };
  if (days <= 45) return { days, label: `${days} j`, tone: 'neutral', soon: false };
  return { days, label: fmtShort(dlc), tone: 'neutral', soon: false };
}
