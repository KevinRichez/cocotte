// Confirmation des actions sensibles : await confirmAction({ title, message, confirm })
const listeners = new Set();
let current = null;
export function confirmAction({ title, message = '', confirm = 'Confirmer', cancel = 'Annuler' }) {
  return new Promise((resolve) => { current?.resolve(false); current = { title, message, confirm, cancel, resolve }; emit(); });
}
export function answer(v) { const c = current; current = null; emit(); c?.resolve(v); }
export function subscribeConfirm(fn) { listeners.add(fn); fn(current); return () => listeners.delete(fn); }
function emit() { listeners.forEach((l) => l(current)); }
