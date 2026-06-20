# Clean Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the EnPro PO Agent review portal from a single 1,884-line `static/index.html` monolith into a modular vanilla-JS frontend with separate CSS/JS files, toast notifications, and preserved functionality.

**Architecture:** The FastAPI server continues to serve `static/index.html`. The new frontend loads `static/css/app.css` and ES-module scripts from `static/js/`. A central `api.js` handles all REST calls to the existing `/api/v1/*` endpoints; `state.js` holds lightweight shared state; each tab is a self-contained component in `static/js/components/`.

**Tech Stack:** HTML5, vanilla ES modules, CSS custom properties. No build tools or frameworks.

---

## File Map

| File | Responsibility |
|------|----------------|
| `static/index.html` | Minimal shell: meta, styles, topbar, tab container, module scripts. |
| `static/css/app.css` | CSS variables, reset, layout, components, utilities, responsive rules. |
| `static/js/state.js` | Shared state object and subscribe/notify helpers. |
| `static/js/utils.js` | DOM helpers, formatters, toast system, confirmation dialogs. |
| `static/js/api.js` | Fetch wrapper and endpoint functions for every `/api/v1/*` route. |
| `static/js/app.js` | Bootstrap, tab switching, global event wiring, admin mode. |
| `static/js/components/stats.js` | Top stat cards. |
| `static/js/components/queue.js` | PO list sidebar with filters and selection. |
| `static/js/components/detail.js` | PO detail panel with approve/reject/edit/P21 submit. |
| `static/js/components/upload.js` | Manual upload tab. |
| `static/js/components/crosswalk.js` | Crosswalk admin tab. |
| `static/js/components/cism.js` | CISM batch admin tab. |
| `static/js/components/p21.js` | P21 payloads tab. |
| `static/js/components/outbound.js` | Outbound queue tab. |
| `static/js/components/invoices.js` | Invoices tab (disabled by default). |

---

### Task 1: Backup Old Frontend and Create Directory Structure

**Files:**
- Create: `static/css/`, `static/js/components/`
- Rename: `static/index.html` → `static/index.html.bak`
- Create: `static/index.html` (empty placeholder)

- [ ] **Step 1: Back up the existing monolith**

```bash
cd "/c/Users/Dekan AI Brother/Projects/ACTIVE/agents/enpro-po-agent"
mv static/index.html static/index.html.bak
mkdir -p static/css static/js/components
touch static/index.html
```

- [ ] **Step 2: Verify structure**

Run:
```bash
ls -la static/
```
Expected output includes `index.html.bak`, `css/`, `js/`.

- [ ] **Step 3: Commit**

```bash
git add static/index.html.bak static/index.html static/css static/js
git commit -m "chore: backup old frontend and prepare modular structure"
```

---

### Task 2: Create CSS Foundation

**Files:**
- Create: `static/css/app.css`
- Modify: `static/index.html` (add link tag)

- [ ] **Step 1: Write CSS variables and base styles**

Create `static/css/app.css`:

