// static/js/components/cism.js — CISM batch admin
import { api } from '../api.js';
import { escapeHtml, qs, showToast } from '../utils.js';

export function init(container) {
  container.innerHTML = `
    <h2>CISM Batch</h2>
    <div style="display:flex;gap:12px;margin-bottom:16px;">
      <button class="btn btn-blue" id="btnLoadBatch">Load Batch</button>
      <button class="btn btn-blue" id="btnLoadSchema">View Schema</button>
      <button class="btn btn-red" id="btnClear">Clear Batch</button>
    </div>
    <div id="cismResult"></div>
  `;

  container.querySelector('#btnLoadBatch').addEventListener('click', () => loadBatch(container));
  container.querySelector('#btnLoadSchema').addEventListener('click', () => loadSchema(container));
  container.querySelector('#btnClear').addEventListener('click', () => clearBatch(container));
}

async function loadBatch(container) {
  const result = qs('#cismResult', container);
  result.innerHTML = '<div class="empty">Loading batch…</div>';
  try {
    const data = await api.cismBatch();
    renderTable(result, ['po_number', 'customer_name', 'line_count', 'created_at'], data.batches || data || []);
  } catch (e) {
    showToast('Failed to load batch', e.message, 'error');
    result.innerHTML = '';
  }
}

async function loadSchema(container) {
  const result = qs('#cismResult', container);
  result.innerHTML = '<div class="empty">Loading schema…</div>';
  try {
    const data = await api.cismSchema();
    result.innerHTML = `<pre style="background:#141620;padding:16px;border-radius:6px;overflow:auto;">${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
  } catch (e) {
    showToast('Failed to load schema', e.message, 'error');
    result.innerHTML = '';
  }
}

async function clearBatch(container) {
  if (!confirm('Clear the current CISM batch?')) return;
  try {
    await api.clearCismBatch();
    showToast('Batch cleared', 'CISM batch has been cleared.', 'success');
    qs('#cismResult', container).innerHTML = '';
  } catch (e) {
    showToast('Clear failed', e.message, 'error');
  }
}

function renderTable(container, columns, rows) {
  if (!rows.length) {
    container.innerHTML = '<div class="empty">No batch data.</div>';
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
