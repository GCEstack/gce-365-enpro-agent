// static/js/components/crosswalk.js — Crosswalk admin
import { api } from '../api.js';
import { escapeHtml, qs, showToast } from '../utils.js';

export function init(container) {
  container.innerHTML = `
    <h2>Crosswalks</h2>
    <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
      <button class="btn btn-blue" id="btnLoadCustomers">Load Customers</button>
      <button class="btn btn-blue" id="btnLoadItems">Load Items</button>
      <button class="btn btn-blue" id="btnLoadHistory">PO History</button>
      <button class="btn btn-gray" id="btnBuild">Rebuild Crosswalks</button>
    </div>
    <div id="crosswalkUpload" style="margin-bottom:16px;">
      <input type="file" id="crosswalkFile" accept=".csv">
      <button class="btn btn-green btn-sm" id="btnUploadCrosswalk" style="margin-left:8px;">Upload Crosswalk CSV</button>
    </div>
    <div id="crosswalkResult"></div>
  `;

  container.querySelector('#btnLoadCustomers').addEventListener('click', () => loadCustomers(container));
  container.querySelector('#btnLoadItems').addEventListener('click', () => loadItems(container));
  container.querySelector('#btnLoadHistory').addEventListener('click', () => loadHistory(container));
  container.querySelector('#btnBuild').addEventListener('click', () => buildCrosswalks(container));
  container.querySelector('#btnUploadCrosswalk').addEventListener('click', () => uploadCrosswalk(container));
}

async function loadCustomers(container) {
  const result = qs('#crosswalkResult', container);
  result.innerHTML = '<div class="empty">Loading customers…</div>';
  try {
    const data = await api.crosswalkCustomers(100);
    renderTable(result, ['customer_id', 'customer_name', 'ship_to_zip'], data.customers || data || []);
  } catch (e) {
    showToast('Failed to load customers', e.message, 'error');
    result.innerHTML = '';
  }
}

async function loadItems(container) {
  const result = qs('#crosswalkResult', container);
  result.innerHTML = '<div class="empty">Loading items…</div>';
  try {
    const data = await api.crosswalkItems(100);
    renderTable(result, ['item_id', 'customer_part_number', 'supplier_name'], data.items || data || []);
  } catch (e) {
    showToast('Failed to load items', e.message, 'error');
    result.innerHTML = '';
  }
}

async function loadHistory(container) {
  const result = qs('#crosswalkResult', container);
  result.innerHTML = '<div class="empty">Loading history…</div>';
  try {
    const data = await api.crosswalkPoHistory(100);
    renderTable(result, ['po_number', 'customer_name', 'mapped_at'], data.history || data || []);
  } catch (e) {
    showToast('Failed to load history', e.message, 'error');
    result.innerHTML = '';
  }
}

async function buildCrosswalks(container) {
  const result = qs('#crosswalkResult', container);
  result.innerHTML = '<div class="empty">Rebuilding crosswalks…</div>';
  try {
    await api.buildCrosswalk();
    showToast('Rebuild started', 'Crosswalk rebuild in progress.', 'info');
    const status = await api.buildCrosswalkStatus();
    result.innerHTML = `<div class="meta-box">Status: ${escapeHtml(JSON.stringify(status))}</div>`;
  } catch (e) {
    showToast('Rebuild failed', e.message, 'error');
    result.innerHTML = '';
  }
}

async function uploadCrosswalk(container) {
  const fileInput = qs('#crosswalkFile', container);
  if (!fileInput.files.length) {
    showToast('No file selected', 'Choose a crosswalk CSV.', 'warning');
    return;
  }
  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  try {
    await api.uploadCrosswalk(formData);
    showToast('Upload complete', 'Crosswalk file uploaded.', 'success');
  } catch (e) {
    showToast('Upload failed', e.message, 'error');
  }
}

function renderTable(container, columns, rows) {
  if (!rows.length) {
    container.innerHTML = '<div class="empty">No data.</div>';
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
