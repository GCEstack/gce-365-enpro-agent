# P21 Transaction API — Setup Instructions for EnPro IT

**What this does:** Enables the PO Agent to create Sales Orders directly in P21 via REST API instead of manual CISM CSV upload.

**Status:** Code is built and tested. Just needs credentials + middleware.

---

## Step 1: Install P21 Transaction API Middleware

On the P21 application server:

1. Install the **P21 Transaction API v2** middleware (contact P21 support or your P21 consultant)
2. Verify the service is running on a reachable port (default: **3333**)
3. Ensure firewall rules allow inbound HTTPS from the PO Agent host (Render IP or Azure Container App)

## Step 2: Create API User

In P21 System Administration:

1. Create a dedicated user (e.g., `POAGENT` or `API_USER`)
2. Assign minimal permissions:
   - Sales Order creation
   - Customer read
   - Item master read
3. **No DynaChange rules** — the API user should bypass custom business rules to avoid session contamination

## Step 3: Get the Base URL

```
https://<P21-server-internal-IP-or-hostname>:3333
```

If the PO Agent is hosted externally (Render/Azure), you need either:
- A public-facing reverse proxy to P21
- VPN/tunnel between cloud host and P21 server
- Azure private endpoint if P21 is also in Azure

## Step 4: Configure the PO Agent

Set these environment variables on your hosting platform:

```
P21_BASE_URL=https://<your-p21-server>:3333
P21_API_USERNAME=POAGENT
P21_API_PASSWORD=<strong-password>
P21_VERIFY_SSL=false          # Set true if using valid TLS cert
P21_AUTO_SUBMIT_ON_APPROVE=false   # Set true to skip manual button
```

## Step 5: Test

1. Go to **Mic Drop** page (`/micdrop`) — shows a live P21 payload
2. Or approve a green PO — if configured, it will attempt live SO creation
3. Check P21 for the new Sales Order
4. The PO record in the agent will show `order_no` after successful creation

## Fallback (Always Works)

If P21 API is not ready, the agent falls back to **CISM CSV export**:
- Approve PO → CISM files generated
- Download batch CSVs from CISM Batch tab
- Upload to P21 CISM import folder manually

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| "P21 not configured" in health check | Set `P21_BASE_URL` |
| Auth failed | Wrong username/password or user locked |
| Connection timeout | Firewall blocking port 3333; check VPN |
| SSL error | Set `P21_VERIFY_SSL=false` for self-signed certs |
| Order not created | Check P21 import log; verify user permissions |

---

**Questions?** Contact Peter Wilson — pwnetsuite@outlook.com
