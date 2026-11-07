# PayWide UX & Design Specification

> **Hackathon:** Blaaiz Buildathon (GDG Ilorin)  
> **Product Name:** PayWide  
> **Design Philosophy:** Precision Capital Modern — Institutional trust, total fee transparency, and real-time status observability.

---

## 1. Executive Summary & Design Wedge

Most retail remittance applications conceal foreign exchange markups inside widened spreads and obscure payment statuses behind opaque "Pending" labels.

**PayWide’s product wedge is Total Transparency:**
1. **Upfront Clarity:** Senders see the exact guaranteed exchange rate, network fee, and recipient payout *before* providing personal details or committing funds.
2. **Deterministic Precision:** All financial calculations strictly utilize integer minor units (kobo, pence, cents) to prevent IEEE-754 floating point inaccuracies.
3. **Live Status Observability:** Instead of a static "processing" spinner, senders observe an active 4-phase status timeline driven by Server-Sent Events (SSE) and HMAC-verified Blaaiz webhooks.
4. **Unambiguous Regulatory Demarcation:** PayWide clearly identifies itself as a technology provider, making explicit that fund custody, foreign exchange, and destination clearing are powered by **Blaaiz (Remittance-as-a-Service)**.

---

## 2. Design System: Precision Capital Modern

Inspired by institutional treasury interfaces, the visual aesthetic balances enterprise authority with modern consumer clarity.

### 2.1 Color Palette
- **Primary:** `#00236f` (Deep Navy) — Anchor brand color conveying institutional security and precision.
- **Secondary / Accent:** `#006c4a` (Emerald Green) — Signifies successful settlement, guaranteed rates, and verified accounts.
- **Surface:** `#faf8ff` (Refined Off-White) — High-legibility backdrop with subtle coolness.
- **Surface Containers:** `#ffffff` (Card background), `#f2f3ff` (Input fields), `#eaedff` (Active cards).
- **Text & On-Surface:** `#131b2e` (Dark Slate) — High contrast text meeting WCAG AA (minimum 7:1 contrast ratio against white).
- **Error:** `#ba1a1a` — Distinct error states for validation failures.
- **Warning / Sandbox:** Amber `#f59e0b` — Clearly highlights Sandbox and Mock mode environments.

### 2.2 Typography
- **Headings:** `Space Grotesk` (Geometric, contemporary fintech character).
- **Body & Forms:** `Montserrat` / System sans-serif (Crisp readability at small font sizes).
- **Financial Numbers & Identifiers:** `font-mono` with `tabular-nums` CSS enabled to ensure numbers align symmetrically across breakdown tables.

---

## 3. End-to-End User Journey

The core transfer journey consists of 4 focused, low-cognitive-load steps:

```
[ Step 1: Quote ] ──> [ Step 2: Recipient ] ──> [ Step 3: Review ] ──> [ Step 4: Track & Receipt ]
```

### Step 1: Transparent Quote Calculator
- **Frictionless Entry:** Senders can calculate exact rates without creating an account or logging in first ("late login wall").
- **Real-Time Calculation:** Senders enter the NGN amount (e.g. ₦1,000,000) and pick from 4 destination corridors:
  - **GBP (£):** UK Faster Payments Service (FPS)
  - **USD ($):** US ACH & Fedwire Same-Day
  - **EUR (€):** SEPA & SEPA Instant
  - **CAD (C$):** Interac e-Transfer
- **5-Minute Guaranteed Rate Lock:**
  - Active countdown timer (`04:59`, `04:58`...) showing remaining validity.
  - Senders are protected against intraday FX volatility during the checkout process.
- **Transparent Breakdown Accordion:**
  - Transfer Amount: `₦1,000,000.00 NGN`
  - Blaaiz Network Fee: `₦5,000.00 NGN`
  - Hidden FX Spread: `₦0.00 (0.0%)`
  - Net Amount Converted: `₦995,000.00 NGN`
  - Exact Recipient Gets: `£473.81 GBP`
- **Expired State:**
  - If the 5-minute timer lapses, the input freezes with an alert: *"Quote lock expired after 5 minutes. Real-time rates fluctuate with market liquidity."*
  - 1-click **"Refresh Rate"** button fetches fresh rates from Blaaiz instantly.

---

### Step 2: Dynamic Corridor-Specific Recipient Form
Form fields change dynamically depending on the selected currency, enforcing standard national banking formats:

