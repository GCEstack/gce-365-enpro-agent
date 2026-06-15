# EnPro PO Agent — Handoff & Provider Setup

The PO Agent proof-of-concept is complete and ready to migrate into EnPro's own environment. This document explains how it was built, what's included, and what needs to be set up to get it running on your side.

## Background

The POC was built and deployed on Render using shared Azure credentials. A couple of notes on its current state:

- The Azure Document Intelligence key has expired (401), so PDF parsing is currently offline.
- The Graph API token still works.

Rather than keep patching the shared tenant, the cleaner path is to rebuild this properly in EnPro's own Azure / Microsoft 365 environment with a new hosting provider. Everything below is written with that in mind.

## What the application does

A working application with:

- **Email intake (Graph API)** — coded; needs a new app registration in your tenant
- **PDF parsing (Azure Document Intelligence)** — coded; needs a new resource and key in your tenant
- **cXML / CSV parsing** — works without Azure
- **Customer + item crosswalk matching** — ~95% auto-green rate
- **Review queue** — approve, reject, edit, and bulk approve
- **CISM SO CSV generation** — proven format, ready for P21 import
- **P21 Transaction API payloads** — built; needs P21 middleware and credentials
- **Invoice module (Ariba + Coupa cXML)** — built; currently disabled

## Known gaps / remaining work

The honest, full list is in `HANDOFF_STATUS.md`. The top items:

- Customer search dropdown in Edit PO (currently manual entry only)
- Toast notifications in place of `alert()` popups
- Audit trail (no log yet of who approved what)
- Disk usage warning
- P21 connectivity status indicator

These add up to roughly 1–2 days of focused work once the app is hosted.

## What the new provider needs to do

1. **Provision 3 Azure services in EnPro's tenant:**
   - Azure AD app registration (for Graph API email)
   - Azure Document Intelligence (for PDF parsing)
   - Azure Blob Storage (for crosswalk backup)
2. **Host the app** — Azure Container Apps recommended, or any Docker host
3. **Set environment variables** with the new Azure credentials
4. **Upload crosswalk CSVs** to the data directory
5. **Test end-to-end** with the sample POs in `test_data/`

Full step-by-step instructions — architecture diagram, Azure provisioning guide, deployment checklist, and environment variable reference — are in `SOLUTION_ARCHITECTURE_AND_PROVIDER_HANDOFF.md`.

## P21 integration

For live SO creation (instead of the manual CISM upload), EnPro IT needs to:

- Install P21 Transaction API v2 middleware on the P21 server
- Create a dedicated API user (e.g., `POAGENT`)
- Provide the base URL, username, and password

Detailed IT instructions are in `P21_API_SETUP.md`.

## Package contents

The enclosed zip includes the full codebase, documentation, and deployment scripts.

## Questions

Happy to walk through any of this — just reach out.

Peter Wilson
pwnetsuite@outlook.com
