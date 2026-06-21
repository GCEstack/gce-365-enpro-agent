// static/js/components/outbound.js — Outbound queue admin
import { api } from '../api.js';
import { escapeHtml, qs, showToast } from '../utils.js';

export function init(container) {
  container.innerHTML = `
    <h2>Outbound Queue</h2>
    <button class="btn btn-blue" id="btnLoad" style="margin-bottom:16px;">Load Queue</button>
    <div id="outboundResult"></div>
  `;
  container.querySelector('#btnLoad').addEventListener('click', () => loadQueue(container));
}

async function loadQueue(container) {
  const result = qs('#outboundResult', container);
  result.innerHTML = '<div class="empty">Loading outbound queue…</div>';
  try {
    const data = await api.outboundQueue();
    renderTable(result, ['outbound_id', 'po_number', 'status', 'created_at'], data.queue || data || []);
  } catch (e) {
    showToast('Failed to load outbound queue', e.message, 'error');
    result.innerHTML = '';
  }
}

function renderTable(container, columns, rows) {
  if (!rows.length) {
    container.innerHTML = '<div class="empty">No outbound items.</div>';
    return;
  }
  container.innerHTML = `
    <div class="scroll-table">
      <table>
        <thead><tr>${columns.map(c => `<th>${escapeHtml(c)}</th>`).join('')}</tr></thead>
        <tbody>
          ${rows.map(row => `
            <tr>${columns.map(c => `<td>${escapeHtml(String(row[c] ?? '—'))}</td>`).join('')}</tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}