1. **United Kingdom (GBP):**
   - Recipient Legal Full Name
   - 6-digit UK Sort Code (e.g., `20-00-00`)
   - 8-digit Account Number
   - **UK Confirmation of Payee (CoP) Action:** Senders can click *"Check UK Confirmation of Payee"* to verify the name against the destination bank via Blaaiz directory lookup before sending.

2. **Eurozone (EUR):**
   - Recipient Full Name
   - International Bank Account Number (IBAN) with country code validation
   - BIC / SWIFT code (optional)
   - *"Validate SEPA IBAN Routing"* action.

3. **United States (USD):**
   - Recipient Full Name
   - Payment Method toggle: **ACH** (1-2 days) vs **Fedwire** (Same Day)
   - US Bank Name (e.g. JPMorgan Chase, Bank of America)
   - 9-digit ABA Routing Number
   - Account Number & Account Type (Checking vs Savings)
   - SWIFT code (strictly required if Fedwire is selected).

4. **Canada (CAD):**
   - Recipient First Name & Last Name
   - Registered Interac e-Transfer Email Address
   - Microcopy reminding sender that recipient must have Interac Autodeposit enabled.

---

### Step 3: Review & Pre-Payment Authorization
- **Summary Receipt Card:** Clear visual recap of sender debit, network fee, exchange rate, and guaranteed payout amount.
- **Beneficiary Summary:** Visual verification of recipient name, account number, and rail.
- **Compliance & Narration:**
  - Sender full name and email for automated digital receipt dispatch.
  - Regulatory transfer purpose (e.g., *Family Support*, *Overseas Education*, *Technology Services*).
- **Mandatory Regulatory Consent Checkbox:**
  > *"I acknowledge that PayWide is a technology software platform and not a bank. Payment fulfillment, currency exchange, and cross-border settlement are executed exclusively via Blaaiz Remittance-as-a-Service."*
- **Idempotency Protection:** A unique idempotency key (`wp_idem_<timestamp>_<random>`) is bound to the submission button, preventing accidental double-billing if tapped multiple times.

---

### Step 4: Live Status Observability & Tracker
- **4-Phase Status Timeline:**
  1. **Transfer Created:** Quote locked, order registered.
  2. **Waiting for your payment:** Dynamic Providus/Wema virtual account displayed for the sender to fund in NGN.
  3. **On its way:** Blaaiz liquidity conversion and destination rail clearing.
  4. **Delivered / Completed:** Real-time confirmation of beneficiary credit.
- **Real-Time Dual Synchronization:**
  - **Server-Sent Events (SSE):** The client opens an SSE connection (`/api/transfers/[id]/events`) to receive immediate push notifications whenever a Blaaiz webhook fires.
  - **Polling Fallback:** Background polling every 4 seconds (`/api/transfers/[id]`) ensures continuous tracking even if SSE is interrupted by mobile network switches.
- **Hackathon Sandbox Simulator:**
  - A prominent **"⚡ Simulate NGN Payment"** button allows judges to trigger an instant funding event without requiring real banking credentials.
- **Institutional Receipt:**
  - 1-click **"Official Receipt"** modal with printable CSS layout, complete audit trail, Blaaiz payout ID, and timestamp.

---

## 4. Edge Cases & Resilience Engineering

| Edge Scenario | System Handling | User Experience |
| :--- | :--- | :--- |
| **Quote Expiry** | 5-minute timer ends; quote marked `EXPIRED` in database. | Input is locked; prominent amber alert with 1-click rate refresh. |
| **Network Interruption** | SSE connection drops or times out. | Automatically falls back to 4-second polling (`/api/transfers/[id]`). |
| **Double-Click Submit** | Mutating request blocked by client state and server idempotency key. | Button enters loading spinner; duplicate HTTP calls return original transaction. |
| **Delayed Webhook** | Webhook delivery delayed by upstream network. | Polling fallback queries Blaaiz `getTransaction` to reconcile state. |
| **Failed Payout** | Destination bank rejects account (e.g. closed account). | Timeline displays "Couldn't complete" in red with clear refund instructions. |

---

## 5. Developer & Judge Observability: The Integration Inspector

To provide absolute transparency during hackathon evaluation, PayWide includes an embedded **Integration Inspector**:
- Accessible from the persistent header banner.
- Displays every server-side call made to Blaaiz: HTTP method, endpoint, mode (`LIVE` vs `MOCK`), HTTP status code, latency in milliseconds, and raw JSON request/response payloads.
- Sensitive credentials (API keys, client secrets, bearer tokens) are scrubbed before reaching the browser.
