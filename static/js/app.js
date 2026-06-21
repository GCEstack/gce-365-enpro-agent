// static/js/app.js — Application shell and tab router
import { api } from './api.js';
import { state, setState, subscribe } from './state.js';
import { showToast, qs } from './utils.js';
import { initStats } from './components/stats.js';
import { initQueue } from './components/queue.js';
import { initUpload } from './components/upload.js';
import { initCrosswalk } from './components/crosswalk.js';
import { initCism } from './components/cism.js';
import { initP21 } from './components/p21.js';
import { initOutbound } from './components/outbound.js';
import { initInvoices } from './components/invoices.js';

const tabs = [
  { id: 'queue', label: 'Review Queue', group: '📥 Intake', admin: false, init: initQueue },
  { id: 'upload', label: 'Add PO', group: '📥 Intake', admin: false, init: initUpload },
  { id: 'crosswalk', label: 'Crosswalks', group: '⚙️ Admin', admin: true, init: initCrosswalk },
  { id: 'cism', label: 'CISM Batch', group: '⚙️ Admin', admin: true, init: initCism },
  { id: 'p21', label: 'P21 Payloads', group: '⚙️ Admin', admin: true, init: initP21 },
  { id: 'outbound', label: 'Outbound', group: '⚙️ Admin', admin: true, init: initOutbound },
  { id: 'invoices', label: 'Invoices', group: '⚙️ Admin', admin: true, init: initInvoices }
];

function renderApp() {
  document.getElementById('app').innerHTML = `
    <div class="app">
      <header class="topbar">
        <div style="display:flex;align-items:center;gap:16px;">
          <h1>EnPro PO Agent <span>PO Automation</span></h1>
        </div>
        <div class="topbar-actions">
          <span id="modeBadge" class="badge-conf green">Operator</span>
          <button id="modeToggleBtn" class="btn btn-gray btn-sm">Admin View</button>
          <span><span class="status-dot"></span> Online</span>
        </div>
      </header>
      <div class="main">
        <nav class="tabs" id="mainTabs"></nav>
        <div id="tabPanels"></div>
      </div>
    </div>
  `;
}

function renderTabs() {
  const nav = qs('#mainTabs');
  if (!nav) return;
  const visibleTabs = tabs.filter(t => !t.admin || state.isAdmin);
  const groups = {};
  visibleTabs.forEach(t => { groups[t.group] = groups[t.group] || []; groups[t.group].push(t); });

  nav.innerHTML = Object.entries(groups).map(([group, items]) => `
    <div class="tab-group">
      <span class="tab-group-label">${group}</span>
      ${items.map(t => `
        <button class="tab ${state.tab === t.id ? 'active' : ''}" data-tab="${t.id}">
          ${t.label}
        </button>
      `).join('')}
    </div>
  `).join('');
}

function renderPanels() {
  const container = qs('#tabPanels');
  if (!container) return;
  container.innerHTML = tabs.map(t => `
    <section class="tab-panel ${state.tab === t.id ? 'active' : ''}" data-panel="${t.id}"></section>
  `).join('');
  tabs.forEach(t => t.init(qs(`[data-panel="${t.id}"]`)));
}

async function initAdmin() {
  try {
    const cfg = await api.uiConfig();
    state.passphrase = cfg.admin_passphrase || '';
  } catch (e) {
    console.warn('UI config unavailable', e);
  }

  qs('#modeToggleBtn').addEventListener('click', () => {
    if (state.isAdmin) {
      setState('isAdmin', false);
      return;
    }
    if (!state.passphrase) {
      showToast('Admin disabled', 'Admin passphrase is not configured server-side.', 'warning');
      return;
    }
    const input = prompt('Admin passphrase:');
    if (input === state.passphrase) {
      setState('isAdmin', true);
    } else if (input !== null) {
      showToast('Access denied', 'Incorrect passphrase.', 'error');
    }
  });

  subscribe('isAdmin', () => {
    qs('#modeBadge').textContent = state.isAdmin ? 'Admin' : 'Operator';
    qs('#modeBadge').className = state.isAdmin ? 'badge-conf yellow' : 'badge-conf green';
    qs('#modeToggleBtn').textContent = state.isAdmin ? 'Exit Admin' : 'Admin View';
    renderTabs();
    renderPanels();
  });
}

function init() {
  renderApp();
  initStats();
  renderTabs();
  renderPanels();
  initAdmin();

  qs('#mainTabs').addEventListener('click', e => {
    const tabBtn = e.target.closest('[data-tab]');
    if (tabBtn) setState('tab', tabBtn.dataset.tab);
  });

  subscribe('tab', () => {
    renderTabs();
    qs('.tab-panel.active')?.classList.remove('active');
    const panel = qs(`[data-panel="${state.tab}"]`);
    if (panel) panel.classList.add('active');
  });

  showToast('Ready', 'EnPro PO Agent review portal loaded.', 'success', 3000);
}

init();
