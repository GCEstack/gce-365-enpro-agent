// static/js/components/detail.js — PO detail panel with approve/reject/edit/P21 submit
import { api } from '../api.js';
import { state, setState, subscribe } from '../state.js';
import { escapeHtml, formatCurrency, formatDate, qs, showToast, confirmDialog } from '../utils.js';

export function init(container) {
  if (!container) return;
  container.className = 'detail-panel';
  subscribe('selectedPoId', load);
  load(state.selectedPoId);
}

async function load(id) {
  const container = qs('#detailContainer');
  if (!container) return;
  if (!id) {
    container.innerHTML = '<div class="empty">Select a PO to review.</div>';
    return;
  }
  container.innerHTML = '<div class="empty">Loading…</div>';
  try {
    const po = await api.getPo(id);
    state.currentPo = po;
    render(po, container);
  } catch (e) {
    container.innerHTML = `<div class="empty">Error loading PO: ${escapeHtml(e.message)}</div>`;
  }
}

function render(po, container) {
  const confidence = (po.confidence || 'red').toLowerCase();
  container.innerHTML = `
    <h2>
      PO ${escapeHtml(po.po_number || po.intake_id)}
      <span class="badge-conf ${confidence}">${confidence}</span>
    </h2>
    <div class="meta-grid">
      <div class="meta-box"><div class="lbl">Customer</div><div class="val">${escapeHtml(po.customer_name || '—')}</div></div>
      <div class="meta-box"><div class="lbl">Ship To</div><div class="val">${escapeHtml(po.ship_to_name || '—')}</div></div>
      <div class="meta-box"><div class="lbl">PO Date</div><div class="val">${formatDate(po.po_date)}</div></div>
      <div class="meta-box"><div class="lbl">Source</div><div class="val">${escapeHtml(po.source || 'direct')}</div></div>
      <div class="meta-box"><div class="lbl">Total</div><div class="val">${formatCurrency(po.total_amount)}</div></div>
      <div class="meta-box"><div class="lbl">Status</div><div class="val">${escapeHtml(po.status || 'pending')}</div></div>
    </div>
    <h3>Line Items</h3>
    <table>
      <thead><tr><th>Line</th><th>Customer PN</th><th>Item</th><th>Qty</th><th>Price</th><th>Score</th></tr></thead>
      <tbody>
        ${(po.lines || []).map((line, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${escapeHtml(line.customer_part_number || '—')}</td>
            <td>${escapeHtml(line.item_number || line.item_id_p21 || '—')}</td>
            <td>${line.quantity ?? line.qty_ordered ?? '—'}</td>
            <td>${formatCurrency(line.unit_price)}</td>
            <td><span class="score-pill ${(line.confidence || 'red').toLowerCase()}">${(line.confidence || 'red').toLowerCase()}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="action-bar">
      <button class="btn btn-green" id="btnApprove">Approve</button>
      <button class="btn btn-red" id="btnReject">Reject</button>
      <button class="btn btn-blue" id="btnP21">Submit to P21</button>
    </div>
  `;

  qs('#btnApprove', container).addEventListener('click', () => approve(po.intake_id));
  qs('#btnReject', container).addEventListener('click', () => reject(po.intake_id));
  qs('#btnP21', container).addEventListener('click', () => submitP21(po.intake_id));
}

async function approve(id) {
  try {
    await api.approvePo(id, { reviewer: 'operator', notes: '' });
    showToast('Approved', `PO ${id} approved.`, 'success');
    setState('selectedPoId', null);
    refreshQueue();
  } catch (e) {
    showToast('Approve failed', e.message, 'error');
  }
}

async function reject(id) {
  const reason = prompt('Reason for rejection:');
  if (!reason) return;
  try {
    await api.rejectPo(id, { reviewer: 'operator', reason });
    showToast('Rejected', `PO ${id} rejected.`, 'warning');
    setState('selectedPoId', null);
    refreshQueue();
  } catch (e) {
    showToast('Reject failed', e.message, 'error');
  }
}

async function submitP21(id) {
  if (!confirmDialog('Submit this PO to P21?')) return;
  try {
    await api.p21Submit(id, { reviewer: 'operator', notes: '' });
    showToast('Submitted', `PO ${id} submitted to P21.`, 'success');
  } catch (e) {
    showToast('P21 submit failed', e.message, 'error');
  }
}

async function refreshQueue() {
  try {
    const data = await api.reviewAll();
    state.queue = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('Failed to refresh queue', e);
  }
}
