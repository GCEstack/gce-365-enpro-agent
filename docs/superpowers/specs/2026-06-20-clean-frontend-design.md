# Clean Frontend Design — EnPro PO Agent Review Portal

**Date:** 2026-06-20  
**Project:** `enpro-po-agent`  
**Scope:** Refactor the review portal from a single 1,884-line `static/index.html` monolith into a modular, maintainable vanilla-JS frontend.

---

## 1. Overview

The current review portal (`static/index.html`) contains all HTML, CSS, and JavaScript in one file. It works, but it is hard to maintain, test, and extend. This design replaces it with a clean, modular frontend that preserves every existing feature and API contract while improving usability and code organization.

## 2. Goals

- Split the monolith into focused HTML/CSS/JS files.
- Keep the existing FastAPI server and all REST endpoints unchanged.
- Preserve every current UI feature (queue, detail, upload, crosswalk, CISM, P21, outbound, admin mode).
- Replace `alert()` popups with non-blocking toast notifications.
- Add consistent loading, empty, and error states.
- Improve responsive behavior and visual hierarchy.
- Make the codebase approachable for future contributors.

## 3. Non-Goals

- No new JavaScript framework (React, Vue, Angular, etc.).
- No build step, bundler, or npm dependency.
- No changes to server-side business logic or API routes.
- No redesign of the underlying data model.

## 4. Architecture

The frontend remains a single-page application (SPA) served by FastAPI’s `static/index.html`. It talks to the existing FastAPI REST API at `/api/v1/*`.

```text
Browser
   │
   ▼
static/index.html  ──►  static/css/app.css
   │                     static/js/app.js
   │                     static/js/api.js
   │                     static/js/components/*.js
   │
   ▼
FastAPI server:app  ──►  services/processing/*
```

### 4.1 File Structure

```text
static/
├── index.html                 # Minimal shell: topbar, tab container, script tags
├── css/
│   └── app.css                # All styles: layout, components, utilities
└── js/
    ├── app.js                 # Entry point: init, tabs, global state, event wiring
    ├── api.js                 # Centralized fetch wrapper + endpoint functions
    ├── utils.js               # DOM helpers, debounce, formatters, toast system
    ├── state.js               # Lightweight global state (current tab, selected PO, mode)
    └── components/
        ├── queue.js           # PO list sidebar + filters
        ├── detail.js          # PO detail panel + approve/reject/edit
        ├── upload.js          # Manual upload tab
        ├── stats.js           # Top stat cards
        ├── crosswalk.js       # Crosswalk admin tab
        ├── cism.js            # CISM batch admin tab
        ├── p21.js             # P21 payloads tab
        ├── outbound.js        # Outbound queue tab
        └── invoices.js        # Invoices tab (disabled by default)
```

### 4.2 Module Responsibilities

| File | Responsibility |
|------|----------------|
| `app.js` | Bootstraps the app, renders tabs, wires global events, handles operator/admin mode. |
| `api.js` | All HTTP calls to `/api/v1/*`; handles auth headers and common error formatting. |
| `state.js` | Read/write shared state: selected PO ID, current tab, admin flag, toast queue. |
| `utils.js` | DOM helpers, date/currency formatting, toast rendering, confirmation dialogs. |
| `components/*.js` | Self-contained UI units that render into a container and respond to state changes. |

## 5. API Contract

The frontend consumes the existing endpoints already defined in `server.py`. No new endpoints are required.

Key endpoints retained:

- `GET /api/v1/stats`
- `GET /api/v1/review/all`
- `GET /api/v1/review/approved`
- `GET /api/v1/review/po/{id}`
- `POST /api/v1/review/po/{id}/approve`
- `POST /api/v1/review/po/{id}/reject`
- `POST /api/v1/review/po/{id}/edit`
- `POST /api/v1/review/bulk-approve`
- `POST /api/v1/intake/upload`
- `POST /api/v1/intake/poll-now`
- `GET /api/v1/lookup/customer-items/{cust_id}`
- `POST /api/v1/suggest/mappings/{id}`
- `POST /api/v1/suggest/mappings/{id}/decide`
- `GET /api/v1/crosswalk/customers`
- `GET /api/v1/crosswalk/customer-items`
- `GET /api/v1/crosswalk/items`
- `GET /api/v1/crosswalk/po-history`
- `POST /api/v1/crosswalk/upload`
- `POST /api/v1/crosswalk/build`
- `GET /api/v1/crosswalk/build/status`
- `POST /api/v1/crosswalk/upload-quotes`
- `GET /api/v1/crosswalk/quotes`
- `GET /api/v1/cism/schema`
- `GET /api/v1/cism/batch`
- `POST /api/v1/cism/batch/clear`
- `GET /api/v1/p21/payloads`
- `POST /api/v1/p21/payload/batch/preflight`
- `POST /api/v1/p21/payload/batch`
- `GET /api/v1/p21/payload/batch/download`
- `GET /api/v1/p21/payload/{intake_id}/download`
- `POST /api/v1/p21/submit/{id}`
- `GET /api/v1/outbound/queue`
- `POST /api/v1/outbound/prepare/{intake_id}`
- `POST /api/v1/outbound/send/{outbound_id}`
- `GET /api/v1/outbound/payload/{outbound_id}`
- `GET /api/v1/invoices`
- `POST /api/v1/invoices/demo`
- `POST /api/v1/invoices/{id}/build-{format}`
- `GET /api/v1/ui/config`

