// static/js/components/queue.js — PO list sidebar with filters
import { api } from '../api.js';
import { state, setState, subscribe } from '../state.js';
import { escapeHtml, qs, showToast } from '../utils.js';
import { initDetail } from './detail.js';

let filter = 'all';

export function init(container) {
  container.className = 'queue-layout';
  container.innerHTML = `
    <aside class="queue-sidebar">
      <div class="queue-header">
        <h3>Purchase Orders</h3>
        <div class="filter-pills">
          <button class="pill active" data-filter="all">All</button>
          <button class="pill" data-filter="green">Green</button>
          <button class="pill" data-filter="yellow">Yellow</button>
          <button class="pill" data-filter="red">Red</button>
        </div>
      </div>
      <div id="queueList"></div>
    </aside>
    <div id="detailContainer"></div>
  `;

  container.querySelector('.filter-pills').addEventListener('click', e => {
    if (e.target.dataset.filter) {
      filter = e.target.dataset.filter;
      container.querySelectorAll('.pill').forEach(p => p.classList.toggle('active', p.dataset.filter === filter));
      render();
    }
  });

  subscribe('queue', render);
  subscribe('selectedPoId', render);
  initDetail(container.querySelector('#detailContainer'));
  loadQueue();
}

async function loadQueue() {
  try {
    const data = await api.reviewAll();
    state.queue = Array.isArray(data) ? data : [];
  } catch (e) {
    state.queue = [];
    showToast('Queue load failed', e.message, 'error');
    console.error('Failed to load queue', e);
  }
  render();
}

function render() {
  const list = qs('#queueList');
  if (!list) return;

  const items = filter === 'all'
    ? state.queue
    : state.queue.filter(po => (po.confidence || '').toLowerCase() === filter);

  if (!items.length) {
    list.innerHTML = '<div class="empty">No POs in this queue.</div>';
    return;
  }

  list.innerHTML = items.map(po => `
    <div class="po-item ${state.selectedPoId === po.intake_id ? 'selected' : ''}" data-id="${po.intake_id}">
      <div class="po-num">
        <span class="dot ${(po.confidence || 'red').toLowerCase()}"></span>
        ${escapeHtml(po.po_number || po.intake_id)}
      </div>
      <div class="po-meta">${escapeHtml(po.customer_name || 'Unknown customer')} • ${escapeHtml(po.source || 'direct')}</div>
    </div>
  `).join('');

  list.querySelectorAll('.po-item').forEach(el => {
    el.addEventListener('click', () => setState('selectedPoId', el.dataset.id));
  });
}