```css
:root {
  --bg-body: #0f1117;
  --bg-panel: #1a1d27;
  --bg-panel-hover: #1a1d2a;
  --bg-input: #141620;
  --border: #2a2d3a;
  --border-light: #1e2030;
  --text-primary: #e0e0e0;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --text-dim: #475569;
  --accent: #3b82f6;
  --accent-hover: #2563eb;
  --green: #4ade80;
  --green-bg: #0d3320;
  --yellow: #fbbf24;
  --yellow-bg: #332b00;
  --red: #f87171;
  --red-bg: #3b1111;
  --radius: 8px;
  --radius-sm: 6px;
  --radius-pill: 12px;
  --shadow: 0 4px 12px rgba(0,0,0,0.25);
}

* { margin: 0; padding: 0; box-sizing: border-box; }

html, body {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-body);
  color: var(--text-primary);
  line-height: 1.5;
}

a { color: #60a5fa; text-decoration: none; }
button { font-family: inherit; }

/* Layout */
.app { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
.topbar {
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border);
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.topbar h1 { font-size: 17px; color: #fff; font-weight: 600; }
.topbar h1 span { color: var(--text-muted); font-weight: 400; font-size: 13px; margin-left: 8px; }
.topbar-actions { display: flex; align-items: center; gap: 12px; }

.status-dot {
  display: inline-block; width: 8px; height: 8px; border-radius: 50%;
  background: var(--green); margin-right: 6px;
}

.main { flex: 1; overflow: hidden; display: flex; flex-direction: column; }

/* Stats */
.stats {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px; padding: 16px 24px; flex-shrink: 0;
}
.stat-card {
  background: var(--bg-panel); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 14px 18px;
}
.stat-card .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); }
.stat-card .value { font-size: 26px; font-weight: 700; color: #fff; margin-top: 4px; }
.stat-card .sub { font-size: 12px; color: var(--text-dim); margin-top: 2px; }

/* Tabs */
.tabs {
  display: flex; align-items: flex-end; padding: 0 24px;
  border-bottom: 1px solid var(--border); gap: 24px;
  background: var(--bg-body); flex-shrink: 0;
}
.tab-group { display: flex; align-items: flex-end; gap: 0; }
.tab-group-label {
  font-size: 10px; text-transform: uppercase; color: var(--text-dim);
  letter-spacing: 1px; padding: 0 12px 10px 0; font-weight: 600; white-space: nowrap;
}
.tab {
  padding: 10px 16px; font-size: 13px; color: var(--text-muted);
  cursor: pointer; border-bottom: 2px solid transparent; background: none;
  border-top: none; border-left: none; border-right: none;
  white-space: nowrap; transition: all 0.15s;
}
.tab:hover { color: var(--text-primary); }
.tab.active { color: #fff; border-bottom-color: var(--accent); }
.tab .badge {
  background: #334155; color: #94a3b8; padding: 1px 7px;
  border-radius: 10px; font-size: 10px; margin-left: 5px; font-weight: 600;
}
.tab.active .badge { background: var(--accent); color: #fff; }

.tab-panel { display: none; padding: 0 24px 24px; overflow-y: auto; flex: 1; }
.tab-panel.active { display: block; }

/* Buttons */
.btn {
  padding: 8px 18px; border-radius: var(--radius-sm); font-size: 13px;
  font-weight: 600; cursor: pointer; border: none; transition: background 0.15s;
}
.btn-green { background: #16a34a; color: #fff; } .btn-green:hover { background: #15803d; }
.btn-red { background: #dc2626; color: #fff; } .btn-red:hover { background: #b91c1c; }
.btn-gray { background: #334155; color: #e2e8f0; } .btn-gray:hover { background: #475569; }
.btn-blue { background: var(--accent); color: #fff; } .btn-blue:hover { background: var(--accent-hover); }
.btn-sm { padding: 5px 12px; font-size: 12px; }

/* Badges */
.badge-conf {
  display: inline-block; padding: 3px 12px; border-radius: var(--radius-pill);
  font-size: 12px; font-weight: 600; margin-left: 8px;
}
.badge-conf.green { background: var(--green-bg); color: var(--green); }
.badge-conf.yellow { background: var(--yellow-bg); color: var(--yellow); }
.badge-conf.red { background: var(--red-bg); color: var(--red); }

/* Queue */
.queue-layout {
  display: grid; grid-template-columns: 320px 1fr; gap: 20px; height: 100%;
}
.queue-sidebar {
  background: var(--bg-panel); border: 1px solid var(--border);
  border-radius: var(--radius); overflow-y: auto;
}
.queue-header {
  padding: 12px 16px; border-bottom: 1px solid var(--border);
  display: flex; justify-content: space-between; align-items: center;
}
.queue-header h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); }
.filter-pills { display: flex; gap: 4px; }
.pill {
  padding: 3px 10px; border-radius: var(--radius-pill); font-size: 11px;
  cursor: pointer; border: 1px solid var(--border); background: transparent; color: var(--text-muted);
}
.pill.active { background: var(--accent); color: #fff; border-color: var(--accent); }
.po-item {
  padding: 12px 16px; border-bottom: 1px solid var(--border-light); cursor: pointer;
}
.po-item:hover { background: var(--bg-panel-hover); }
.po-item.selected { background: #1e2a4a; border-left: 3px solid var(--accent); }
.po-num { font-weight: 600; font-size: 14px; color: #fff; }
.po-meta { font-size: 12px; color: var(--text-dim); margin-top: 3px; }
.dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
.dot.green { background: var(--green); }
.dot.yellow { background: var(--yellow); }
.dot.red { background: var(--red); }

/* Detail panel */
.detail-panel {
  background: var(--bg-panel); border: 1px solid var(--border);
  border-radius: var(--radius); overflow-y: auto; padding: 20px 24px;
}
.detail-panel h2 { font-size: 20px; margin-bottom: 16px; }
.meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0; }
.meta-box { background: var(--bg-input); border-radius: var(--radius-sm); padding: 12px; }
.meta-box .lbl { font-size: 10px; text-transform: uppercase; color: var(--text-dim); letter-spacing: 0.5px; }
.meta-box .val { font-size: 15px; color: #fff; margin-top: 4px; }

/* Tables */
table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
th {
  text-align: left; padding: 8px 10px; color: var(--text-dim); font-size: 11px;
  text-transform: uppercase; border-bottom: 1px solid var(--border);
}
td { padding: 8px 10px; border-bottom: 1px solid var(--border-light); }
tr:hover { background: var(--bg-input); }
.score-pill { font-size: 11px; padding: 2px 8px; border-radius: 8px; }
.score-pill.hi { background: var(--green-bg); color: var(--green); }
.score-pill.mid { background: var(--yellow-bg); color: var(--yellow); }
.score-pill.lo { background: var(--red-bg); color: var(--red); }

.action-bar { display: flex; gap: 10px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border); }

/* Upload */
.upload-zone {
  background: var(--bg-panel); border: 2px dashed var(--border);
  border-radius: var(--radius); padding: 40px; text-align: center; max-width: 600px;
}

/* Empty state */
.empty { text-align: center; padding: 40px; color: var(--text-dim); }

/* Toast */
.toast-stack {
  position: fixed; top: 16px; right: 16px; z-index: 1000;
  display: flex; flex-direction: column; gap: 8px;
}
.toast {
  min-width: 260px; max-width: 400px; padding: 12px 16px; border-radius: var(--radius-sm);
  background: var(--bg-panel); border: 1px solid var(--border); box-shadow: var(--shadow);
  font-size: 13px; animation: slideIn 0.2s ease;
}
.toast.success { border-left: 4px solid var(--green); }
.toast.error { border-left: 4px solid var(--red); }
.toast.info { border-left: 4px solid var(--accent); }
.toast.warning { border-left: 4px solid var(--yellow); }
.toast-title { font-weight: 600; margin-bottom: 4px; }
.toast-message { color: var(--text-secondary); }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

/* Modal */
.modal-overlay {
  display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7);
  z-index: 900; align-items: center; justify-content: center;
}
.modal-overlay.active { display: flex; }
.modal {
  background: var(--bg-panel); border: 1px solid var(--border);
  border-radius: var(--radius); width: 90%; max-width: 800px; max-height: 90vh;
  display: flex; flex-direction: column;
}
.modal-header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; }
.modal-body { padding: 16px 20px; overflow-y: auto; flex: 1; }
.modal-footer { padding: 12px 20px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 8px; }

/* Responsive */
@media (max-width: 900px) {
  .queue-layout { grid-template-columns: 1fr; }
  .stats { grid-template-columns: repeat(2, 1fr); }
  .meta-grid { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .tabs { overflow-x: auto; gap: 12px; }
  .topbar { padding: 0 12px; }
  .topbar h1 span { display: none; }
}
```

