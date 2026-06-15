# EnPro PO Agent — Honest Handoff (June 1, 2026)

**Reference:** `EnPro_PO_Agent_UI_Assessment.pdf` (June 1, 2026)  
**Code:** GitHub master branch, deployed to Render (last deploy May 17, 2026)  
**Repo:** https://github.com/simplebalance89-ai/enpro-po-agent

---

## ✅ What's Actually Working (Deployed & Live)

### Core Pipeline
| Feature | Status | Notes |
|---------|--------|-------|
| Email intake (Graph API) | ✅ Coded | Needs Azure AD credentials from IT |
| PDF parsing (Doc Intel) | ✅ Working | Needs DOC_INTEL_ENDPOINT + KEY |
| cXML parsing | ✅ Working | Ariba/Coupa native |
| CSV parsing | ✅ Working | Direct column mapping |
| Customer crosswalk | ✅ Working | 4,880 entries, 4-stage match |
| Item crosswalk | ✅ Working | 22,675 mappings, 4-stage match |
| Confidence scoring | ✅ Working | Green/yellow/red badges |
| Approve → CISM | ✅ Working | Generates 75-col header + 40-col line CSVs |
| CISM batch accumulation | ✅ Working | Accumulates multiple POs |
| Reject with reason | ✅ Working | |
| Edit PO + re-score | ✅ Working | Manual ID entry only |
| Bulk Approve Greens | ✅ Working | Single button approves all greens |
| Auto-learn | ✅ Working | Writes back to crosswalk CSVs |
| P21 Payload export | ✅ Working | Single + batch JSON download |
| Test Drive (`/test-drive`) | ✅ Working | Drag PDF → instant preview |
| Mic Drop (`/micdrop`) | ✅ Working | Payload proof animation |
| Invoice module | ⚠️ Built, disabled | Needs `ENABLE_INVOICE_SYNC=true` + Coupa key |

### UI Features (Actually Present)
| Feature | Status | Notes |
|---------|--------|-------|
| Mode toggle (Operator/Admin) | ✅ Present | Passphrase gate (`enpro-admin` hardcoded) |
| Source badges (Ariba/Coupa/Email) | ✅ Present | Blue/purple/green pills on POs |
| Keyboard shortcuts | ✅ Present | Enter = Approve, Esc = Cancel/Back |
| Bulk Approve button | ✅ Present | Left sidebar |
| Admin-only tabs | ✅ Present | Crosswalk, CISM Schema, Pipeline gated |
| CISM Batch tab | ✅ Present | Visual pipeline + download buttons |
| P21 Payloads tab | ✅ Present | Checkbox batch + ZIP download |
| Processed tab | ✅ Present | Full history + per-PO CISM links |
| Invoices tab | ⚠️ Grayed out | Says "Coming Soon" |

---

## ❌ What's NOT Working / Missing (Per UI Assessment)

### P0 — Fix What's Broken
| # | Issue | Status | Risk |
|---|-------|--------|------|
| 1 | **CISM batch schema mismatch** | ⚠️ PARTIAL | Batch writes 27 cols, generator writes 75. May fail P21 import. |
| 2 | **Required Date blank in batch** | ⚠️ PARTIAL | Hardcoded empty string in some paths |
| 3 | **Taker = filesystem path** | ❌ NOT FIXED | `cism_output_dir` passed as taker code. P21 will reject. |

### P1 — Make It Usable for Brittany
| # | Feature | Status | Impact |
|---|---------|--------|--------|
| 4 | **Customer search dropdown in Edit PO** | ❌ MISSING | Brittany must manually type customer IDs |
| 5 | **Item search dropdown in Edit PO** | ⚠️ PARTIAL | Shows customer history dropdown, but no global fuzzy search |
| 6 | **Inline crosswalk editing** | ❌ MISSING | Tables are read-only. Brittany edits CSVs by hand. |
| 7 | **Audit trail view** | ❌ MISSING | No log of who approved/rejected what. SQLite table not created. |
| 8 | **Disk usage warning** | ❌ MISSING | `/health` returns disk info but UI doesn't show it. |

### P2 — Make It Production-Ready
| # | Feature | Status | Impact |
|---|---------|--------|--------|
| 9 | **Real auth** | ⚠️ PARTIAL | Passphrase prompt + name entry exists but `enpro-admin` is hardcoded. No audit trail. |
| 10 | **User identity on every action** | ❌ MISSING | No `approved_by` / `rejected_by` on PO records. |
| 11 | **Real outbound send** | ❌ MISSING | Mock only. No live Ariba/Coupa HTTP POST. |
| 12 | **Invoice module enable** | ⚠️ READY | Code built. Just needs `ENABLE_INVOICE_SYNC=true` + Coupa API key. |
| 13 | **P21 connectivity status** | ❌ MISSING | `/health` says "not_configured" but no UI dot. |
| 14 | **Crosswalk freshness indicator** | ❌ MISSING | No "last refreshed" date shown. |

### P3 — Polish
| # | Feature | Status | Impact |
|---|---------|--------|--------|
| 15 | **Toast notifications** | ❌ MISSING | Still uses `alert()` popups (31 alerts in the code). |
| 16 | **Keyboard shortcuts** | ✅ DONE | Enter/Esc work. |
| 17 | **Dark/light mode toggle** | ❌ MISSING | Dark only. |
| 18 | **Mobile responsive** | ❌ MISSING | Desktop-only layout. |

---

## The Honest Summary

**Brittany CAN do today:**
- See POs come in with green/yellow/red confidence
- Click a PO, review line items and match scores
- Edit customer/item mappings (but must type IDs manually)
- Approve → generates CISM CSVs
- Download batch CSVs for P21 import
- Download P21 JSON payloads
- Bulk approve all greens at once

**Brittany CANNOT do today:**
- Search for customers by name when editing a PO
- See who approved what (no audit trail)
- Edit crosswalk tables inline
- See disk usage warnings
- Get toast feedback instead of popup alerts
- See P21 API connection status
- See when crosswalk data was last refreshed

**The code is functional but rough.** The core pipeline works. The UX needs the P1 items (search, audit, disk warning, toast) to be daily-usable without frustration.

---

## What EnPro Needs to Provide

1. **P21 API credentials** (`P21_BASE_URL`, `P21_API_USERNAME`, `P21_API_PASSWORD`) — for live SO creation
2. **Graph API credentials** (`GRAPH_TENANT_ID`, `GRAPH_CLIENT_ID`, `GRAPH_CLIENT_SECRET`) — for email polling
3. **Azure Blob connection string** — for crosswalk sync
4. **Doc Intel endpoint + key** — for PDF parsing
5. **P21 middleware installed** — Transaction API must be reachable

---

## Next Builder Priority Order

1. **P0.3** — Fix taker = filesystem path bug (30 min)
2. **P1.4** — Add customer search dropdown to Edit PO (2 hrs)
3. **P1.5** — Add global item search dropdown (2 hrs)
4. **P1.7** — Add audit trail (SQLite + UI tab) (half day)
5. **P3.15** — Replace `alert()` with toast notifications (2 hrs)
6. **P1.8** — Add disk warning banner (1 hr)
7. **P2.13** — Add P21 connectivity status dot (1 hr)

**Total: ~2 days of focused work** to close P1 and make it Brittany-ready.

---

Built by Peter Wilson | pwnetsuite@outlook.com
