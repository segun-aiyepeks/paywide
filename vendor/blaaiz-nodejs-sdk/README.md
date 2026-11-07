# Blaaiz Node.js SDK

A comprehensive Node.js SDK for the Blaaiz RaaS (Remittance as a Service) API. This SDK provides easy-to-use methods for payment processing, collections, payouts, customer management, and more.

## Installation

```bash
npm install blaaiz-nodejs-sdk
```

## Quick Start

```javascript
const { Blaaiz } = require('blaaiz-nodejs-sdk');

// Initialize the SDK (defaults to development environment)
const blaaiz = new Blaaiz('your-api-key-here', {
  baseURL: 'https://api-dev.blaaiz.com', // Optional: defaults to dev environment
  timeout: 30000 // Optional: request timeout in milliseconds
});

// For production, change the baseURL:
// const blaaiz = new Blaaiz('your-prod-api-key', {
//   baseURL: 'https://api.blaaiz.com'
// });

// Test the connection
const isConnected = await blaaiz.testConnection();
console.log('API Connected:', isConnected);
```

## Authentication

The SDK supports two authentication methods.

### OAuth 2.0 client credentials (recommended for new integrations)

Provide a `client_id` and `client_secret` and the SDK handles the OAuth
`client_credentials` flow for you: it fetches a bearer token from
`/oauth/token`, caches it in memory, and refreshes it automatically shortly
before it expires.

```javascript
const { Blaaiz } = require('blaaiz-nodejs-sdk');

const blaaiz = new Blaaiz({
  client_id: process.env.BLAAIZ_CLIENT_ID,
  client_secret: process.env.BLAAIZ_CLIENT_SECRET,
  // oauth_scope: 'wallet:read payout:create', // Optional: defaults to the full scope set
  // baseURL: 'https://api.blaaiz.com',         // Optional: defaults to dev environment
  // timeout: 30000                             // Optional: request timeout in milliseconds
});
```

When `oauth_scope` is omitted the SDK requests the full set of supported scopes.

