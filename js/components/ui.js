import { html, useState, useEffect, useRef } from '../lib/h.js';
import { Icon } from './icons.js';
import { subscribeToasts, dismiss, toast } from '../lib/toast.js';
import { subscribeConfirm, answer } from '../lib/confirm.js';
import { useRecipePhoto, setPhoto, photoFromFile } from '../lib/photos.js';
import { TIER_META, TIER_KEYS, kcalFmt } from '../lib/engine.js';

export { Icon };

export function Chip({ active, onClick, children, sm, dashed, title }) {
  const cls = ['chip', sm && 'sm', active && 'active', dashed && 'dashed'].filter(Boolean).join(' ');
  return html`<button type="button" class=${cls} onClick=${onClick} title=${title} aria-pressed=${!!active}>${children}</button>`;
}

export const Badge = ({ tone = 'neutral', children }) => html`<span class=${`badge ${tone}`}>${children}</span>`;

export function Seg({ value, onChange, options }) {
  return html`<div class="seg" role="tablist">
    ${options.map((o) => html`<button type="button" role="tab" aria-selected=${value === o.value} class=${value === o.value ? 'on' : ''} onClick=${() => onChange(o.value)}>
      ${o.icon && html`<${Icon} name=${o.icon} size=${16} />`}${o.label}
    </button>`)}
  </div>`;
}

export function Toggle({ on, onChange, label }) {
  return html`<button type="button" class=${`toggle ${on ? 'on' : ''}`} role="switch" aria-checked=${on} aria-label=${label} onClick=${() => onChange(!on)}></button>`;
}

export function Stepper({ value, onChange, min = 0, max = Infinity, step = 1, format }) {
  const set = (v) => onChange(Math.min(max, Math.max(min, Math.round(v * 10) / 10)));
  return html`<div class="stepper">
    <button type="button" aria-label="Moins" onClick=${(e) => { e.stopPropagation(); set(value - step); }}><${Icon} name="minus" size=${16} /></button>
    <span>${format ? format(value) : value}</span>
    <button type="button" aria-label="Plus" onClick=${(e) => { e.stopPropagation(); set(value + step); }}><${Icon} name="plus" size=${16} /></button>
  </div>`;
}

export function KcalGauge({ eaten, planned, target, compact }) {
  const max = Math.max(target * 1.2, planned, 1);
  const pct = (v) => `${Math.min(100, (v / max) * 100)}%`;
  const reached = eaten >= target - 50;
  const plannedOk = planned >= target - 50;
  return html`<div class=${`gauge-wrap ${compact ? 'compact' : ''}`}>
    <div class="gauge-nums">
      <div><span class="g-big num">${kcalFmt(eaten)}</span><span class="g-unit">/ ${kcalFmt(target)} kcal</span></div>
      ${reached && html`<span class="badge sage"><${Icon} name="check" size=${12} />Atteint</span>`}
    </div>
    <div class="gauge" role="img" aria-label=${`${kcalFmt(eaten)} kcal mangées, ${kcalFmt(planned)} prévues, repère ${kcalFmt(target)}`}>
      <i class="g-planned" style=${{ width: pct(planned) }}></i>
      <i class="g-eaten" style=${{ width: pct(eaten) }}></i>
      <span class="g-target" style=${{ left: pct(target) }}></span>
    </div>
    <div class="gauge-legend">
      <span><i class="dot-eaten"></i>Mangé</span>
      <span><i class="dot-planned"></i>Avec le prévu : <b class="num">${kcalFmt(planned)}</b></span>
      <span class=${plannedOk ? 'ok' : ''}>${plannedOk ? 'Objectif atteint' : `Manque ~${kcalFmt(target - planned)}`}</span>
    </div>
  </div>`;
}

export function TierPicker({ value, onChange, compact }) {
  return html`<div class=${`tiers ${compact ? 'compact' : ''}`} role="radiogroup">
    ${TIER_KEYS.map((k) => html`<button type="button" role="radio" aria-checked=${value === k} class=${`tier ${k} ${value === k ? 'on' : ''}`}
      title=${TIER_META[k].label} onClick=${(e) => { e.stopPropagation(); onChange(value === k ? null : k); }}>
      <span>${TIER_META[k].emoji}</span>${!compact && html`<small>${TIER_META[k].label}</small>`}
    </button>`)}
  </div>`;
}

let openSheets = 0;
export function Sheet({ open, onClose, title, subtitle, children, footer, tall }) {
  const [dy, setDy] = useState(0);
  const start = useRef(null);
  useEffect(() => {
    if (!open) return;
    setDy(0);
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    openSheets++;
    document.body.classList.add('locked');
    return () => { document.removeEventListener('keydown', onKey); openSheets = Math.max(0, openSheets - 1); if (!openSheets) document.body.classList.remove('locked'); };
  }, [open]);
  if (!open) return null;
  const down = (e) => { start.current = e.clientY; e.currentTarget.setPointerCapture(e.pointerId); };
  const move = (e) => { if (start.current != null) setDy(Math.max(0, e.clientY - start.current)); };
  const up = () => { if (dy > 110) onClose(); else setDy(0); start.current = null; };
  return html`
    <div class="sheet-backdrop" onClick=${onClose}></div>
    <div class=${`sheet ${tall ? 'tall' : ''}`} role="dialog" aria-modal="true" aria-label=${title}
      style=${dy ? { transform: `translate(-50%, ${dy}px)`, transition: 'none' } : null}>
      <div class="sheet-handle" onPointerDown=${down} onPointerMove=${move} onPointerUp=${up} onPointerCancel=${up}><i></i></div>
      ${title && html`<div class="sheet-head">
        <div class="grow"><div class="h2">${title}</div>${subtitle && html`<div class="subtle">${subtitle}</div>`}</div>
        <button type="button" class="icon-btn sm" aria-label="Fermer" onClick=${onClose}><${Icon} name="x" size=${16} /></button>
      </div>`}
      <div class="sheet-body">${children}</div>
      ${footer && html`<div class="sheet-foot">${footer}</div>`}
    </div>`;
}

