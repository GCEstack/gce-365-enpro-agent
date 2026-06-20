# EnPro PO Agent — Solution Architecture & Provider Handoff

**Date:** June 1, 2026
**Prepared For:** EnPro 365 / New Hosting Provider
**From:** Peter Wilson (pwnetsuite@outlook.com)
**Status:** Proof-of-Concept Complete. Needs migration to EnPro-controlled environment.

---

## Executive Summary

This is a **Purchase Order automation agent** for EnPro Industries. It reads POs from email (Ariba, Coupa, direct PDF), matches them to P21 ERP customer and item data, scores confidence, and generates CISM import files for Sales Order creation.

**The POC works.** It was deployed on Render with a shared Azure tenant. The Azure Document Intelligence key expired (401), and the POC environment is no longer viable. This document provides the architecture and requirements to **rebuild it in EnPro's own Azure / Microsoft 365 environment** with a new hosting provider.

**What the next provider needs to do:**
1. Provision the Azure services listed below in EnPro's tenant
2. Host the application (Azure Container Apps recommended, or any Docker host)
3. Configure environment variables with the new Azure credentials
4. Test end-to-end with sample POs

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            EXTERNAL SOURCES                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────────┐  │
│  │ Ariba Network│  │ Coupa CSP    │  │ Email: orders@enproinc.com       │  │
│  │ (cXML POST)  │  │ (cXML/CSV)   │  │ (PDF attachments via Graph API)  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┬───────────────────┘  │
└─────────┼─────────────────┼─────────────────────────┼──────────────────────┘
          │                 │                         │
          │                 │                         │
          ▼                 ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PO AGENT APPLICATION                                 │
│                    (Docker container / Azure Container App)                  │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  INTAKE MODULE                                                      │    │
│  │  ├─ cXML Parser (Ariba/Coupa native)                               │    │
│  │  ├─ PDF Parser (Azure Document Intelligence)                        │    │
│  │  └─ CSV Parser (direct column mapping)                              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  MATCHING ENGINE                                                    │    │
│  │  ├─ Customer Crosswalk (4,880 entries) — exact → zip → fuzzy       │    │
│  │  ├─ Item Crosswalk (22,675 mappings) — customer → global → fuzzy   │    │
│  │  └─ Confidence Scorer (green/yellow/red)                            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  REVIEW PORTAL (Browser UI)                                         │    │
│  │  ├─ Queue with green/yellow/red filters                             │    │
│  │  ├─ Approve → CISM + P21 payload                                    │    │
│  │  ├─ Reject with reason                                              │    │
│  │  ├─ Edit PO (customer, items, re-score)                             │    │
│  │  └─ Bulk Approve Greens                                             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  OUTPUT GENERATION                                                  │    │
│  │  ├─ CISM SO CSV (75-col header + 40-col line)  ──► P21 Import      │    │
│  │  ├─ P21 Transaction API JSON payload ──► Future live SO submit     │    │
│  │  └─ Auto-learn → writes back to crosswalk CSVs                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
          │                                           │
          │                                           │
          ▼                                           ▼