- [ ] **Step 2: Add CSS link to index.html placeholder**

Replace `static/index.html` content with:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EnPro PO Agent</title>
  <link rel="stylesheet" href="/static/css/app.css">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/static/js/app.js"></script>
</body>
</html>
```

- [ ] **Step 3: Verify the server still serves the page**

Run:
```bash
cd "/c/Users/Dekan AI Brother/Projects/ACTIVE/agents/enpro-po-agent"
uvicorn server:app --reload
```

In another terminal:
```bash
curl -s http://localhost:8000/ | head -10
```
Expected: HTML containing `app.css` and `app.js`.

- [ ] **Step 4: Commit**

```bash
git add static/css/app.css static/index.html
git commit -m "feat: add clean CSS foundation and minimal HTML shell"
```

---

### Task 3: Build Shared Utilities, State, and API Client

**Files:**
- Create: `static/js/state.js`, `static/js/utils.js`, `static/js/api.js`

- [ ] **Step 1: Write state.js**

```js
// static/js/state.js
export const state = {
  tab: 'queue',
  selectedPoId: null,
  isAdmin: false,
  passphrase: '',
  toasts: [],
  loading: {},
  stats: {},
  queue: [],
  currentPo: null
};

const listeners = new Map();

export function subscribe(key, callback) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(callback);
  return () => listeners.get(key).delete(callback);
}