export function Swipeable({ children, onLeft, onRight, leftLabel, rightLabel, leftIcon = 'check', rightIcon = 'trash' }) {
  const [x, setX] = useState(0);
  const [drag, setDrag] = useState(false);
  const st = useRef(null);
  const down = (e) => { st.current = { x: e.clientX, y: e.clientY, locked: null }; };
  const move = (e) => {
    const s = st.current; if (!s) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (s.locked == null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      s.locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (s.locked === 'x') { setDrag(true); e.currentTarget.setPointerCapture(e.pointerId); }
    }
    if (s.locked === 'x') {
      let v = dx;
      if (!onRight && v > 0) v *= 0.15;
      if (!onLeft && v < 0) v *= 0.15;
      setX(v);
    }
  };
  const up = () => {
    const s = st.current; st.current = null; setDrag(false);
    if (s?.locked === 'x') {
      if (x > 90 && onRight) { setX(0); onRight(); return; }
      if (x < -90 && onLeft) { setX(-500); setTimeout(() => { setX(0); onLeft(); }, 180); return; }
    }
    setX(0);
  };
  const onClickCapture = (e) => { if (Math.abs(x) > 4) { e.stopPropagation(); e.preventDefault(); } };
  return html`<div class="swipe">
    <div class="swipe-bg" style=${{ background: x > 0 ? 'var(--sage-50)' : x < 0 ? 'var(--peach-50)' : 'transparent' }}>
      ${x > 0 && html`<span class="l"><${Icon} name=${leftIcon} size=${18} />${rightLabel}</span>`}
      ${x < 0 && html`<span class="r">${leftLabel}<${Icon} name=${rightIcon} size=${18} /></span>`}
    </div>
    <div class=${`swipe-fg ${drag ? 'dragging' : ''}`} style=${{ transform: `translateX(${x}px)` }}
      onPointerDown=${down} onPointerMove=${move} onPointerUp=${up} onPointerCancel=${up} onClickCapture=${onClickCapture}>
      ${children}
    </div>
  </div>`;
}

export function Toasts() {
  const [list, setList] = useState([]);
  useEffect(() => subscribeToasts(setList), []);
  return html`<div class="toasts" aria-live="polite">
    ${list.map((t) => html`<div class="toast" key=${t.id}>
      <span>${t.message}</span>
      ${t.action && html`<button type="button" onClick=${() => { t.onAction?.(); dismiss(t.id); }}>${t.action}</button>`}
    </div>`)}
  </div>`;
}

export function ConfirmHost() {
  const [c, setC] = useState(null);
  useEffect(() => subscribeConfirm(setC), []);
  return html`<${Sheet} open=${!!c} onClose=${() => answer(false)} title=${c?.title}
    footer=${c && html`<div class="row"><button type="button" class="btn ghost grow" onClick=${() => answer(false)}>${c.cancel}</button>
      <button type="button" class="btn primary grow" onClick=${() => answer(true)}>${c.confirm}</button></div>`}>
    ${c?.message && html`<p class="muted" style="margin:0 2px 4px">${c.message}</p>`}
  </${Sheet}>`;
}

// Vignette de recette : la photo de ton plat si tu en as pris une, sinon l'emoji
export function RecipeThumb({ r, cls = 'thumb', children }) {
  const src = useRecipePhoto(r?.id);
  if (!r) return null;
  return html`<span class=${`${cls} ${src ? 'has-photo' : ''}`} style=${src ? { backgroundImage: `url("${src}")` } : { background: r.color }}>${children}${src ? '' : r.emoji}</span>`;
}

export function PhotoButton({ recipeId, label = 'Photo du plat', iconOnly }) {
  const onFile = async (e) => {
    const f = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!f) return;
    try {
      const ok = setPhoto(recipeId, await photoFromFile(f));
      toast(ok ? 'Photo du plat enregistrée' : 'Mémoire pleine : photo non enregistrée');
    } catch { toast('Photo illisible'); }
  };
  return html`<label class=${iconOnly ? 'icon-btn sm plain' : 'btn ghost sm'} style="cursor:pointer" aria-label=${label} onClick=${(e) => e.stopPropagation()}>
    <${Icon} name="camera" size=${iconOnly ? 16 : 15} />${iconOnly ? '' : label}
    <input type="file" accept="image/*" capture="environment" hidden onChange=${onFile} /></label>`;
}

export function Empty({ emoji = '🌿', title, children }) {
  return html`<div class="empty"><div class="big">${emoji}</div><div class="h3" style="color:var(--ink-2)">${title}</div>${children && html`<div class="small" style="margin-top:4px">${children}</div>`}</div>`;
}

export function SectionTitle({ title, right }) {
  return html`<div class="section-title"><div class="h2">${title}</div>${right}</div>`;
}

export function useDebounced(value, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}
