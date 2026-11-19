import { html, useState, useEffect, useRef } from '../lib/h.js';
import { Icon } from './icons.js';
import { subscribeToasts, dismiss } from '../lib/toast.js';
import { BRANDS } from '../data/catalog.js';

export { Icon };

export function Chip({ active, onClick, children, sm, tone, dashed, title }) {
  const cls = ['chip', sm && 'sm', active && (tone === 'sage' ? 'active-sage' : 'active'), dashed && 'dashed'].filter(Boolean).join(' ');
  return html`<button class=${cls} onClick=${onClick} title=${title} aria-pressed=${!!active}>${children}</button>`;
}

export const Badge = ({ tone = 'neutral', children }) => html`<span class=${`badge ${tone}`}>${children}</span>`;

export function BrandTag({ brand }) {
  const b = BRANDS[brand];
  if (!b) return null;
  return html`<span class=${`brand ${b.cls}`}>${b.short}</span>`;
}

export function Seg({ value, onChange, options }) {
  return html`<div class="seg" role="tablist">
    ${options.map((o) => html`<button role="tab" class=${value === o.value ? 'on' : ''} onClick=${() => onChange(o.value)}>
      ${o.icon && html`<${Icon} name=${o.icon} size=${16} />`}${o.label}
    </button>`)}
  </div>`;
}

export function Toggle({ on, onChange, label }) {
  return html`<button class=${`toggle ${on ? 'on' : ''}`} role="switch" aria-checked=${on} aria-label=${label} onClick=${() => onChange(!on)}></button>`;
}

export function Stepper({ value, onChange, min = 0, step = 1, format }) {
  return html`<div class="stepper">
    <button aria-label="Moins" onClick=${(e) => { e.stopPropagation(); onChange(Math.max(min, Math.round((value - step) * 10) / 10)); }}><${Icon} name="minus" size=${16} /></button>
    <span>${format ? format(value) : value}</span>
    <button aria-label="Plus" onClick=${(e) => { e.stopPropagation(); onChange(Math.round((value + step) * 10) / 10); }}><${Icon} name="plus" size=${16} /></button>
  </div>`;
}

export function Ring({ value, max, size = 76, stroke = 8, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, max ? value / max : 0);
  return html`<div class="ring-wrap" style=${{ width: size + 'px', height: size + 'px' }}>
    <svg width=${size} height=${size}>
      <circle cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke="var(--surface-3)" stroke-width=${stroke} />
      <circle cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke="var(--sage)" stroke-width=${stroke} stroke-linecap="round"
        stroke-dasharray=${c} stroke-dashoffset=${c * (1 - pct)} style="transition: stroke-dashoffset .6s var(--ease)" />
    </svg>
    <div class="ring-center">${children}</div>
  </div>`;
}

/** Bottom sheet avec poignée (glisser vers le bas pour fermer). */
export function Sheet({ open, onClose, title, subtitle, children, footer }) {
  const [dy, setDy] = useState(0);
  const start = useRef(null);
  useEffect(() => {
    if (!open) return;
    setDy(0);
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open]);
  if (!open) return null;
  const down = (e) => { start.current = e.clientY; e.currentTarget.setPointerCapture(e.pointerId); };
  const move = (e) => { if (start.current != null) setDy(Math.max(0, e.clientY - start.current)); };
  const up = () => { if (dy > 110) onClose(); else setDy(0); start.current = null; };
  return html`
    <div class="sheet-backdrop" onClick=${onClose}></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-label=${title}
      style=${dy ? { transform: `translate(-50%, ${dy}px)`, transition: 'none' } : null}>
      <div class="sheet-handle" onPointerDown=${down} onPointerMove=${move} onPointerUp=${up} onPointerCancel=${up}><i></i></div>
      ${title && html`<div class="sheet-head">
        <div class="grow"><div class="h2">${title}</div>${subtitle && html`<div class="subtle">${subtitle}</div>`}</div>
        <button class="icon-btn sm" aria-label="Fermer" onClick=${onClose}><${Icon} name="x" size=${16} /></button>
      </div>`}
      <div class="sheet-body">${children}</div>
      ${footer && html`<div class="sheet-foot">${footer}</div>`}
    </div>`;
}

/** Ligne swipeable : glisser à droite (onRight) / à gauche (onLeft). */
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
      if (!onRight && v > 0) v = v * 0.15;
      if (!onLeft && v < 0) v = v * 0.15;
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
      ${t.action && html`<button onClick=${() => { t.onAction?.(); dismiss(t.id); }}>${t.action}</button>`}
    </div>`)}
  </div>`;
}

export function Empty({ emoji = '🌿', title, children }) {
  return html`<div class="empty"><div class="big">${emoji}</div><div class="h3" style="color:var(--ink-2)">${title}</div>${children && html`<div class="small" style="margin-top:4px">${children}</div>`}</div>`;
}

export function SectionTitle({ title, right }) {
  return html`<div class="section-title"><div class="h2">${title}</div>${right}</div>`;
}
