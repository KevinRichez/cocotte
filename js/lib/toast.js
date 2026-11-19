// Toasts légers avec action optionnelle (ex : "Annuler").
const listeners = new Set();
let toasts = [];
let seq = 0;

export function toast(message, { action, onAction, duration = 3200 } = {}) {
  const id = ++seq;
  toasts = [...toasts.slice(-2), { id, message, action, onAction }];
  emit();
  setTimeout(() => dismiss(id), duration);
}
export function dismiss(id) { toasts = toasts.filter((t) => t.id !== id); emit(); }
export function subscribeToasts(fn) { listeners.add(fn); fn(toasts); return () => listeners.delete(fn); }
function emit() { listeners.forEach((l) => l(toasts)); }