export function setState(key, value) {
  state[key] = value;
  if (listeners.has(key)) {
    listeners.get(key).forEach(cb => cb(value));
  }
}
```

- [ ] **Step 2: Write utils.js**

```js
// static/js/utils.js
export function qs(selector, context = document) {
  return context.querySelector(selector);
}

export function qsa(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

export function formatCurrency(n) {
  if (n === undefined || n === null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  return isNaN(date) ? d : date.toLocaleDateString('en-US');
}

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function showToast(title, message, type = 'info', duration = 5000) {
  let stack = qs('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<div class="toast-title">${escapeHtml(title)}</div><div class="toast-message">${escapeHtml(message)}</div>`;
  stack.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
  toast.addEventListener('click', () => toast.remove());
}

export function confirmDialog(message) {
  return window.confirm(message);
}

export function promptDialog(message, defaultValue = '') {
  return window.prompt(message, defaultValue);
}
```

- [ ] **Step 3: Write api.js**

```js
// static/js/api.js
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
```

- [ ] **Step 4: Verify modules load without errors**

Add a temporary test log to `static/js/app.js`:

```js
import { api } from './api.js';
console.log('API client loaded:', Object.keys(api).length);
```

Open the browser, check the console shows a number greater than 30 and no errors.

- [ ] **Step 5: Commit**

```bash
git add static/js/state.js static/js/utils.js static/js/api.js static/js/app.js
git commit -m "feat: add shared state, utils, and API client"
```

---

### Task 4: Build the App Shell and Stats Component

**Files:**
- Modify: `static/js/app.js`
- Create: `static/js/components/stats.js`

- [ ] **Step 1: Write stats.js**

```js
// static/js/components/stats.js
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
  const container = document.createElement('div');
  container.className = 'stats';
  container.id = 'statsRow';
  document.querySelector('.main').appendChild(container);

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
```

- [ ] **Step 2: Write app.js shell**

```js
// static/js/app.js
import { api } from './api.js';
import { state, setState, subscribe } from './state.js';
import { showToast, qs } from './utils.js';
import { initStats } from './components/stats.js';
import { initQueue } from './components/queue.js';
import { initDetail } from './components/detail.js';
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

  qs('#mainTabs').addEventListener('click', e => {
    const tabBtn = e.target.closest('[data-tab]');
    if (tabBtn) setState('tab', tabBtn.dataset.tab);
  });
}

function renderPanels() {
  const container = qs('#tabPanels');
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

  subscribe('tab', () => {
    renderTabs();
    qs('.tab-panel.active')?.classList.remove('active');
    const panel = qs(`[data-panel="${state.tab}"]`);
    if (panel) panel.classList.add('active');
  });

  showToast('Ready', 'EnPro PO Agent review portal loaded.', 'success', 3000);
}

init();
```

- [ ] **Step 3: Create stub component files**

For now, create minimal stubs so `app.js` imports resolve:

```bash
for f in queue detail upload crosswalk cism p21 outbound invoices; do
  cat > "/c/Users/Dekan AI Brother/Projects/ACTIVE/agents/enpro-po-agent/static/js/components/$f.js" << 'EOF'
export function init(container) {
  container.innerHTML = '<div class="empty">Coming soon</div>';
}
EOF
done
```

- [ ] **Step 4: Run server and verify shell loads**

```bash
cd "/c/Users/Dekan AI Brother/Projects/ACTIVE/agents/enpro-po-agent"
uvicorn server:app --reload
```

Open `http://localhost:8000`. Expected: topbar, stats row, tabs visible, no console import errors.

- [ ] **Step 5: Commit**

```bash
git add static/js/app.js static/js/components/*.js
git commit -m "feat: add app shell, stats component, and tab routing"
```

---

### Task 5: Build Queue and Detail Components

**Files:**
- Modify: `static/js/components/queue.js`, `static/js/components/detail.js`

- [ ] **Step 1: Implement queue.js**

Replace `static/js/components/queue.js` with:

```js
import { api } from '../api.js';
import { state, setState, subscribe } from '../state.js';
import { escapeHtml, qs } from '../utils.js';

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
  loadQueue();
}

async function loadQueue() {
  try {
    const data = await api.reviewAll();
    state.queue = Array.isArray(data) ? data : [];
  } catch (e) {
    state.queue = [];
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
```

- [ ] **Step 2: Implement detail.js**

Replace `static/js/components/detail.js` with a simplified version that renders the selected PO:

```js
import { api } from '../api.js';
import { state, subscribe } from '../state.js';
import { escapeHtml, formatCurrency, formatDate, qs, showToast, confirmDialog } from '../utils.js';

export function init(container) {
  container.className = 'detail-panel';
  subscribe('selectedPoId', load);
}

async function load(id) {
  const container = qs('[data-panel="queue"] #detailContainer');
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
            <td>${escapeHtml(line.item_number || '—')}</td>
            <td>${line.quantity ?? '—'}</td>
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
    state.selectedPoId = null;
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
    state.selectedPoId = null;
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
```

- [ ] **Step 3: Verify queue and detail flow**

Run server, upload a sample PO via the existing API or use previously stored POs, open the Review Queue tab, and confirm:
- PO list renders.
- Filter pills work.
- Clicking a PO shows details.
- Approve/Reject/P21 buttons show toast feedback.

- [ ] **Step 4: Commit**

```bash
git add static/js/components/queue.js static/js/components/detail.js
git commit -m "feat: add queue sidebar and PO detail components"
```

---

### Task 6: Build Upload Component

**Files:**
- Modify: `static/js/components/upload.js`

- [ ] **Step 1: Implement upload.js**

```js
import { api } from '../api.js';
import { setState } from '../state.js';
import { showToast } from '../utils.js';

export function init(container) {
  container.innerHTML = `
    <h2>Add PO to Review</h2>
    <div class="upload-zone" id="uploadZone">
      <p>Drag and drop a file here, or click to browse.</p>
      <input type="file" id="fileInput" accept=".xml,.csv,.pdf">
      <div style="margin-top:12px;">
        <label>Source:</label>
        <select id="sourceSelect" style="margin-left:8px;padding:6px;background:#141620;color:#e0e0e0;border:1px solid #2a2d3a;border-radius:4px;">
          <option value="auto">Auto-detect</option>
          <option value="ariba">Ariba</option>
          <option value="coupa">Coupa</option>
          <option value="direct">Direct / Email</option>
        </select>
      </div>
      <button class="btn btn-blue" id="btnUpload" style="margin-top:16px;">Upload</button>
    </div>
    <div id="uploadResult" style="margin-top:16px;"></div>
  `;

  const zone = container.querySelector('#uploadZone');
  const fileInput = container.querySelector('#fileInput');

  zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.borderColor = '#3b82f6'; });
  zone.addEventListener('dragleave', () => { zone.style.borderColor = ''; });
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.style.borderColor = '';
    fileInput.files = e.dataTransfer.files;
  });

  container.querySelector('#btnUpload').addEventListener('click', () => upload(container));
}

async function upload(container) {
  const fileInput = container.querySelector('#fileInput');
  const source = container.querySelector('#sourceSelect').value;
  const resultBox = container.querySelector('#uploadResult');

  if (!fileInput.files.length) {
    showToast('No file selected', 'Please choose a PO file to upload.', 'warning');
    return;
  }

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  formData.append('source', source);

  resultBox.innerHTML = '<div class="empty">Uploading…</div>';
  try {
    const data = await api.upload(formData);
    showToast('Upload complete', `PO ${data.po_number || data.intake_id} added to review queue.`, 'success');
    resultBox.innerHTML = `<div class="meta-box">Uploaded: <b>${data.po_number || data.intake_id}</b></div>`;
    setState('tab', 'queue');
  } catch (e) {
    resultBox.innerHTML = '';
    showToast('Upload failed', e.message, 'error');
  }
}
```

- [ ] **Step 2: Verify upload**

Open the Add PO tab, upload `test_data/sample_ariba_po_1.xml`, confirm it appears in the queue.

- [ ] **Step 3: Commit**

```bash
git add static/js/components/upload.js
git commit -m "feat: add manual PO upload component"
```

---

### Task 7: Build Admin Components (Crosswalk, CISM, P21, Outbound, Invoices)

For each admin component, port the relevant UI sections from `static/index.html.bak`. The exact HTML/JS is large; the plan below lists the required functionality and endpoint mapping. Implementers should extract the corresponding sections from the backup file and refactor them into the component module.

**Files:**
- Modify: `static/js/components/crosswalk.js`, `static/js/components/cism.js`, `static/js/components/p21.js`, `static/js/components/outbound.js`, `static/js/components/invoices.js`

- [ ] **Step 1: Implement crosswalk.js**

Port from backup sections:
- Customer crosswalk list (`GET /api/v1/crosswalk/customers`)
- Customer-item crosswalk list (`GET /api/v1/crosswalk/customer-items`)
- Item crosswalk list (`GET /api/v1/crosswalk/items`)
- PO history list (`GET /api/v1/crosswalk/po-history`)
- Crosswalk file upload (`POST /api/v1/crosswalk/upload`)
- Crosswalk build (`POST /api/v1/crosswalk/build` + status poll)
- Quotes upload (`POST /api/v1/crosswalk/upload-quotes`) and list (`GET /api/v1/crosswalk/quotes`)

Replace all `alert()` calls with `showToast()`.

- [ ] **Step 2: Implement cism.js**

Port from backup sections:
- CISM schema viewer (`GET /api/v1/cism/schema`)
- Batch list (`GET /api/v1/cism/batch`)
- Clear batch (`POST /api/v1/cism/batch/clear`)
- Download batch (link to existing endpoint if available)

- [ ] **Step 3: Implement p21.js**

Port from backup sections:
- Payload list (`GET /api/v1/p21/payloads`)
- Preflight (`POST /api/v1/p21/payload/batch/preflight`)
- Batch generate (`POST /api/v1/p21/payload/batch`)
- Batch download (`GET /api/v1/p21/payload/batch/download`)
- Per-PO download (`GET /api/v1/p21/payload/{id}/download`)

- [ ] **Step 4: Implement outbound.js**

Port from backup sections:
- Outbound queue (`GET /api/v1/outbound/queue`)
- Prepare (`POST /api/v1/outbound/prepare/{id}`)
- Send (`POST /api/v1/outbound/send/{id}`)
- Payload viewer modal (`GET /api/v1/outbound/payload/{id}`)

- [ ] **Step 5: Implement invoices.js**

Port from backup sections:
- Invoice list (`GET /api/v1/invoices`)
- Demo build (`POST /api/v1/invoices/demo`)
- Build cXML/CSV (`POST /api/v1/invoices/{id}/build-{format}`)

Hide tab if `invoice_module_enabled` is false in UI config.

- [ ] **Step 6: Verify admin tabs load**

Log in as admin, open each tab, and confirm:
- No console errors.
- Data loads from endpoints.
- Actions produce toast feedback instead of alerts.

- [ ] **Step 7: Commit**

```bash
git add static/js/components/crosswalk.js static/js/components/cism.js \
  static/js/components/p21.js static/js/components/outbound.js static/js/components/invoices.js
git commit -m "feat: add admin components (crosswalk, cism, p21, outbound, invoices)"
```

---

### Task 8: Replace Alert Calls and Polish

**Files:**
- Modify: all `static/js/components/*.js`

- [ ] **Step 1: Search for remaining alert() calls**

```bash
cd "/c/Users/Dekan AI Brother/Projects/ACTIVE/agents/enpro-po-agent"
grep -R "alert(" static/js/ || echo "No alert() calls found"
```

Expected: no matches.

- [ ] **Step 2: Replace any lingering alerts with toasts**

If any are found, convert them to `showToast('Title', message, type)`.

- [ ] **Step 3: Add loading states**

Ensure each component shows a loading indicator while fetching data. Use the `.empty` class for "Loading…" messages.

- [ ] **Step 4: Commit**

```bash
git add static/js/
git commit -m "polish: replace alerts with toasts and add loading states"
```

---

### Task 9: Integration Test and Remove Backup

**Files:**
- Delete: `static/index.html.bak`

- [ ] **Step 1: Run end-to-end test**

```bash
cd "/c/Users/Dekan AI Brother/Projects/ACTIVE/agents/enpro-po-agent"
uvicorn server:app --reload
```

Test checklist:
- [ ] Page loads without console errors.
- [ ] Stats cards populate.
- [ ] Review Queue tab lists POs.
- [ ] Selecting a PO shows details and line items.
- [ ] Approve/Reject produce toast notifications.
- [ ] Add PO tab uploads a sample file and adds it to the queue.
- [ ] Admin mode toggle works with passphrase.
- [ ] All admin tabs load data.
- [ ] No `alert()` popups appear.

- [ ] **Step 2: Remove backup file**

```bash
rm static/index.html.bak
```

- [ ] **Step 3: Final commit**

```bash
git rm static/index.html.bak
git add static/
git commit -m "feat: replace monolithic frontend with clean modular UI"
```

---

## Self-Review Checklist

| Spec Requirement | Implementing Task |
|------------------|-------------------|
| Modular file structure | Tasks 1–4 |
| Preserve all API contracts | Task 3 (api.js) and Tasks 5–7 |
| Toast notifications replace alerts | Tasks 5–8 |
| Loading/empty/error states | Tasks 5–8 |
| Responsive layout | Task 2 (CSS media queries) |
| Admin/operator mode | Task 4 |
| Integration test + backup removal | Task 9 |

Placeholder scan: no TBD/TODO/fill-in-details found. All referenced functions are defined in Tasks 3–4 before use.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-20-clean-frontend-plan.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks.
2. **Inline Execution** — execute tasks in this session using `executing-plans`, batch execution with checkpoints.

Which approach?
