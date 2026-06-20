# EnPro PO Agent — Invoice Module Plan

**Date:** June 1, 2026
**Status:** Built and validated in POC. Disabled behind env var pending credentials.
**Scope:** Automated invoice sync from P21 to Ariba / Coupa vendor portals.

---

## What It Does

After a Sales Order is created and shipped, an invoice is generated in P21. This module:

1. **Pulls invoice data** from P21 SQL (`dbo.oe_invoice_hdr`, `dbo.oe_invoice_line`)
2. **Matches the invoice** to the original PO / SO
3. **Builds cXML** in the vendor's required format:
   - **Coupa:** `InvoiceDetailRequest` cXML with line items, tax, terms
   - **Ariba:** Ariba-specific cXML with extrinsics, document references, tax details
4. **Submits** the cXML to the vendor portal (Ariba Network or Coupa CSP)
5. **Tracks status** — Pending → Submitted → Accepted / Rejected

---

## Why This Matters

Currently: EnPro manually creates invoices in Ariba/Coupa portals after shipping. Someone re-enters line items, quantities, prices, tax — by hand.

With this module: P21 invoice data auto-flows to the correct vendor portal in the correct cXML format. No re-entry. No errors. Faster payment.

---

## Architecture

```
P21 ERP (on-prem)
  ├─ dbo.oe_invoice_hdr   ──┐
  └─ dbo.oe_invoice_line  ──┤
                              ▼
                    PO Agent Invoice Sync
                              ├─ Match invoice to PO/SO
                              ├─ Build cXML (Coupa or Ariba)
                              └─ POST to vendor portal
                                         │
                    ┌──────────────────────┴──────────────────────┐
                    ▼                                               ▼
            Ariba Network                                    Coupa CSP
            (cXML Invoice)                                   (cXML InvoiceDetail)
```

---

## What's Built (Verified Working in POC)

| Component | File | Status |
|-----------|------|--------|
| P21 invoice SQL pull | `p21_invoice_pull.py` | ✅ Built — queries `oe_invoice_hdr` + `oe_invoice_line` |
| Invoice local storage | `invoice_store.py` | ✅ Built — JSON file persistence |
| Coupa cXML builder | `coupa_invoice_builder.py` | ✅ Built — full `InvoiceDetailRequest` schema |
| Ariba cXML builder | `ariba_invoice_builder.py` | ✅ Built — extrinsics, document refs, tax detail |
| Invoice API endpoints | `server.py` | ✅ Built — list, build, download, demo |
| UI invoice tab | `static/index.html` | ✅ Built — table with build/download buttons |
| Demo invoice creation | `server.py` | ✅ Built — creates test invoices without P21 SQL |

---

## What EnPro Needs to Enable It

### 1. Environment Variable

```bash
ENABLE_INVOICE_SYNC=true
```

Without this, all invoice endpoints return 503 "Module disabled."

### 2. P21 SQL Read Access

The agent needs read-only ODBC access to these P21 tables:

```sql
SELECT * FROM dbo.oe_invoice_hdr   -- Invoice headers (invoice_no, so_no, customer_id, invoice_date, total_amount)
SELECT * FROM dbo.oe_invoice_line  -- Invoice lines (invoice_no, line_no, item_id, qty, price, tax)
```

**Connection:** Use the same P21 SQL credentials as the PO Agent:
```
P21_SQL_SERVER=<your-p21-server>
P21_SQL_DATABASE=P21
P21_SQL_UID=<read-only-user>
P21_SQL_PWD=<password>
```

### 3. Coupa API Credentials (for Coupa submissions)

```bash
COUPA_API_URL=https://<your-coupa-instance>.coupahost.com
COUPA_API_KEY=<API key from Coupa admin>
```

Get this from your Coupa administrator under **Setup → Integrations → API Keys**.

### 4. Ariba Network Credentials (for Ariba submissions)

```bash
ARIBA_NETWORK_URL=https://service.ariba.com
ARIBA_API_KEY=<API key>
ARIBA_SUPPLIER_ID=<EnPro's Ariba supplier ID>
```

Get this from your Ariba account manager.

### 5. Scheduled Sync Job

Invoice sync should run on a schedule (not real-time):

| Frequency | Recommendation |
|-----------|---------------|
| **Daily at 6 AM** | Pull yesterday's invoices from P21, build cXML, submit to portals |
| **Or hourly** | If invoice volume is high |

This is a simple cron job or Azure Function calling:
```bash
POST /api/v1/invoices/sync
```

---

## How It Works (Step by Step)

### Step 1: Pull Invoices from P21

```sql
-- Runs daily
SELECT 
  h.invoice_no,
  h.so_number,
  h.customer_id,
  h.invoice_date,
  h.total_amount,
  h.terms,
  l.line_no,
  l.item_id,
  l.qty_invoiced,
  l.unit_price,
  l.tax_amount
FROM dbo.oe_invoice_hdr h
JOIN dbo.oe_invoice_line l ON h.invoice_no = l.invoice_no
WHERE h.invoice_date >= DATEADD(day, -1, GETDATE())
  AND h.invoice_status = 'POSTED'
```