┌─────────────────────┐                    ┌─────────────────────┐
│  AZURE BLOB STORAGE │                    │  P21 ERP (on-prem)  │
│  (crosswalk backup) │                    │  ├─ CISM Import     │
│                     │                    │  └─ Transaction API │
└─────────────────────┘                    └─────────────────────┘
```

---

## What EnPro Needs to Provision (In Their Existing Azure Tenant)

The POC ran on a shared Azure tenant. **These same services must be recreated in EnPro's own Microsoft 365 / Azure environment.** The provider helps set them up; EnPro's Azure admin grants access.

### 1. Azure Active Directory App Registration (for Microsoft Graph API)

**Purpose:** Read emails from `orders@enproinc.com`

**Who does this:** EnPro Azure admin (or provider with admin access)

**Steps:**
1. Go to Azure Portal (portal.azure.com) → sign in with EnPro tenant
2. Azure Active Directory → App registrations → New registration
3. Name: `EnPro-PO-Agent-Graph`
4. Supported account types: Single tenant
5. Redirect URI: None (client credentials flow)
6. Click **Certificates & secrets** → New client secret → copy the value
7. Click **API permissions** → Add permission → Microsoft Graph → Application permissions:
   - `Mail.Read`
   - `Mail.ReadWrite`
   - `User.Read.All`
8. Click **Grant admin consent for [tenant]**
9. Copy: **Application (client) ID**, **Directory (tenant) ID**, **Client Secret**

**Environment variables:**
```
GRAPH_TENANT_ID=<Directory tenant ID>
GRAPH_CLIENT_ID=<Application client ID>
GRAPH_CLIENT_SECRET=<Client secret value>
GRAPH_MAILBOX=orders@enproinc.com
```

### 2. Azure Document Intelligence (for PDF parsing)

**Purpose:** Extract PO data from PDF attachments

**Who does this:** EnPro Azure admin (or provider with subscription access)

**Steps:**
1. Go to Azure Portal → Create resource → Document Intelligence
2. Name: `enpro-po-doc-intel`
3. Pricing tier: Standard S0
4. Region: Same region as EnPro's other Azure resources
5. After creation, go to **Keys and Endpoint** → copy **Key 1** and **Endpoint**

**Environment variables:**
```
DOC_INTEL_ENDPOINT=<Endpoint URL>
DOC_INTEL_KEY=<Key 1>
```

**Important:** The POC used a shared tenant key that expired (401). You MUST create a new Document Intelligence resource in EnPro's own Azure subscription.

### 3. Azure Blob Storage (for crosswalk backup)

**Purpose:** Backup crosswalk CSVs and CISM batch files

**Who does this:** EnPro Azure admin (or provider with subscription access)

**Steps:**
1. Go to Azure Portal → Storage accounts → Create
2. Name: `enpropoagentdata` (must be globally unique)
3. Performance: Standard
4. Redundancy: Locally-redundant storage (LRS)
5. After creation, go to **Access keys** → copy **Connection string** for key1
6. Create a container named: `ariba-coupa`

**Environment variables:**
```
BLOB_CONNECTION_STRING=<Connection string>
AZURE_BLOB_CONTAINER_NAME=ariba-coupa
```

### 4. Hosting Platform

**Option A: Azure Container Apps (Recommended)**
- Already has Bicep template in repo: `azure/container-app.bicep`
- Persistent storage via Azure Files mount at `/app/data`
- Auto-scaling, HTTPS, custom domain support
- Deployment script: `scripts/deploy_azure.sh`

**Option B: Any Docker host (Railway, Fly.io, VPS)**
- Dockerfile already in repo root
- Needs persistent disk/volume for `/app/data` directory
- Minimum 1GB storage

**Option C: Self-hosted Windows Server**
- Install Python 3.11+, pip
- Clone repo, `pip install -r requirements.txt`
- `uvicorn server:app --host 0.0.0.0 --port 8000`

---

## Data Storage Requirements

The application writes to local disk. If using a container host, you MUST mount a persistent volume at `/app/data`:

```
/app/data/
├── po_store/              # One JSON file per PO
├── cism_so_output/        # Per-PO CISM CSV files
├── cism_batch/            # Accumulated batch CSVs
├── crosswalks/            # Customer + item crosswalk CSVs
└── outbound_store/        # Outbound sync payloads
```

**Minimum disk:** 1GB (current usage ~50MB)

---

## P21 Integration (On-Premises)

The POC generated CISM CSV files for manual import into P21. For **live Sales Order creation**, the P21 server needs:

### Option 1: CISM Import (Current, Proven)
1. Approve PO in the agent → CISM CSV files generated
2. Download batch CSVs from CISM Batch tab
3. Upload to P21 CISM import folder
4. Run P21 CISM import job

### Option 2: P21 Transaction API (Future)
Requires EnPro IT to:
1. Install P21 Transaction API v2 middleware on the P21 server
2. Create a dedicated API user (e.g., `POAGENT`)
3. Open firewall port 3333 (or reverse proxy) from the agent host
4. Provide the base URL, username, and password

**Environment variables:**
```
P21_BASE_URL=https://<p21-server>:3333
P21_API_USERNAME=POAGENT
P21_API_PASSWORD=<strong-password>
P21_AUTO_SUBMIT_ON_APPROVE=false   # Set true to skip manual button
```

See `P21_API_SETUP.md` for detailed IT instructions.

---

## Security Model

| Layer | Protection | Status |
|-------|-----------|--------|
| API mutations | `APP_API_KEY` header | Code ready, needs env var set |
| Admin UI tabs | Passphrase gate | Code ready, needs `ADMIN_PASSPHRASE` env var |
| Azure credentials | Never committed; env vars only | ✅ Correct |
| CORS | Restricted to known origins | Needs domain whitelist |
| HTTPS | Required in production | Use Azure Container Apps or reverse proxy |

**Required environment variables for production:**
```
APP_API_KEY=<generate strong random string>
ADMIN_PASSPHRASE=<generate strong random string>
```

---

## Environment Variables — Complete List

```
# === REQUIRED FOR EMAIL INTAKE ===
GRAPH_TENANT_ID=
GRAPH_CLIENT_ID=
GRAPH_CLIENT_SECRET=
GRAPH_MAILBOX=orders@enproinc.com

