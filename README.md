# EnPro PO Agent

A Purchase Order automation agent for EnPro Industries. It ingests POs from email (Ariba, Coupa, direct PDF), matches them to P21 ERP customer and item data, scores confidence, and produces CISM import files for Sales Order creation.

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-teal.svg)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](./Dockerfile)

---

## Table of Contents

- [What It Does](#what-it-does)
- [Architecture](#architecture)
- [Order Workflow (Step by Step)](#order-workflow-step-by-step)
- [Repository Structure](#repository-structure)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [P21 Integration](#p21-integration)
- [Security](#security)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## What It Does

The EnPro PO Agent automates the manual work of turning incoming customer purchase orders into P21 sales orders:

| Capability | Description |
|------------|-------------|
| **Email Intake** | Polls `orders@enproinc.com` via Microsoft Graph API and downloads PDF attachments. |
| **cXML / CSV Intake** | Accepts Ariba and Coupa cXML payloads, plus direct CSV uploads. |
| **PDF Parsing** | Uses Azure Document Intelligence to extract PO headers and line items. |
| **Customer Crosswalk** | Matches ship-to addresses and PO entities against ~4,880 EnPro customer records. |
| **Item Crosswalk** | Maps customer part numbers to EnPro internal items via ~22,675 mappings. |
| **Confidence Scoring** | Marks each match green, yellow, or red so reviewers know what to check. |
| **Review Queue** | Browser UI for approve, reject, edit, and bulk-approve operations. |
| **CISM SO Output** | Generates 75-column header + 40-column line CSVs ready for P21 CISM import. |
| **P21 Transaction API** | Optional live SO submission once P21 middleware is installed. |
| **Invoice Module** | Ariba/Coupa invoice generation (built, currently disabled). |

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            EXTERNAL SOURCES                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────────┐  │
│  │ Ariba Network│  │ Coupa CSP    │  │ Email: orders@enproinc.com       │  │
│  │ (cXML POST)  │  │ (cXML/CSV)   │  │ (PDF attachments via Graph API)  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┬───────────────────┘  │
└─────────┼─────────────────┼─────────────────────────┼──────────────────────┘
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
│  │  ├─ Customer Crosswalk — exact → zip → fuzzy                        │    │
│  │  ├─ Item Crosswalk — customer → global → fuzzy                     │    │
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
│  │  ├─ CISM SO CSV ──► P21 Import                                      │    │
│  │  ├─ P21 Transaction API JSON payload ──► Future live SO submit      │    │
│  │  └─ Auto-learn → writes back to crosswalk CSVs                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
          │                                           │
          ▼                                           ▼
┌─────────────────────┐                    ┌─────────────────────┐
│  AZURE BLOB STORAGE │                    │  P21 ERP (on-prem)  │
│  (crosswalk backup) │                    │  ├─ CISM Import     │
│                     │                    │  └─ Transaction API │
└─────────────────────┘                    └─────────────────────┘
```

---

## Order Workflow (Step by Step)

A purchase order moves through the agent one line at a time, from intake to output.

### 1. Intake

The agent collects POs from three sources:

- **Email** — Microsoft Graph API polls `orders@enproinc.com` every 60 seconds and downloads PDF attachments.
- **cXML POST** — Ariba and Coupa send cXML order request payloads directly to `/api/v1/intake/cxml`.
- **Manual upload** — Users drag-and-drop cXML, CSV, or PDF files into the review portal.

### 2. Parsing

Each PO is normalized into a common internal model:

- **cXML** is parsed with `lxml`/`defusedxml`.
- **CSV** is mapped by column headers.
- **PDF** is sent to Azure Document Intelligence for layout-aware extraction.

### 3. Customer Matching

The agent tries to identify the EnPro customer in this order:

1. Exact ship-to address match.
2. Customer name match.
3. ZIP + city match.
4. Fuzzy match on company name.

Result: a customer record with a confidence badge.

### 4. Item Matching

Each PO line is matched to an EnPro item:

1. Exact customer part number → internal item.
2. Customer-level crosswalk lookup.
3. Global crosswalk lookup.
4. Fuzzy description / part number match.

Result: each line gets a green, yellow, or red confidence badge.

### 5. Confidence Scoring

- **Green** — high confidence, safe to bulk approve.
- **Yellow** — one or more fields need human review.
- **Red** — critical mismatch or missing data.

### 6. Review Queue

The web UI shows the queue with filters by color. Reviewers can:

- Approve a PO.
- Reject a PO with a reason.
- Edit customer, items, quantities, prices, and re-score.
- Bulk-approve all green POs.

### 7. Output Generation

On approval:

1. A CISM SO CSV file is written to `/app/data/cism_so_output/`.
2. Batched orders are accumulated in `/app/data/cism_batch/`.
3. Optionally, a P21 Transaction API JSON payload is built for live submission.
4. Successful matches are written back to crosswalk CSVs to improve future matching.

### 8. P21 Import

For the current CISM flow:

1. Download the batch CSV from the CISM Batch tab.
2. Upload it to the P21 CISM import folder.
3. Run the P21 CISM import job.

For the live API flow (future):

1. Set `P21_AUTO_SUBMIT_ON_APPROVE=true`.
2. Approved POs are submitted directly to the P21 Transaction API.

---

## Repository Structure

```text
enpro-po-agent/
├── .gitignore
├── Dockerfile
├── README.md
├── config.py                  # Pydantic settings / env var loader
├── models.py                  # Shared Pydantic data models
├── po_parser.py               # cXML / CSV / PDF parsing entry points
├── requirements.txt           # Python dependencies
├── server.py                  # FastAPI app and review portal
├── azure/
│   └── container-app.bicep    # Azure Container Apps deployment template
├── docs/                      # Handoff and reference documentation
│   ├── HANDOFF_STATUS.md
│   ├── INVOICE_MODULE_PLAN.md
│   ├── P21_API_SETUP.md
│   ├── README-HANDOFF.md
│   └── SOLUTION_ARCHITECTURE_AND_PROVIDER_HANDOFF.md
├── services/
│   ├── intake/                # Email polling and classification
│   │   ├── email_classifier.py
│   │   └── email_poller.py
│   └── processing/            # Matching, scoring, output, and P21 clients
│       ├── address_normalizer.py
│       ├── ariba_invoice_builder.py
│       ├── blob_uploader.py
│       ├── cism_batch.py
│       ├── cism_so_generator.py
│       ├── confidence_scorer.py
│       ├── coupa_invoice_builder.py
│       ├── crosswalk_csv_builder.py
│       ├── crosswalk_engine.py
│       ├── crosswalk_learner.py
│       ├── customer_crosswalk_engine.py
│       ├── duplicate_detector.py
│       ├── invoice_store.py
│       ├── local_store.py
│       ├── mapping_suggester.py
│       ├── outbound_mapper.py
│       ├── outbound_store.py
│       ├── p21_api_client.py
│       ├── p21_invoice_pull.py
│       ├── p21_so_submitter.py
│       ├── processing_agent.py
│       ├── quote_exporter.py
│       └── so_exporter.py
├── sql/                       # Reference SQL for P21 reads/writes
│   ├── DIRECT_SQL_SO_INSERT.sql
│   ├── P21_SQL_REFERENCE.md
│   └── so_pull.sql
├── static/
│   └── index.html             # Review portal single-page UI
├── template_verification/
│   └── p21_payload_template.json
└── test_data/                 # Sample POs for local testing
    ├── sample_ariba_po_1.xml
    ├── sample_coupa_po_2.xml
    ├── sample_po_10_coupa.xml
    ├── sample_po_11_ariba.xml
    └── sample_po_18_direct.xml
```

---

## Quick Start

### Prerequisites

- Python 3.11+
- pip
- (Optional) Docker

### Local Development

```bash
# Clone the repo
git clone https://github.com/GCEstack/gce-365-enpro-agent.git
cd gce-365-enpro-agent

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create a .env file (see Configuration below)
cp env.example .env

# Run the server
uvicorn server:app --reload
```

Open [http://localhost:8000](http://localhost:8000) and use **Add PO to Review** → upload a sample from `test_data/`.

### Docker

```bash
docker build -t enpro-po-agent .
docker run -p 8000:8000 --env-file .env enpro-po-agent
```

---

## Configuration

All configuration is loaded from environment variables via `config.py`. Create a `.env` file in the project root.

### Required for Email Intake

```bash
GRAPH_TENANT_ID=<Directory tenant ID>
GRAPH_CLIENT_ID=<Application client ID>
GRAPH_CLIENT_SECRET=<Client secret value>
GRAPH_MAILBOX=orders@enproinc.com
```

### Required for PDF Parsing

```bash
DOC_INTEL_ENDPOINT=<Azure Document Intelligence endpoint>
DOC_INTEL_KEY=<Azure Document Intelligence key>
```

### Required for Blob Backup

```bash
BLOB_CONNECTION_STRING=<Azure Storage connection string>
BLOB_CONTAINER=ariba-coupa
```

### Required for P21 Live Submit (Optional)

```bash
P21_BASE_URL=https://<p21-server>:3333
P21_API_USERNAME=POAGENT
P21_API_PASSWORD=<strong-password>
P21_AUTO_SUBMIT_ON_APPROVE=false
```

### Security (Required in Production)

```bash
APP_API_KEY=<generate strong random string>
ADMIN_PASSPHRASE=<generate strong random string>
```

### Storage Paths

```bash
CROSSWALK_DIR=/app/data/crosswalks
CISM_SO_OUTPUT_DIR=/app/data/cism_so_output
CISM_BATCH_DIR=/app/data/cism_batch
PO_STORE_DIR=/app/data/po_store
```

See [`docs/SOLUTION_ARCHITECTURE_AND_PROVIDER_HANDOFF.md`](./docs/SOLUTION_ARCHITECTURE_AND_PROVIDER_HANDOFF.md) for the full provisioning guide.

---

## Deployment

### Option A: Azure Container Apps (Recommended)

A Bicep template is provided in `azure/container-app.bicep`.

```bash
az deployment group create \
  --resource-group <rg-name> \
  --template-file azure/container-app.bicep \
  --parameters @azure/container-app.parameters.json
```

Features:

- Persistent Azure Files mount at `/app/data`
- Auto-scaling, HTTPS, and custom domain support
- Environment variables injected from Key Vault or parameters

### Option B: Any Docker Host

The included `Dockerfile` works on Railway, Fly.io, Render, or any VPS. Ensure the host mounts a persistent volume at `/app/data`.

### Option C: Self-Hosted Windows Server

```bash
# Install Python 3.11+ and ODBC Driver 18 for SQL Server
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000
```

---

## P21 Integration

The agent supports two P21 integration modes.

### Mode 1: CISM CSV Import (Current)

1. Approve POs in the agent.
2. Download accumulated batch CSVs from the CISM Batch tab.
3. Upload the CSV to the P21 CISM import folder.
4. Run the P21 CISM import job.

### Mode 2: P21 Transaction API (Future)

Requires EnPro IT to:

1. Install P21 Transaction API v2 middleware on the P21 server.
2. Create a dedicated API user (e.g., `POAGENT`).
3. Open firewall port 3333 (or use a reverse proxy).
4. Provide base URL, username, and password.

Detailed instructions are in [`docs/P21_API_SETUP.md`](./docs/P21_API_SETUP.md).

---

## Security

| Layer | Protection | Notes |
|-------|------------|-------|
| API mutations | `APP_API_KEY` header | Required in production. |
| Admin UI tabs | Passphrase gate | Set `ADMIN_PASSPHRASE`. |
| Azure credentials | Environment variables only | Never committed. |
| CORS | Restricted to known origins | Update whitelist for production domain. |
| HTTPS | Required in production | Use Azure Container Apps or a reverse proxy. |

---

## Testing

### Without Azure

Most features work locally without Azure credentials:

- cXML parsing
- CSV parsing
- Crosswalk matching from local CSV files
- Confidence scoring
- Review queue
- CISM generation

```bash
uvicorn server:app --reload
# Open http://localhost:8000
# Upload test_data/sample_ariba_po_1.xml
```

### Health Check

```bash
curl http://localhost:8000/health
```

### Trigger Email Poll

```bash
curl -X POST http://localhost:8000/api/v1/intake/poll-now \
  -H "X-API-Key: $APP_API_KEY"
```

---

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-change`.
3. Make your changes and add tests where applicable.
4. Run the test suite locally.
5. Submit a pull request with a clear description.

Please keep changes focused and follow the existing code style.

---

## License

This project is proprietary to EnPro Industries and GCEstack. See the repository owner for licensing terms.

---

## Support

For questions or deployment support, contact:

**Peter Wilson** — pwnetsuite@outlook.com
