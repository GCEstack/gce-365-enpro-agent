// static/js/components/stats.js — Top stat cards
import { api } from '../api.js';
import { state, subscribe } from '../state.js';

const labels = {
  total_processed: { label: 'Total Processed', sub: 'all time', admin: true },
  green_count: { label: 'Auto-Approved', sub: 'green confidence', admin: true },
  pending_count: { label: 'Needs Review', sub: 'in queue', admin: false },
  customer_crosswalk_count: { label: 'Customers Mapped', sub: 'crosswalk entries', admin: true },
  item_crosswalk_count: { label: 'Item Coverage', sub: 'customer-item pairs', admin: true }
};

export function initStats() {
  const main = document.querySelector('.main');
  if (!main) return;
  const container = document.createElement('div');
  container.className = 'stats';
  container.id = 'statsRow';
  main.appendChild(container);

  subscribe('isAdmin', render);
  subscribe('stats', render);
  loadStats();
  setInterval(loadStats, 30000);
}

async function loadStats() {
  try {
    const stats = await api.stats();
    state.stats = stats;
  } catch (e) {
    console.error('Failed to load stats', e);
  }
  render();
}

function render() {
  const container = document.getElementById('statsRow');
  if (!container) return;
  container.innerHTML = Object.entries(labels).map(([key, cfg]) => {
    const value = state.stats[key] ?? '-';
    const hidden = cfg.admin && !state.isAdmin ? 'style="display:none"' : '';
    return `
      <div class="stat-card" ${hidden}>
        <div class="label">${cfg.label}</div>
        <div class="value">${value}</div>
        <div class="sub">${cfg.sub}</div>
      </div>
    `;
  }).join('');
}