The default set does not include `signa-id:release`. To call `blaaiz.signaId` release methods, send `oauth_scope` with that scope. See [Signa ID Release](#signa-id-release).

### API key (legacy)

API keys are still supported for existing integrations.

```javascript
const blaaiz = new Blaaiz('your-api-key-here');
// or, using the options object:
const blaaiz2 = new Blaaiz({ api_key: process.env.BLAAIZ_API_KEY });
```

When both OAuth credentials and an API key are configured, OAuth is used.

## Features

- **Customer Management**: Create, update, and manage individual and business customers, including the business KYB flow (beneficial owners and documents)
- **Collections**: Open Banking, Card, Crypto, and Interac money requests
- **Payouts**: Bank transfers, Mobile Money, Interac, ACH, Wire, and Crypto payouts across multiple currencies
- **Swaps**: Move funds between your business wallets
- **Refunds**: Refund a collection back to its source
- **Merchant reference**: Attach your own reference to payouts and collections, unique per business
- **Virtual Bank Accounts**: Create and manage virtual accounts for NGN collections
- **Wallets**: Multi-currency wallet management
- **Transactions**: Transaction history and status tracking
- **Signa**: Merchant KYC/KYB verification sessions and document collection
- **Webhooks**: Webhook configuration and management with signature verification
- **Files**: Document upload with pre-signed URLs
- **Fees**: Real-time fee calculations and breakdowns
- **Banks & Currencies**: Bank lists, mobile money operator lists, account name lookup, GBP payee and EUR IBAN verification
- **Rates**: List the exchange rates available to your business

## Supported Currencies & Methods

### Collections
- **CAD**: Interac (push mechanism)
- **NGN**: Bank Transfer (VBA) and Card Payment
- **USD**: Card Payment
- **EUR/GBP**: Open Banking

### Payouts
- **Bank Transfer**: NGN, GBP, EUR
- **Mobile Money**: KES, UGX, TZS, XOF, GHS
- **Interac**: CAD transactions
- **ACH**: USD transactions
- **Wire**: USD transactions
- **Crypto**: USDT, USDC on multiple networks

## API Reference

### Customer Management

#### Create a Customer

```javascript
const customer = await blaaiz.customers.create({
  first_name: "John",
  last_name: "Doe",
  type: "individual", // or "business"
  email: "john.doe@example.com",
  country: "NG",
  id_type: "passport", // drivers_license, passport, id_card, resident_permit
  id_number: "A12345678",
  // business_name: "Company Name" // Required if type is "business"
});

console.log('Customer ID:', customer.data.data.id);
```

> **Note**: For `individual` type, `first_name` and `last_name` are required. For `business` type, `business_name` is required instead.

#### Get Customer

```javascript
const customer = await blaaiz.customers.get('customer-id');
console.log('Customer:', customer.data);
```

#### List All Customers

```javascript
const customers = await blaaiz.customers.list();
console.log('Customers:', customers.data);
```

You can also pass optional filters and opt-in pagination. Supported filters
are `email`, `id_number`, `registration_number`, `verification_status`, and
`type`. Set `paginate: true` to receive a paginated response that includes
`links` and `meta` (with `current_page`, `total`, etc.) alongside `data`.

```javascript
const verified = await blaaiz.customers.list({
  email: 'john@example.com',
  verification_status: 'VERIFIED',
  type: 'individual',
  paginate: true
});

console.log('Page:', verified.data.meta.current_page);
console.log('Customers:', verified.data.data);
```

#### Update Customer

```javascript
const updatedCustomer = await blaaiz.customers.update('customer-id', {
  first_name: "Jane",
  email: "jane.doe@example.com"
});
```

#### List Customer Beneficiaries

```javascript
const beneficiaries = await blaaiz.customers.listBeneficiaries('customer-id');
console.log('Beneficiaries:', beneficiaries.data);
```

#### Get Specific Beneficiary

```javascript
const beneficiary = await blaaiz.customers.getBeneficiary('customer-id', 'beneficiary-id');
console.log('Beneficiary:', beneficiary.data);
```

### Verify a Customer with a Signa Session

If the person already passed a Signa session of your business, link that session to an individual customer. The person does not send their documents again.

```javascript
const result = await blaaiz.customers.linkKycSession('customer-id', 'signa-session-id');
console.log(result.data.data.verification_status); // VERIFIED
```

The call needs the `customer:write` and `compliance-kyc:pii:read` scopes. The session must be `APPROVED`, include `DOCUMENTS`, and be approved in the last 365 days. The customer details must agree with the verified person. If a condition fails, the API returns HTTP 400, 409, or 422, and the message names the condition.

On success, the customer becomes `VERIFIED` and a `customer.status_changed` webhook fires. Blaaiz then copies the verified name, date of birth, document details, and images to the customer.

### Business Customer KYB

Business-type customers verify through the KYB flow: add beneficial owners on create/update, upload each owner's ID files, then submit.

```javascript
// Upgrade a MINIMAL business customer to FULL KYB (owners required, all currencies)
await blaaiz.customers.upgradeKybScope('customer-id', {
  owners: [
    { first_name: "Jane", last_name: "Doe", ownership_percentage: 100 }
  ]
});

// Mint an upload URL for an owner's ID document, then register the uploaded file
const presigned = await blaaiz.customers.getOwnerFilePresignedUrl('customer-id', 'owner-id', {
  file_category: "id_document_front" // or "id_document_back"
});
await blaaiz.customers.uploadOwnerFiles('customer-id', 'owner-id', {
  id_document_front: presigned.data.file_id
});

// Remove an owner
await blaaiz.customers.deleteOwner('customer-id', 'owner-id');

// Submit the customer for verification
await blaaiz.customers.submit('customer-id');
```

### Business Customer Documents

KYB documents (certificate of incorporation, and similar) attach to business customers.

```javascript
// Mint an upload URL, PUT the file to it, then register the document
const presigned = await blaaiz.customers.getDocumentPresignedUrl('customer-id');

const document = await blaaiz.customers.createDocument('customer-id', {
  type: "CERTIFICATE_OF_INCORPORATION",
  name: "Certificate of Incorporation.pdf",
  file_id: presigned.data.file_id,
  description: "Optional description"
});

const documents = await blaaiz.customers.listDocuments('customer-id');
await blaaiz.customers.updateDocument('customer-id', document.data.data.id, { name: "Renamed.pdf" });
await blaaiz.customers.deleteDocument('customer-id', document.data.data.id);
```

### File Management & KYC

#### Upload Customer Documents

**Method 1: Complete File Upload (Recommended)**
```javascript
// Option A: Upload from Buffer
const result = await blaaiz.customers.uploadFileComplete('customer-id', {
  file: fileBuffer, // Buffer or Uint8Array
  file_category: 'identity', // identity, proof_of_address, liveness_check
  filename: 'passport.jpg', // Optional
  content_type: 'image/jpeg' // Optional
});

// Option B: Upload from Base64 string
const result = await blaaiz.customers.uploadFileComplete('customer-id', {
  file: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  file_category: 'identity'
});

// Option C: Upload from Data URL (with automatic content type detection)
const result = await blaaiz.customers.uploadFileComplete('customer-id', {
  file: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  file_category: 'identity'
});

// Option D: Upload from Public URL (automatically downloads and uploads)
const result = await blaaiz.customers.uploadFileComplete('customer-id', {
  file: 'https://example.com/documents/passport.jpg',
  file_category: 'identity'
});

console.log('Upload complete:', result.data);
console.log('File ID:', result.file_id);
```

**Method 2: Manual 3-Step Process**
```javascript
// Step 1: Get pre-signed URL
const presignedUrl = await blaaiz.files.getPresignedUrl({
  customer_id: 'customer-id',
  file_category: 'identity' // identity, proof_of_address, liveness_check
});

// Step 2: Upload file to the pre-signed URL (implement your file upload logic)
// const uploadResponse = await uploadFileToUrl(presignedUrl.data.url, fileBuffer);

// Step 3: Associate file with customer
const fileAssociation = await blaaiz.customers.uploadFiles('customer-id', {
  id_file: presignedUrl.data.file_id // Use the file_id from step 1
});
```

> **Note**: The `uploadFileComplete` method is recommended as it handles all three steps automatically: getting the pre-signed URL, uploading the file to S3, and associating the file with the customer. It supports multiple file input formats:
> - **Buffer/Uint8Array**: Direct binary data
> - **Base64 string**: Plain base64 encoded data
> - **Data URL**: Complete data URL with mime type (e.g., `data:image/jpeg;base64,/9j/4AAQ...`)
> - **Public URL**: HTTP/HTTPS URL that will be downloaded automatically (supports redirects, content-type detection, and filename extraction)

### Signa Merchant KYC/KYB Sessions

Signa lets a business create and manage verification sessions for its own customers. The session requirements can include `DOCUMENTS`, `SELFIE`, `FACE_MATCH`, and `PROOF_OF_ADDRESS`.

Each Signa method maps to one `/api/external/compliance/kyc/sessions` route. Validation failures are returned as HTTP 422 and unknown sessions as HTTP 404 through the SDK's normal `BlaaizError`.

#### Fulfilment mode rules

- Document uploads, the upload URL, and `submitSession` work only on `HEADLESS` sessions.
- `issueVerificationLink` works only on `HOSTED` sessions.

The API currently accepts only these combinations of `requirements` and `fulfilment_mode`. It refuses any other combination when you create the session.

| `requirements` | `fulfilment_mode` |
| --- | --- |
| `DOCUMENTS` | `HEADLESS` |
| `DOCUMENTS`, `SELFIE`, `FACE_MATCH` | `HOSTED` |
| `DOCUMENTS`, `SELFIE`, `FACE_MATCH`, `PROOF_OF_ADDRESS` | `HOSTED` |
| `DOCUMENTS`, `PROOF_OF_ADDRESS` | `HOSTED` or `HEADLESS` |
| `PROOF_OF_ADDRESS` | `HOSTED` or `HEADLESS` |

If you do not send `fulfilment_mode`, the API uses the first mode in the row for your set. The settings of your business can limit the modes that you can use.

```javascript
const session = await blaaiz.signa.createSession({
  customer_reference: 'customer-123',
  idempotency_key: 'signa-request-123',
  requirements: ['DOCUMENTS'],
  fulfilment_mode: 'HEADLESS',
  applicant: {
    first_name: 'Ada',
    last_name: 'Lovelace',
    country: 'GBR'
  }
});

const sessionId = session.data.data.id;
console.log('Session:', session.data.data);

const sessions = await blaaiz.signa.listSessions({ limit: 20, offset: 0 });
const current = await blaaiz.signa.getSession(sessionId);
```

`listSessions` accepts `limit` (1 to 100; default 20) and `offset` (0 or more; default 0).

`createSession` also accepts an optional `redirect_url`, an https URL on your site. When the person finishes on a Blaaiz-hosted verification page, the page sends the person to this URL with `session_id` added. The URL never carries the result.

#### Uploading Signa Documents

Use inline upload only for very small documents. The API can reject a request body larger than approximately 8 KB. Use the staged upload flow for every other document. Send exactly one of `content_base64` or a staged `file_name` per request.

```javascript
await blaaiz.signa.uploadSessionDocument(sessionId, {
  filename: 'passport.jpg',
  content_type: 'image/jpeg',
  id_doc_type: 'PASSPORT',
  country: 'GBR',
  content_base64: '...base64 document bytes...'
});
```

For normal-sized documents, use the staged upload flow. The upload URL response contains the exact headers that must be sent with the direct `PUT`; then register the returned `file_name` with Signa.

```javascript
const upload = await blaaiz.signa.createDocumentUploadUrl(sessionId, {
  file_name: 'passport.jpg',
  id_doc_type: 'PASSPORT'
});

// PUT the document bytes to upload.data.data.url with upload.data.data.headers.
// The URL is short-lived and its headers are part of its signature.

await blaaiz.signa.uploadSessionDocument(sessionId, {
  filename: 'passport.jpg',
  content_type: 'image/jpeg',
  id_doc_type: 'PASSPORT',
  country: 'GBR',
  file_name: upload.data.data.file_name
});
```

Submit the session once its documents are uploaded:

```javascript
await blaaiz.signa.submitSession(sessionId);
```

For a `HOSTED` session, issue or rotate the customer's verification link. This example uses a `HOSTED` set from the table above:

```javascript
const hostedSession = await blaaiz.signa.createSession({
  customer_reference: 'customer-124',
  idempotency_key: 'signa-request-124',
  requirements: ['DOCUMENTS', 'SELFIE', 'FACE_MATCH'],
  fulfilment_mode: 'HOSTED'
});

const link = await blaaiz.signa.issueVerificationLink(hostedSession.data.data.id);
console.log(link.data.data.verification_link);
```

To open a `HOSTED` session in a popup on your own page with the Signa web SDK, issue an access token from your server. Send `access_token` to your page and call `signa.startSession({ accessToken })`.

```javascript
const token = await blaaiz.signa.issueAccessToken(hostedSession.data.data.id);
const { access_token, expires_at } = token.data.data;
```

The token is valid for 30 minutes. While more than 10 minutes remain, a new call returns the same token. With 10 minutes or less, the call returns a new token, and the previous token and verification link stop working. The token is a bearer credential: do not put it in a URL and do not log it.

To stop a session that you no longer need, cancel it:

```javascript
await blaaiz.signa.cancelSession(otherSessionId);
```

#### Read captured data

`getSessionApplicantData`, `listSessionDocuments`, and `getSessionDocument` return the personal data that Signa captured during verification. They need the `compliance-kyc:pii:read` scope. Blaaiz grants this scope to a credential only on request. The SDK requests the scope by default, and the API ignores it for a credential that does not hold it. With OAuth, a token without the scope gets HTTP 403.

All three methods return HTTP 409 until the session status is `APPROVED` or `REJECTED`.

**Warning:** The response data is personal data. Do not log it and do not cache it. Every response carries `Cache-Control: no-store`.

```javascript
const applicantData = await blaaiz.signa.getSessionApplicantData(sessionId);
const applicant = applicantData.data.data; // an object, or null when no applicant data was captured

// Each item: { id, kind, document_type, document_side, content_type, available, unavailable_reason }
const documents = await blaaiz.signa.listSessionDocuments(sessionId);
const available = documents.data.data.filter((document) => document.available);

const download = await blaaiz.signa.getSessionDocument(sessionId, available[0].id);
const downloadUrl = download.data.data.url; // expires in 15 minutes
```

`getSessionDocument` returns HTTP 410 when Signa no longer retains the document. It is rate limited to 30 requests per minute and 600 requests per hour per business; the API returns HTTP 429 above those limits.

Anyone who has the download link can download the document until the link expires. Do not log the link. Do not send it to a client that you do not control.

### Signa ID Release

With Signa ID, a person who is already verified releases their data to your business in a popup. Your server creates a release request, your page opens the popup, and your server exchanges the code for the data.

The release methods need an OAuth access token with the `signa-id:release` scope. API keys cannot call them. No scope bundle contains this scope, so select it by name when you create the credential. Signa ID release must also be enabled for your business.

**Note:** The SDK does not request `signa-id:release` by default. Send `oauth_scope` with that scope, preferably on a dedicated credential.

```javascript
const signaIdClient = new Blaaiz({
  client_id: process.env.BLAAIZ_SIGNA_ID_CLIENT_ID,
  client_secret: process.env.BLAAIZ_SIGNA_ID_CLIENT_SECRET,
  oauth_scope: 'signa-id:release'
});

// 1. Create the request. Send request_token to your page.
const created = await signaIdClient.signaId.createReleaseRequest({
  idempotency_key: 'release-user-10482',
  purpose: 'Open your trading account',
  scopes: ['identity', 'id_document', 'document_images'], // also: 'address'
  origin: 'https://yourapp.com', // the exact window.location.origin of your page
  reference: 'user_10482' // optional
});
const { id: releaseId, request_token } = created.data.data;

// 2. In your page: const { code } = await signa.requestData({ requestToken })

// 3. Exchange the code from your server. The code works one time, for 5 minutes.
const exchanged = await signaIdClient.signaId.exchangeReleaseCode(code);
const { release, data } = exchanged.data.data; // check that release.id === releaseId

// Read the release again during the 30-day access window
const current = await signaIdClient.signaId.getRelease(releaseId);

// Download one document image. The URL expires in 15 minutes.
const image = await signaIdClient.signaId.getReleaseDocument(releaseId, data.document_images[0].id);
```

The release request expires 30 minutes after the create. `getRelease` returns `data` as `null` before the exchange and when `release.access.status` is not `ACTIVE`. Each create and exchange endpoint allows 30 requests each minute for each business.

**Warning:** The released data is personal data. Do not log it and do not cache it.

To check if a wallet belongs to a verified Signa ID, call `getWalletStatus`. The endpoint needs no authentication and returns no personal data.

```javascript
const status = await blaaiz.signaId.getWalletStatus('0x1234...abcd', { chain_id: 8453 });
console.log(status.data.verified, status.data.level);
```

The wallet status response is at the root of the body, with no `message` and no `data` wrapper.

### Collections

#### Initiate Open Banking Collection (EUR/GBP)

```javascript
const collection = await blaaiz.collections.initiate({
  method: "open_banking",
  amount: 100.00,
  wallet_id: "wallet-id",
  customer_id: "customer-id", // Optional for open_banking
  phone: "+1234567890", // Optional
  redirect_url: "https://your-site.com/callback", // Optional (HTTPS)
  merchant_reference: "ORDER-1001" // Optional; your own reference, unique per business
});

console.log('Payment URL:', collection.data.url);
console.log('Transaction ID:', collection.data.transaction_id);
```

#### Initiate Card Collection (NGN/USD)

```javascript
const collection = await blaaiz.collections.initiate({
  method: "card",
  amount: 5000,
  wallet_id: "wallet-id",
  customer_id: "customer-id", // Required for card
  card_holder_name: "John Doe",
  card_number: "5123450000000008",
  expiry: "12/30", // MM/YY
  cvc: "123",
  merchant_reference: "ORDER-1002" // Optional; unique per business
});

console.log('Payment URL:', collection.data.url);
```

#### Accept Interac Money Request (CAD)

```javascript
// With security answer (standard transfer)
const interac = await blaaiz.collections.acceptInteracMoneyRequest({
  reference_number: "interac-reference",
  security_answer: "answer",
  email: "sender@example.com" // Optional
});

// Auto deposit (no security answer required)
const interacAutoDeposit = await blaaiz.collections.acceptInteracMoneyRequest({
  reference_number: "interac-reference"
});

console.log('Message:', interac.data.message);
```

#### Crypto Collection

```javascript
// Get available networks
const networks = await blaaiz.collections.getCryptoNetworks();
console.log('Available networks:', networks.data);

// Initiate crypto collection
const cryptoCollection = await blaaiz.collections.initiateCrypto({
  amount: 100,
  network: "ethereum",
  token: "USDT",
  wallet_id: "wallet-id"
});
```

#### Attach Customer to Collection

```javascript
const attachment = await blaaiz.collections.attachCustomer({
  customer_id: "customer-id",
  transaction_id: "transaction-id"
});
```

#### Initiate Interac Money Request (CAD)

```javascript
const request = await blaaiz.collections.initiateInteracMoneyRequest({
  amount: 100,
  email: "payer@example.com", // The payer receives the Interac request here
  customer_name: "Jane Doe", // Optional
  customer_id: "customer-id", // Optional
  expiry_hours: 24, // Optional (1-120)
  note: "Invoice 77" // Optional
});

console.log('Transaction ID:', request.data.transaction_id);
console.log('Reference:', request.data.reference);
console.log('Expires at:', request.data.expires_at);
```

### Payouts

#### Bank Transfer Payout (NGN)

```javascript
const payout = await blaaiz.payouts.initiate({
  wallet_id: "wallet-id",
  customer_id: "customer-id",
  method: "bank_transfer",
  from_amount: 1000, // Use from_amount OR to_amount
  from_currency_id: "NGN",
  to_currency_id: "NGN",
  bank_id: "bank-id", // Required for NGN
  account_number: "0123456789",
  phone_number: "+2348012345678", // Optional
  note: "Acme Ltd", // Optional — appears in the transaction description; defaults to business name
  merchant_reference: "ORDER-1001" // Optional; your own reference, unique per business
});

console.log('Payout Status:', payout.data.transaction.status);
console.log('Merchant Reference:', payout.data.transaction.merchant_reference);
```

#### Passing additional fields

`payouts.initiate()` forwards the entire payload verbatim to the API, so any field documented in the [Blaaiz API reference](https://docs.business.blaaiz.com) can be included even if it isn't listed in this README. For example, `note` sets the transaction description (defaulting to the business name when omitted). This means the SDK stays compatible with new API fields without requiring an update here.

#### Bank Transfer Payout (GBP)

```javascript
const gbpPayout = await blaaiz.payouts.initiate({
  wallet_id: "wallet-id",
  customer_id: "customer-id",
  method: "bank_transfer",
  from_amount: 100,
  from_currency_id: "GBP",
  to_currency_id: "GBP",
  sort_code: "123456",
  account_number: "12345678",
  account_name: "John Doe"
});
```

#### Bank Transfer Payout (EUR)

```javascript
const eurPayout = await blaaiz.payouts.initiate({
  wallet_id: "wallet-id",
  customer_id: "customer-id",
  method: "bank_transfer",
  from_amount: 100,
  from_currency_id: "EUR",
  to_currency_id: "EUR",
  iban: "DE89370400440532013000",
  bic_code: "COBADEFFXXX",
  account_name: "John Doe"
});
```

#### Mobile Money Payout (KES, UGX, TZS, XOF, GHS)

Use `mobile_money` when the destination currency supports it. Get the `mobile_money_operator_id` from `momoOperators.list()`.

```javascript
const momoPayout = await blaaiz.payouts.initiate({
  wallet_id: "wallet-id",
  customer_id: "customer-id",
  method: "mobile_money",
  from_amount: 100,
  from_currency_id: "USD",
  to_currency_id: "currency-id", // The currency ID, not the code
  phone_number: "+254700000000", // International format, starts with +
  mobile_money_operator_id: "operator-id", // Required
  account_name: "Jane Doe" // Required
});
```

Use the currency ID for `to_currency_id`. XOF exists for more than one country (Benin and Côte d'Ivoire), so the API rejects the code `XOF` alone unless you also send `country_id` to pick the country.

In the payout response and in webhooks, the recipient shows the phone number in `account_number` and the operator name in `bank_name`. The payout response also shows the operator code in `bank_code`.

#### Interac Payout (CAD)

```javascript
const interacPayout = await blaaiz.payouts.initiate({
  wallet_id: "wallet-id",
  customer_id: "customer-id",
  method: "interac",
  from_amount: 100,
  from_currency_id: "CAD",
  to_currency_id: "CAD",
  email: "recipient@example.com",
  interac_first_name: "John",
  interac_last_name: "Doe"
});
```

#### ACH Payout (USD)

```javascript
const achPayout = await blaaiz.payouts.initiate({
  wallet_id: "wallet-id",
  customer_id: "customer-id",
  method: "ach",
  from_amount: 100,
  from_currency_id: "USD",
  to_currency_id: "USD",
  type: "individual", // individual or business
  account_number: "123456789",
  account_name: "John Doe",
  account_type: "checking", // checking or savings
  bank_name: "Chase Bank",
  routing_number: "021000021"
});
```

#### Wire Payout (USD)

```javascript
const wirePayout = await blaaiz.payouts.initiate({
  wallet_id: "wallet-id",
  customer_id: "customer-id",
  method: "wire",
  from_amount: 1000,
  from_currency_id: "USD",
  to_currency_id: "USD",
  type: "individual",
  account_number: "123456789",
  account_name: "John Doe",
  account_type: "checking",
  bank_name: "Chase Bank",
  routing_number: "021000021",
  swift_code: "CHASUS33"
});
```

#### Crypto Payout

```javascript
const cryptoPayout = await blaaiz.payouts.initiate({
  wallet_id: "wallet-id",
  customer_id: "customer-id",
  method: "crypto",
  from_amount: 100,
  from_currency_id: "USD",
  to_currency_id: "USDT",
  wallet_address: "0x1234567890abcdef...",
  wallet_token: "USDT", // USDT or USDC
  wallet_network: "ETHEREUM_MAINNET" // BSC_MAINNET, ETHEREUM_MAINNET, TRON_MAINNET, MATIC_MAINNET
});
```

#### Using to_amount Instead of from_amount

You can specify the exact amount the recipient should receive:

```javascript
const payout = await blaaiz.payouts.initiate({
  wallet_id: "wallet-id",
  customer_id: "customer-id",
  method: "bank_transfer",
  to_amount: 50000, // Recipient gets exactly this amount
  from_currency_id: "USD",
  to_currency_id: "NGN",
  bank_id: "bank-id",
  account_number: "0123456789"
});
```

### Swaps

Swap funds between two of your business wallets.

```javascript
const swap = await blaaiz.swaps.initiate({
  from_business_wallet_id: "ngn-wallet-id",
  to_business_wallet_id: "usd-wallet-id",
  amount: 100000,
  amount_type: "from" // "from" (default) = amount leaves source; "to" = amount lands in destination
});

console.log('Swap:', swap.data.business_swap_transaction);
```

### Refunds

Refund an API collection back to its source.

```javascript
const refund = await blaaiz.refunds.initiate({
  transaction_id: "collection-transaction-id",
  reason: "Customer request", // Optional
  reference: "your-refund-reference" // Optional, unique per business
});

console.log('Refund status:', refund.data.data.status);

// Retrieve a refund later
const existing = await blaaiz.refunds.get('refund-id');
```

### Rates

```javascript
const rates = await blaaiz.rates.list();

// Filter by pair
const filtered = await blaaiz.rates.list({ search_term: "USD_NGN" });
```

### Virtual Bank Accounts

#### Create Virtual Bank Account

```javascript
const vba = await blaaiz.virtualBankAccounts.create({
  wallet_id: "wallet-id",
  account_name: "John Doe"
});

console.log('Account Number:', vba.data.account_number);
console.log('Bank Name:', vba.data.bank_name);
```

#### List Virtual Bank Accounts

You can optionally filter by `wallet_id`, `customer_id`, or both.

```javascript
// All virtual bank accounts
const vbas = await blaaiz.virtualBankAccounts.list();

// Filter by wallet
const vbasByWallet = await blaaiz.virtualBankAccounts.list("wallet-id");

// Filter by customer
const vbasByCustomer = await blaaiz.virtualBankAccounts.list(null, "customer-id");

// Filter by both wallet and customer
const vbasByBoth = await blaaiz.virtualBankAccounts.list("wallet-id", "customer-id");

console.log('Virtual Accounts:', vbas.data);
```

#### Close Virtual Bank Account

```javascript
// Close without reason
const closed = await blaaiz.virtualBankAccounts.close("vba-id");

// Close with reason
const closedWithReason = await blaaiz.virtualBankAccounts.close("vba-id", "No longer needed");

console.log('Status:', closed.data.status);
```

#### Get Identification Type

Retrieve the expected identification type label based on country and customer type. This is useful for determining what identification documents are required for a customer.

```javascript
// Using customer_id (recommended if customer already exists)
const idType = await blaaiz.virtualBankAccounts.getIdentificationType("customer-id");
console.log('Required ID:', idType.data.label); // e.g., "Bank Verification Number"
console.log('Type:', idType.data.type); // e.g., "bvn"

// Using country and type (for new customers)
const idTypeNew = await blaaiz.virtualBankAccounts.getIdentificationType(null, "NG", "individual");
console.log('Required ID:', idTypeNew.data.label);
```

### Wallets

#### List All Wallets

```javascript
const wallets = await blaaiz.wallets.list();
console.log('Wallets:', wallets.data);
```

#### Get Specific Wallet

```javascript
const wallet = await blaaiz.wallets.get("wallet-id");
console.log('Wallet Balance:', wallet.data.balance);
```

### Transactions

#### List Transactions

```javascript
const transactions = await blaaiz.transactions.list({
  page: 1,
  limit: 10,
  status: "SUCCESSFUL" // Optional filter
});

console.log('Transactions:', transactions.data);
```

#### Get Transaction Details

```javascript
const transaction = await blaaiz.transactions.get("transaction-id");
console.log('Transaction:', transaction.data);
```

The response body contains the transaction in `data`. For a collection, `source_information` shows who sent the funds. A key is `null` when the collection method does not supply it.

```javascript
const { source_information: payer } = transaction.data.data;
console.log('Payer:', payer.account_name, payer.account_number, payer.bank_name);
```

### Banks & Currencies

#### List Banks

```javascript
const banks = await blaaiz.banks.list();
console.log('Available Banks:', banks.data);
```

#### List Mobile Money Operators

```javascript
// Filter by the destination currency ID (preferred)
const operators = await blaaiz.momoOperators.list({ currency_id: "currency-id" });

// Or filter by country
const countryOperators = await blaaiz.momoOperators.list({ country_id: 1 });

console.log('Operators:', operators.data); // [{ id, name, code, country_id }]
```

Both filters are optional. Use the `id` of an operator as `mobile_money_operator_id` in a mobile money payout.

#### Bank Account Lookup

```javascript
const accountInfo = await blaaiz.banks.lookupAccount({
  account_number: "0123456789",
  bank_id: "1"
});

console.log('Account Name:', accountInfo.data.account_name);
```

#### Verify a GBP Payee (Confirmation of Payee)

```javascript
const result = await blaaiz.banks.verifyPayee({
  sort_code: "123456",
  account_number: "12345678",
  account_name: "Jane Doe"
});

console.log('Matched:', result.data.matched);
```

#### Verify an EUR IBAN (SEPA reachability)

```javascript
const result = await blaaiz.banks.verifyIban({
  iban: "DE89370400440532013000"
});

console.log('SEPA reachable:', result.data.sepa_reachable);
```

#### List Currencies

```javascript
const currencies = await blaaiz.currencies.list();
console.log('Supported Currencies:', currencies.data);
```

Each currency also includes `country_id` and a `country` object (`id`, `name`, `short_name`, `alt_short_name`). Use them to tell apart currencies that exist for more than one country, such as XOF.

### Fees

#### Get Fee Breakdown

```javascript
// Using from_amount (calculate what recipient gets)
const feeBreakdown = await blaaiz.fees.getBreakdown({
  from_currency_id: "NGN",
  to_currency_id: "CAD",
  from_amount: 100000
});

console.log('You send:', feeBreakdown.data.you_send);
console.log('Recipient gets:', feeBreakdown.data.recipient_gets);
console.log('Total fees:', feeBreakdown.data.total_fees);

// Using to_amount (calculate what you need to send)
const feeBreakdownReverse = await blaaiz.fees.getBreakdown({
  from_currency_id: "USD",
  to_currency_id: "NGN",
  to_amount: 50000 // Recipient should get exactly this
});

console.log('You send:', feeBreakdownReverse.data.you_send);
```

### Webhooks

#### Register Webhooks

```javascript
const webhook = await blaaiz.webhooks.register({
  collection_url: "https://your-domain.com/webhooks/collection",
  payout_url: "https://your-domain.com/webhooks/payout",
  kyc_url: "https://your-domain.com/webhooks/kyc" // Optional Signa callback
});
```

On `webhooks.update`, `kyc_url` is also optional. If you do not send `kyc_url`, the API keeps the current value. To remove the value, send `kyc_url: null`.

#### Get Webhook Configuration

```javascript
const webhookConfig = await blaaiz.webhooks.get();
console.log('Webhook URLs:', webhookConfig.data);
```

#### Verify Signa Webhooks

Signa and Signa ID callbacks go to your `kyc_url`. The events are `merchant.kyc.session.completed`, `merchant.kyc.session.expired`, and `signa_id.grant.revoked`. After `signa_id.grant.revoked`, the release methods return no data for `data.release_id`.

Signa callbacks use the same `x-blaaiz-timestamp` and `x-blaaiz-signature` headers and HMAC-SHA256 scheme as collection and payout webhooks. Keep the request body raw, then reuse `constructEvent` (or `verifySignature`) from `WebhookService`.

```javascript
app.use('/webhooks', express.raw({ type: 'application/json' }));

app.post('/webhooks/kyc', (req, res) => {
  const payload = req.body.toString();
  const signature = req.headers['x-blaaiz-signature'];
  const timestamp = req.headers['x-blaaiz-timestamp'];

  try {
    const event = blaaiz.webhooks.constructEvent(
      payload,
      signature,
      timestamp,
      process.env.BLAAIZ_WEBHOOK_SECRET
    );

    console.log('Verified Signa event:', event);
    res.status(200).json({ received: true });
  } catch (error) {
    res.status(400).json({ error: 'Invalid signature' });
  }
});
```

#### Replay Webhook

```javascript
const replay = await blaaiz.webhooks.replay({
  transaction_id: "transaction-id"
});
```

#### Simulate Interac Webhook (Non-Production Only)

```javascript
// For testing Interac webhooks in development/sandbox environment
const simulate = await blaaiz.webhooks.simulateInteracWebhook({
  interac_email: "sender@example.com"
});

console.log('Message:', simulate.message);
```

## Advanced Usage

### Complete Payout Workflow

```javascript
const completePayoutResult = await blaaiz.createCompletePayout({
  customerData: {
    first_name: "John",
    last_name: "Doe",
    type: "individual",
    email: "john@example.com",
    country: "NG",
    id_type: "passport",
    id_number: "A12345678"
  },
  payoutData: {
    wallet_id: "wallet-id",
    method: "bank_transfer",
    from_amount: 1000,
    from_currency_id: "NGN",
    to_currency_id: "NGN",
    account_number: "0123456789",
    bank_id: "bank-id",
    phone_number: "+2348012345678"
  }
});

console.log('Customer ID:', completePayoutResult.customer_id);
console.log('Payout:', completePayoutResult.payout);
console.log('Fees:', completePayoutResult.fees);
```

### Complete Collection Workflow

```javascript
const completeCollectionResult = await blaaiz.createCompleteCollection({
  customerData: {
    first_name: "Jane",
    last_name: "Smith",
    type: "individual",
    email: "jane@example.com",
    country: "NG",
    id_type: "drivers_license",
    id_number: "ABC123456"
  },
  collectionData: {
    method: "open_banking",
    amount: 5000,
    wallet_id: "wallet-id"
  },
  createVBA: true // Optionally create a virtual bank account
});

console.log('Customer ID:', completeCollectionResult.customer_id);
console.log('Collection:', completeCollectionResult.collection);
console.log('Virtual Account:', completeCollectionResult.virtual_account);
```

## Error Handling

The SDK uses a custom `BlaaizError` class that provides detailed error information:

```javascript
try {
  const customer = await blaaiz.customers.create(invalidData);
} catch (error) {
  if (error instanceof BlaaizError) {
    console.error('Blaaiz API Error:', error.message);
    console.error('Status Code:', error.status);
    console.error('Error Code:', error.code);
  } else {
    console.error('Unexpected Error:', error.message);
  }
}
```

## Rate Limiting

The Blaaiz API has a rate limit of 100 requests per minute. The SDK automatically includes rate limit headers in responses:

- `X-RateLimit-Limit`: Maximum requests per minute
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: When the rate limit resets

## Webhook Handling

### Webhook Signature Verification

The SDK provides built-in webhook signature verification to ensure webhook authenticity. The signature is computed using HMAC-SHA256 with the format `timestamp.payload`.

> **Important:** `payload` must be the **raw request body string** exactly as received. Do not pass a parsed object — parsing and re-serializing (e.g. `JSON.stringify`) changes the bytes and will break signature verification. Capture the raw body with `express.raw({ type: 'application/json' })` and pass `req.body.toString()` (see the Express example below).

```javascript
const { Blaaiz } = require('blaaiz-nodejs-sdk');

const blaaiz = new Blaaiz('your-api-key');

// Method 1: Verify signature manually
const isValid = blaaiz.webhooks.verifySignature(
  payload,        // Raw request body string (do not pass a parsed object)
  signature,      // Signature from webhook headers (x-blaaiz-signature)
  timestamp,      // Timestamp from webhook headers (x-blaaiz-timestamp)
  webhookSecret   // Your webhook secret key
);

if (isValid) {
  console.log('Webhook signature is valid');
} else {
  console.log('Invalid webhook signature');
}

// Method 2: Construct verified event (recommended)
try {
  const event = blaaiz.webhooks.constructEvent(
    payload,        // Raw request body string (do not pass a parsed object)
    signature,      // Signature from webhook headers
    timestamp,      // Timestamp from webhook headers
    webhookSecret   // Your webhook secret key
  );

  console.log('Verified event:', event);
  // event.verified will be true
  // event.timestamp will contain verification timestamp
} catch (error) {
  console.error('Webhook verification failed:', error.message);
}
```

### Complete Express.js Webhook Handler

```javascript
const express = require('express');
const { Blaaiz } = require('blaaiz-nodejs-sdk');

const app = express();
const blaaiz = new Blaaiz('your-api-key');

// Webhook secret (get this from your Blaaiz dashboard)
const WEBHOOK_SECRET = process.env.BLAAIZ_WEBHOOK_SECRET;

// Middleware to capture raw body for signature verification
app.use('/webhooks', express.raw({ type: 'application/json' }));

// Collection webhook with signature verification
app.post('/webhooks/collection', (req, res) => {
  const signature = req.headers['x-blaaiz-signature'];
  const timestamp = req.headers['x-blaaiz-timestamp'];
  const payload = req.body.toString();

  try {
    // Verify webhook signature and construct event
    const event = blaaiz.webhooks.constructEvent(payload, signature, timestamp, WEBHOOK_SECRET);

    console.log('Verified collection event:', {
      transaction_id: event.transaction_id,
      status: event.status,
      amount: event.amount,
      currency: event.currency,
      verified: event.verified
    });

    // Process the collection
    // Update your database, send notifications, etc.

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook verification failed:', error.message);
    res.status(400).json({ error: 'Invalid signature' });
  }
});

// Payout webhook with signature verification
app.post('/webhooks/payout', (req, res) => {
  const signature = req.headers['x-blaaiz-signature'];
  const timestamp = req.headers['x-blaaiz-timestamp'];
  const payload = req.body.toString();

  try {
    // Verify webhook signature and construct event
    const event = blaaiz.webhooks.constructEvent(payload, signature, timestamp, WEBHOOK_SECRET);

    console.log('Verified payout event:', {
      transaction_id: event.transaction_id,
      status: event.status,
      recipient: event.recipient,
      verified: event.verified
    });

    // Process the payout completion
    // Update your database, send notifications, etc.

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook verification failed:', error.message);
    res.status(400).json({ error: 'Invalid signature' });
  }
});

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});
```

### Manual Signature Verification (Alternative)

If you prefer manual verification:

```javascript
app.post('/webhooks/collection', (req, res) => {
  const signature = req.headers['x-blaaiz-signature'];
  const timestamp = req.headers['x-blaaiz-timestamp'];
  const payload = req.body.toString();

  // Verify signature manually
  const isValid = blaaiz.webhooks.verifySignature(payload, signature, timestamp, WEBHOOK_SECRET);

  if (!isValid) {
    console.error('Invalid webhook signature');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Parse payload manually
  const event = JSON.parse(payload);
  console.log('Collection received:', event);

  res.status(200).json({ received: true });
});
```

## Environment Configuration

The SDK defaults to the development environment. To use different environments:

```javascript
// Development (default)
const blaaizDev = new Blaaiz('dev-api-key');
// OR explicitly specify dev URL
const blaaizDev = new Blaaiz('dev-api-key', {
  baseURL: 'https://api-dev.blaaiz.com'
});

// Production
const blaaizProd = new Blaaiz('prod-api-key', {
  baseURL: 'https://api.blaaiz.com'
});

// Staging (if available)
const blaaizStaging = new Blaaiz('staging-api-key', {
  baseURL: 'https://api-staging.blaaiz.com'
});
```

### Environment Variables Approach (Recommended)

```javascript
const { Blaaiz } = require('blaaiz-nodejs-sdk');

const blaaiz = new Blaaiz(process.env.BLAAIZ_API_KEY, {
  baseURL: process.env.BLAAIZ_API_URL || 'https://api-dev.blaaiz.com'
});
```

**Environment Variables:**
- `BLAAIZ_API_KEY` - Your API key
- `BLAAIZ_API_URL` - API base URL (optional, defaults to dev)
- `BLAAIZ_WEBHOOK_SECRET` - Webhook secret for signature verification
- `BLAAIZ_TEST_WALLET_ID` - Test wallet ID for integration tests (optional)

**.env file example:**
```bash
# Development
BLAAIZ_API_KEY=your-dev-api-key
BLAAIZ_API_URL=https://api-dev.blaaiz.com
BLAAIZ_WEBHOOK_SECRET=your-webhook-secret
BLAAIZ_TEST_WALLET_ID=your-test-wallet-id

# Production
# BLAAIZ_API_KEY=your-prod-api-key
# BLAAIZ_API_URL=https://api.blaaiz.com
# BLAAIZ_WEBHOOK_SECRET=your-prod-webhook-secret
```

## Best Practices

1. **Always validate customer data before creating customers**
2. **Use the fees API to calculate and display fees to users**
3. **Always verify webhook signatures using the SDK's built-in methods**
4. **Store customer IDs and transaction IDs for tracking**
5. **Handle rate limiting gracefully with exponential backoff**
6. **Use environment variables for API keys and webhook secrets**
7. **Implement proper error handling and logging**
8. **Test webhook endpoints thoroughly with signature verification**
9. **Use raw body parsing for webhook endpoints to preserve signature integrity**
10. **Return appropriate HTTP status codes from webhook handlers (200 for success, 400 for invalid signatures)**

## Support

For support and additional documentation:
- Email: onboarding@blaaiz.com
- Documentation: https://docs.business.blaaiz.com

## License

This SDK is provided under the MIT License