### Step 2: Match to Original PO

The agent looks up:
- `so_number` → maps to `intake_id` from the PO record
- `customer_id` → maps to P21 customer from crosswalk
- Item IDs → maps to supplier part numbers from customer-item crosswalk

### Step 3: Build cXML

**For Coupa:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE cXML SYSTEM "http://xml.cXML.org/schemas/cXML/1.2.020/InvoiceDetail.dtd">
<cXML payloadID="..." timestamp="...">
  <Header>
    <From><Credential domain="DUNS"><Identity>EnPro</Identity></Credential></From>
    <To><Credential domain="DUNS"><Identity>Coupa</Identity></Credential></To>
    <Sender>...</Sender>
  </Header>
  <Request deploymentMode="production">
    <InvoiceDetailRequest>
      <InvoiceDetailOrderInfo>
        <OrderReference orderID="4500819454">
          <DocumentReference payloadID="PO_4500819454"/>
        </OrderReference>
      </InvoiceDetailOrderInfo>
      <InvoiceDetailItem invoiceLineNumber="1" quantity="24">
        <UnitOfMeasure>EA</UnitOfMeasure>
        <UnitPrice><Money currency="USD">185.50</Money></UnitPrice>
        <InvoiceDetailItemReference lineNumber="1">
          <Description xml:lang="en">Pall Filter Element - High Pressure</Description>
        </InvoiceDetailItemReference>
        <SubtotalAmount><Money currency="USD">4452.00</Money></SubtotalAmount>
      </InvoiceDetailItem>
      <!-- Tax, summary, etc. -->
    </InvoiceDetailRequest>
  </Request>
</cXML>
```

**For Ariba:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE cXML SYSTEM "http://xml.cXML.org/schemas/cXML/1.2.020/InvoiceDetail.dtd">
<cXML payloadID="..." timestamp="...">
  <Header>...</Header>
  <Request deploymentMode="production">
    <InvoiceDetailRequest>
      <InvoiceDetailOrderInfo>
        <OrderReference orderID="4500819454"/>
      </InvoiceDetailOrderInfo>
      <InvoiceDetailItem invoiceLineNumber="1" quantity="24">
        <UnitOfMeasure>EA</UnitOfMeasure>
        <Money currency="USD">185.50</Money>
        <InvoiceDetailItemReference lineNumber="1">
          <Description xml:lang="en">Pall Filter Element</Description>
        </InvoiceDetailItemReference>
        <Extrinsic name="PO Number">4500819454</Extrinsic>
        <Extrinsic name="SO Number">SO-12345</Extrinsic>
        <Extrinsic name="PaymentTerms">Net 30</Extrinsic>
      </InvoiceDetailItem>
      <InvoiceDetailSummary>
        <SubtotalAmount><Money currency="USD">4452.00</Money></SubtotalAmount>
        <Tax><Money currency="USD">356.16</Money><Description xml:lang="en">Sales Tax</Description></Tax>
        <NetAmount><Money currency="USD">4808.16</Money></NetAmount>
      </InvoiceDetailSummary>
    </InvoiceDetailRequest>
  </Request>
</cXML>
```

### Step 4: Submit to Vendor Portal

**Coupa:**
```bash
curl -X POST https://<coupa-instance>.coupahost.com/api/invoices \
  -H "X-COUPA-API-KEY: <key>" \
  -H "Content-Type: application/xml" \
  --data-binary @invoice.xml
```

**Ariba:**
```bash
curl -X POST https://service.ariba.com/InvoiceImporter.aw/ad/InvoiceImporter \
  -H "Content-Type: application/xml" \
  --data-binary @invoice.xml
```

### Step 5: Track Status

The agent stores the submission and polls for status:
- **Pending** — cXML built, not yet submitted
- **Submitted** — POSTed to vendor portal
- **Accepted** — vendor confirmed receipt
- **Rejected** — vendor returned error (reason logged)

---

## ROI

| Before | After |
|--------|-------|
| Manual data entry into Ariba/Coupa (~15 min per invoice) | Zero re-entry |
| Typo risk on part numbers, quantities, prices | Data comes straight from P21 |
| Delayed invoicing (batch weekly or monthly) | Daily automated sync |
| Someone dedicated to invoice portal admin | Scheduled job runs unattended |

**Estimated savings:** 15 minutes × 50 invoices/week × $40/hr loaded cost = **$2,000/week**

---

## Deployment Steps

1. Set `ENABLE_INVOICE_SYNC=true` in environment
2. Verify P21 SQL read access to `oe_invoice_hdr` / `oe_invoice_line`
3. Get Coupa API key from admin (or Ariba credentials)
4. Set API credentials in environment
5. Test: create demo invoice → build cXML → view in UI → validate structure
6. Schedule daily sync job (cron, Azure Function, or agent internal scheduler)
7. Monitor first week manually, then let it run

---

## Questions

Contact: Peter Wilson — pwnetsuite@outlook.com
