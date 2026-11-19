import { html, render } from './lib/h.js';
import { useStore, setTab } from './store.js';
import { Icon, Toasts } from './components/ui.js';
import { WeekView } from './views/WeekView.js';
import { ShoppingView } from './views/ShoppingView.js';
import { RecipesView } from './views/RecipesView.js';
import { ProfileView } from './views/ProfileView.js';
import { dlcInfo } from './lib/dates.js';

const TABS = [
  { id: 'week', label: 'Semaine', icon: 'calendar' },
  { id: 'shop', label: 'Courses', icon: 'cart' },
  { id: 'recipes', label: 'Recettes', icon: 'book' },
  { id: 'profile', label: 'Profil', icon: 'user' },
];

function App() {
  const s = useStore();
  const tab = s.ui.tab;
  const listCount = s.shoppingList.filter((x) => !x.checked).length;
  const soonCount = s.inventory.filter((x) => { const d = dlcInfo(x.dlc); return d.days >= 0 && d.days <= 2; }).length;
  const badge = { shop: listCount, profile: soonCount };
  const go = (id) => { setTab(id); window.scrollTo({ top: 0 }); };

  return html`<div class="app">
    ${tab === 'week' && html`<${WeekView} />`}
    ${tab === 'shop' && html`<${ShoppingView} />`}
    ${tab === 'recipes' && html`<${RecipesView} />`}
    ${tab === 'profile' && html`<${ProfileView} />`}
    <${Toasts} />
    <nav class="bottom-nav" aria-label="Navigation principale">
      ${TABS.map((t) => html`<button class=${`nav-btn ${tab === t.id ? 'active' : ''}`} onClick=${() => go(t.id)} aria-current=${tab === t.id ? 'page' : null}>
        <span class="nav-ico"><${Icon} name=${t.icon} size=${21} stroke=${tab === t.id ? 2.3 : 2} /></span>
        ${t.label}
        ${badge[t.id] > 0 && html`<span class="nav-badge">${badge[t.id]}</span>`}
      </button>`)}
    </nav>
  </div>`;
}

render(html`<${App} />`, document.getElementById('app'));
