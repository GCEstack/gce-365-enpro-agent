// static/js/api.js — Centralized API client
const API = window.location.origin;

async function request(path, options = {}) {
  const url = `${API}${path}`;
  const resp = await fetch(url, {
    headers: { 'Accept': 'application/json', ...(options.headers || {}) },
    ...options
  });
  if (!resp.ok) {
    let detail = resp.statusText;
    try { const data = await resp.json(); detail = data.detail || detail; } catch (_) {}
    throw new Error(detail);
  }
  if (resp.status === 204) return null;
  return resp.json();
}

export const api = {
  // Stats
  stats: () => request('/api/v1/stats'),

  // Review queue
  reviewAll: () => request('/api/v1/review/all'),
  reviewApproved: () => request('/api/v1/review/approved'),
  getPo: (id) => request(`/api/v1/review/po/${id}`),
  approvePo: (id, body) => request(`/api/v1/review/po/${id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  rejectPo: (id, body) => request(`/api/v1/review/po/${id}/reject`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  editPo: (id, body) => request(`/api/v1/review/po/${id}/edit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  bulkApprove: (body) => request('/api/v1/review/bulk-approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),

  // Intake
  upload: (formData) => request('/api/v1/intake/upload', { method: 'POST', body: formData }),
  pollNow: () => request('/api/v1/intake/poll-now', { method: 'POST' }),

  // Lookup / suggestions
  lookupCustomerItems: (custId, limit = 200) => request(`/api/v1/lookup/customer-items/${custId}?limit=${limit}`),
  suggestMappings: (id) => request(`/api/v1/suggest/mappings/${id}`, { method: 'POST' }),
  decideMapping: (id, body) => request(`/api/v1/suggest/mappings/${id}/decide`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),

  // Crosswalk
  crosswalkCustomers: (limit = 100) => request(`/api/v1/crosswalk/customers?limit=${limit}`),
  crosswalkCustomerItems: (limit = 100) => request(`/api/v1/crosswalk/customer-items?limit=${limit}`),
  crosswalkItems: (limit = 100) => request(`/api/v1/crosswalk/items?limit=${limit}`),
  crosswalkPoHistory: (limit = 100) => request(`/api/v1/crosswalk/po-history?limit=${limit}`),
  crosswalkQuotes: (limit = 100) => request(`/api/v1/crosswalk/quotes?limit=${limit}`),
  uploadCrosswalk: (formData) => request('/api/v1/crosswalk/upload', { method: 'POST', body: formData }),
  buildCrosswalk: () => request('/api/v1/crosswalk/build', { method: 'POST' }),
  buildCrosswalkStatus: () => request('/api/v1/crosswalk/build/status'),
  uploadQuotes: (formData) => request('/api/v1/crosswalk/upload-quotes', { method: 'POST', body: formData }),

  // CISM
  cismSchema: () => request('/api/v1/cism/schema'),
  cismBatch: () => request('/api/v1/cism/batch'),
  clearCismBatch: () => request('/api/v1/cism/batch/clear', { method: 'POST' }),

  // P21
  p21Payloads: () => request('/api/v1/p21/payloads'),
  p21Preflight: (body) => request('/api/v1/p21/payload/batch/preflight', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  p21Batch: (body) => request('/api/v1/p21/payload/batch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  p21BatchDownload: () => request('/api/v1/p21/payload/batch/download'),
  p21PayloadDownload: (id) => request(`/api/v1/p21/payload/${id}/download`),
  p21Submit: (id, body) => request(`/api/v1/p21/submit/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),

  // Outbound
  outboundQueue: () => request('/api/v1/outbound/queue'),
  outboundPrepare: (id) => request(`/api/v1/outbound/prepare/${id}`, { method: 'POST' }),
  outboundSend: (id) => request(`/api/v1/outbound/send/${id}`, { method: 'POST' }),
  outboundPayload: (id) => request(`/api/v1/outbound/payload/${id}`),

  // Invoices
  invoices: () => request('/api/v1/invoices'),
  invoiceDemo: (body) => request('/api/v1/invoices/demo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  invoiceBuild: (id, format) => request(`/api/v1/invoices/${id}/build-${format}`, { method: 'POST' }),

  // UI config
  uiConfig: () => request('/api/v1/ui/config')
};
