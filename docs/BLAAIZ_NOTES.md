# Blaaiz SDK (v1.7.0) Technical Notes: Confirmed vs. Assumed

This document records the exact findings from inspecting the official `blaaiz-nodejs-sdk` (v1.7.0: `package.json`, `index.d.ts`, `src/services/*`, and `README.md`) and testing connection against the sandbox (`https://api-dev.blaaiz.com`).

---

## 1. Authentication & Base URL

### CONFIRMED:
- **Base URL:** Sandbox base URL is `https://api-dev.blaaiz.com`. Production base URL is `https://api.blaaiz.com`.
- **OAuth 2.0 Credentials:** Supported via `client_id` and `client_secret` with grant type `client_credentials` calling `POST /oauth/token`.
- **API Key:** Legacy authentication via `api_key` string or `{ api_key: '...' }` passed in the `Authorization: Bearer <token>` or headers.
- **Connection Test:** `blaaiz.testConnection()` calls `blaaiz.currencies.list()` (`GET /api/external/currency`) and returns a boolean.
- **Environment Status:** Running `testConnection()` without env credentials confirmed credentials are absent in this build environment. The application defaults to `USE_MOCK=true` with an honest banner and inspector, while maintaining a 1:1 typed gateway to `RealBlaaizGateway`.

---

## 2. Payout Endpoints & Fields per Corridor

### CONFIRMED (from `PayoutService.js` and `index.d.ts`):
- **Endpoint:** `POST /api/external/payout`
- **Common Required Fields:**
  - `wallet_id` (string)
  - `customer_id` (string)
  - `method` ('bank_transfer' | 'interac' | 'ach' | 'wire' | 'crypto' | 'mobile_money')
  - `from_currency_id` (string, e.g. "NGN")
  - `to_currency_id` (string, e.g. "USD", "GBP", "EUR", "CAD")
  - Either `from_amount` (number) or `to_amount` (number)
- **Corridor-Specific Requirements:**
  1. **GBP (British Pound):**
     - `method`: `'bank_transfer'`
     - Required: `sort_code`, `account_number`, `account_name`
  2. **EUR (Euro):**
     - `method`: `'bank_transfer'`
     - Required: `iban`, `bic_code`, `account_name`
  3. **CAD (Canadian Dollar):**
     - `method`: `'interac'`
     - Required: `email`, `interac_first_name`, `interac_last_name`
  4. **USD (US Dollar):**
     - `method`: `'ach'` or `'wire'`
     - Required for ACH/Wire: `type` ('individual' | 'business'), `account_number`, `account_name`, `account_type` ('savings' | 'checking'), `bank_name`, `routing_number`
     - Required additionally for Wire: `swift_code`
  5. **NGN (Nigerian Naira Payout):**
     - `method`: `'bank_transfer'`
     - Required: `bank_id`, `account_number`
- **Response Format:**
  - `{ message: string, transaction: Transaction }`

---

## 3. Fees & Exchange Rates

### CONFIRMED:
- **Fees Breakdown Endpoint:** `POST /api/external/fees/breakdown`
- **Request Body:**
  ```json
  {
    "from_currency_id": "NGN",
    "to_currency_id": "USD",
    "from_amount": 100000
  }
  ```
- **Response Fields:**
  - `you_send` (number)
  - `total_amount_to_send` (number)
  - `recipient_gets` (number)
  - `total_fees` (number)
  - `exchange_rate` (number)
  - `collection_fees` (array)
  - `payout_fees` (array)
- **Rates List Endpoint:** `GET /api/external/rate?search_term=...`

---

## 4. Bank Lookup & Payee Verification

### CONFIRMED:
- **Banks List:** `GET /api/external/bank?currency=...&country=...`
- **Nigerian Account Lookup:** `POST /api/external/bank/account-lookup` with `{ account_number, bank_id }` -> returns `{ account_name, account_number, bank_name }`.
- **UK Confirmation of Payee:** `POST /api/external/bank/payee-verification` with `{ sort_code, account_number, account_name }`.
- **EU IBAN Verification:** `POST /api/external/bank/iban-verification` with `{ iban }`.

---

## 5. Webhooks & Signatures

### CONFIRMED:
- **Registration Endpoint:** `POST /api/external/webhook` with `{ collection_url, payout_url, kyc_url? }`
- **Headers:**
  - `x-blaaiz-signature`: Hex HMAC-SHA256 signature
  - `x-blaaiz-timestamp`: UNIX timestamp in seconds or ISO timestamp
- **Signature Computation:**
  - Signed payload: `${timestamp}.${payload}` where `payload` is the RAW body string.
  - Secret: `BLAAIZ_WEBHOOK_SECRET`
  - Computed as: `crypto.createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')`
  - Compared using `crypto.timingSafeEqual`
- **Replay Protection:** Reject requests where timestamp is older than 300 seconds (5 minutes).

---

## 6. Transaction Status Enums & Mapping

### CONFIRMED (from `index.d.ts`):
- Blaaiz transaction status values:
  `'PENDING' | 'PROCESSING' | 'SUCCESSFUL' | 'FAILED' | 'EXPIRED' | 'REVERSED' | 'CANCELLED' | 'AWAITING_APPROVAL'`

### MAPPING TO PAYWIDE UX:
| Blaaiz Status | PayWide Internal Status | Plain-Language User Copy |
| :--- | :--- | :--- |
| *(Internal initial)* | `CREATED` | Transfer created |
| `PENDING` / `AWAITING_APPROVAL` | `AWAITING_FUNDS` | Waiting for your payment |
| `PROCESSING` | `PROCESSING` | On its way |
| `SUCCESSFUL` | `COMPLETED` | Delivered |
| `FAILED` | `FAILED` | Couldn't complete |
| `REVERSED` | `FAILED` | Couldn't complete |
| `EXPIRED` | `EXPIRED` | Quote expired |
| `CANCELLED` | `CANCELLED` | Cancelled |

---

## 7. Assumed Behaviors (Documented & Handled)

1. **Rate Lock Duration:** Assumed to be 5 minutes (300 seconds). The UI displays a live 5-minute countdown clock and gracefully requests a refresh when the timer reaches zero.
2. **Sandbox Pre-funded Wallet vs Virtual Account:** In sandbox mode, the sender virtual account funding step is simulated with an explicit "Simulate Bank Transfer Payment" trigger in the UI, transitioning the state from `AWAITING_FUNDS` to `PROCESSING`.
3. **Idempotency Header:** While Blaaiz accepts `merchant_reference` on payouts, PayWide passes client-generated UUID idempotency keys to guarantee duplicate submits are rejected at the route handler and database level.