# === REQUIRED FOR PDF PARSING ===
DOC_INTEL_ENDPOINT=
DOC_INTEL_KEY=

# === REQUIRED FOR BLOB BACKUP ===
BLOB_CONNECTION_STRING=
AZURE_BLOB_CONTAINER_NAME=ariba-coupa

# === SECURITY (MUST SET IN PRODUCTION) ===
APP_API_KEY=
ADMIN_PASSPHRASE=

# === P21 LIVE SUBMIT (OPTIONAL — FUTURE) ===
P21_BASE_URL=
P21_API_USERNAME=
P21_API_PASSWORD=
P21_AUTO_SUBMIT_ON_APPROVE=false

# === AZURE AD ALIASES (same as GRAPH) ===
AZURE_TENANT_ID=
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=

# === PATHS (all relative to container, auto-created on boot) ===
CROSSWALK_DIR=./data/crosswalks
CISM_SO_OUTPUT_DIR=./data/cism_so_output
CISM_BATCH_DIR=./data/cism_batch
PO_STORE_DIR=./data/po_store
```

---

## Deployment Checklist for New Provider

- [ ] Create Azure AD app registration for Graph API
- [ ] Create Azure Document Intelligence resource
- [ ] Create Azure Storage account + Blob container
- [ ] Pick hosting platform (Azure Container Apps recommended)
- [ ] Set all environment variables on the host
- [ ] Deploy application (Docker build + push + run)
- [ ] Create `/app/data` subdirectories on persistent volume
- [ ] Upload crosswalk CSVs to `data/crosswalks/` (provided separately)
- [ ] Test `/health` endpoint returns OK
- [ ] Test email polling: `POST /api/v1/intake/poll-now`
- [ ] Test PDF upload: use sample from `test_data/`
- [ ] Test approve → CISM generation → download batch CSVs
- [ ] Set `APP_API_KEY` and `ADMIN_PASSPHRASE` before go-live

---

## What Works Right Now (No External Services)

Even without Azure credentials, the app boots and runs locally for testing:

1. **cXML parsing** — upload Ariba/Coupa XML files directly
2. **CSV parsing** — upload column-mapped CSV files
3. **Crosswalk matching** — works from local CSV files
4. **Confidence scoring** — green/yellow/red badges
5. **Review queue** — click, review, approve, reject, edit
6. **CISM generation** — produces CSV files on disk
7. **P21 payload builder** — produces JSON payloads

**To test without Azure:**
```bash
uvicorn server:app --reload
# Open http://localhost:8000
# Use "Add PO to Review" → upload test_data/sample_ariba_po_1.xml
```

---

## Contact

**Peter Wilson** — pwnetsuite@outlook.com  
**GitHub Repo:** https://github.com/simplebalance89-ai/enpro-po-agent
