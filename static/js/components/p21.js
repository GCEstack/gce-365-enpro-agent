// static/js/components/p21.js — P21 payloads admin
import { api } from '../api.js';
import { escapeHtml, qs, showToast } from '../utils.js';

export function init(container) {
  container.innerHTML = `
    <h2>P21 Payloads</h2>
    <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
      <button class="btn btn-blue" id="btnLoad">Load Payloads</button>
      <button class="btn btn-green" id="btnPreflight">Preflight Batch</button>
      <button class="btn btn-green" id="btnBatch">Generate Batch</button>
      <button class="btn btn-gray" id="btnDownload">Download Batch</button>
    </div>
    <div id="p21Result"></div>
  `;

  container.querySelector('#btnLoad').addEventListener('click', () => loadPayloads(container));
  container.querySelector('#btnPreflight').addEventListener('click', () => preflightBatch(container));
  container.querySelector('#btnBatch').addEventListener('click', () => generateBatch(container));
  container.querySelector('#btnDownload').addEventListener('click', () => downloadBatch());
}

async function loadPayloads(container) {
  const result = qs('#p21Result', container);
  result.innerHTML = '<div class="empty">Loading payloads…</div>';
  try {
    const data = await api.p21Payloads();
    renderTable(result, ['intake_id', 'po_number', 'status', 'created_at'], data.payloads || data || []);
  } catch (e) {
    showToast('Failed to load payloads', e.message, 'error');
    result.innerHTML = '';
  }
}

async function preflightBatch(container) {
  const result = qs('#p21Result', container);
  result.innerHTML = '<div class="empty">Running preflight…</div>';
  try {
    const data = await api.p21Preflight({ intake_ids: [] });
    result.innerHTML = `<pre style="background:#141620;padding:16px;border-radius:6px;overflow:auto;">${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
  } catch (e) {
    showToast('Preflight failed', e.message, 'error');
    result.innerHTML = '';
  }
}

async function generateBatch(container) {
  const result = qs('#p21Result', container);
  result.innerHTML = '<div class="empty">Generating batch…</div>';
  try {
    const data = await api.p21Batch({ intake_ids: [] });
    result.innerHTML = `<pre style="background:#141620;padding:16px;border-radius:6px;overflow:auto;">${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
  } catch (e) {
    showToast('Batch generation failed', e.message, 'error');
    result.innerHTML = '';
  }
}

async function downloadBatch() {
  try {
    const resp = await fetch('/api/v1/p21/payload/batch/download');
    if (!resp.ok) throw new Error(resp.statusText);
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'p21_batch.json';
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    showToast('Download failed', e.message, 'error');
  }
}

function renderTable(container, columns, rows) {
  if (!rows.length) {
    container.innerHTML = '<div class="empty">No payloads.</div>';
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