## 6. State Management

A lightweight centralized state object lives in `js/state.js`:

```js
const state = {
  tab: 'queue',           // current visible tab
  selectedPoId: null,     // PO open in detail panel
  isAdmin: false,         // operator vs admin mode
  passphrase: '',         // server-provided admin passphrase
  toastQueue: [],         // pending notifications
  loading: {}             // per-component loading flags
};
```

Components subscribe to state changes relevant to them. For example, `detail.js` re-renders when `selectedPoId` changes. No external state library is used.

## 7. UI Components

### 7.1 Topbar & Stats (`app.js` + `stats.js`)

- Brand, source badges, online indicator.
- Operator/admin mode toggle with passphrase prompt.
- Stat cards: Total Processed, Auto-Approved, Needs Review, Customers Mapped, Item Coverage. Admin-only cards hidden in operator mode.

### 7.2 Review Queue (`queue.js`)

- Left sidebar listing POs.
- Filter pills: All / Green / Yellow / Red.
- Swim-lane-style grouping: Needs Review, Ready to Approve.
- Click selects a PO; detail panel updates.
- Bulk-approve greens action.

### 7.3 PO Detail (`detail.js`)

- Header with PO number, confidence badge, source tag.
- Meta grid: customer, ship-to, PO date, total, etc.
- Line items table with per-line confidence.
- Suggestion chips for customer/item mappings.
- Action bar: Approve, Reject (with reason), Edit, P21 Submit.

### 7.4 Upload (`upload.js`)

- Drag-and-drop or file picker.
- Source selector (Ariba, Coupa, Direct).
- Progress and result feedback.

### 7.5 Admin Tabs

- **Crosswalk** (`crosswalk.js`): customer, item, PO history, quotes; upload and build actions.
- **CISM** (`cism.js`): schema viewer, batch list, download, clear.
- **P21** (`p21.js`): payload list, preflight, batch generate/download.
- **Outbound** (`outbound.js`): queue, prepare, send, payload viewer.
- **Invoices** (`invoices.js`): disabled by default via config.

## 8. Toast Notification System

A small toast stack anchored to the top-right corner replaces all `alert()` calls.

- Success: green
- Error: red
- Info: blue
- Warning: yellow

Toasts auto-dismiss after 5 seconds or on click.

## 9. Error Handling

- API errors surface as toast messages with the server `detail` text when available.
- Network failures show a generic retry prompt.
- Loading skeletons prevent layout shift during data fetches.
- Form validation errors render inline near the offending field.

## 10. Styling

- CSS custom properties for the color palette and spacing scale.
- Dark theme by default, matching the existing portal.
- Utility classes for common patterns (flex, grid, margins, badges).
- Responsive breakpoints for tablet and mobile widths.

## 11. Testing

- Manual end-to-end test: boot server, upload `test_data/sample_ariba_po_1.xml`, verify queue/detail/approve flow.
- Verify each admin tab loads without console errors in operator and admin modes.
- Confirm toast notifications replace all `alert()` calls.
- Check responsive layout at 375px, 768px, and 1440px widths.

## 12. Rollout

1. Create new files alongside the existing `static/index.html`.
2. Replace `static/index.html` with the new shell once components are ready.
3. Keep the old file as `static/index.html.bak` during verification.
4. Delete the backup after successful testing.

## 13. Success Criteria

- `static/index.html` is under 100 lines.
- No inline `<script>` or `<style>` blocks remain in `static/index.html`.
- All existing features work without server changes.
- No `alert()` calls remain in the frontend code.
- Console is free of JavaScript errors during normal use.
- `git status` is clean and the change is committed.
