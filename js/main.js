import { html, render } from './lib/h.js';
import { useStore, setTab } from './store.js';
import { Icon, Toasts, ConfirmHost } from './components/ui.js';
import { WeekView } from './views/WeekView.js';
import { ShoppingView } from './views/ShoppingView.js';
import { RecipesView } from './views/RecipesView.js';
import { ProfileView } from './views/ProfileView.js';
import { Onboarding } from './views/Onboarding.js';
import { dlcInfo } from './lib/dates.js';

const TABS = [
  { id: 'week', label: 'Semaine', icon: 'calendar', View: WeekView },
  { id: 'shop', label: 'Courses', icon: 'cart', View: ShoppingView },
  { id: 'recipes', label: 'Recettes', icon: 'book', View: RecipesView },
  { id: 'profile', label: 'Profil', icon: 'user', View: ProfileView },
];

function App() {
  const s = useStore();
  if (!s.profile.onboarded) return html`<div class="app"><${Onboarding} /><${Toasts} /><${ConfirmHost} /></div>`;
  const tab = TABS.find((t) => t.id === s.ui.tab) || TABS[0];
  const badge = {
    shop: s.shoppingList.filter((x) => !x.checked).length,
    profile: s.inventory.filter((x) => { const d = dlcInfo(x.dlc); return d.days >= 0 && d.days <= 2; }).length,
  };
  const go = (id) => { if (id !== tab.id) { setTab(id); window.scrollTo({ top: 0 }); } };
  return html`<div class="app">
    <${tab.View} />
    <${Toasts} />
    <${ConfirmHost} />
    <nav class="bottom-nav" aria-label="Navigation principale">
      ${TABS.map((t) => html`<button type="button" class=${`nav-btn ${tab.id === t.id ? 'active' : ''}`} onClick=${() => go(t.id)} aria-current=${tab.id === t.id ? 'page' : null}>
        <span class="nav-ico"><${Icon} name=${t.icon} size=${21} stroke=${tab.id === t.id ? 2.3 : 2} /></span>
        ${t.label}
        ${badge[t.id] > 0 && html`<span class="nav-badge">${badge[t.id]}</span>`}
      </button>`)}
    </nav>
  </div>`;
}

if (new URLSearchParams(location.search).has('share')) setTab('shop', { shopTab: 'list' });
// Ancien lien de remise à zéro : désactivé, car Android rouvre une app tuée
// avec son lien d'origine et relançait la remise à zéro.
if (new URLSearchParams(location.search).has('vider-stock')) history.replaceState(null, '', location.pathname);
render(html`<${App} />`, document.getElementById('app'));
document.documentElement.classList.add('ready');
