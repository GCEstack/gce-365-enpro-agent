// static/js/components/invoices.js — Invoices admin (module usually disabled)
import { api } from '../api.js';
import { escapeHtml, qs, showToast } from '../utils.js';

export function init(container) {
  container.innerHTML = `
    <h2>Invoices</h2>
    <div class="empty">Invoice module is disabled in server configuration.</div>
    <button class="btn btn-blue" id="btnLoad" style="margin-top:16px;">Try Load Anyway</button>
    <div id="invoiceResult" style="margin-top:16px;"></div>
  `;
  container.querySelector('#btnLoad').addEventListener('click', () => loadInvoices(container));
}

async function loadInvoices(container) {
  const result = qs('#invoiceResult', container);
  result.innerHTML = '<div class="empty">Loading invoices…</div>';
  try {
    const data = await api.invoices();
    renderTable(result, ['invoice_id', 'po_number', 'status'], data.invoices || data || []);
  } catch (e) {
    showToast('Invoices unavailable', e.message, 'warning');
    result.innerHTML = '';
  }
}

function renderTable(container, columns, rows) {
  if (!rows.length) {
    container.innerHTML = '<div class="empty">No invoices.</div>';
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
