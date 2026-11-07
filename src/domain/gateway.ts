/**
 * BlaaizGateway Interface
 * Standard abstraction for communicating with Blaaiz RaaS API.
 * Implemented by RealBlaaizGateway (blaaiz-nodejs-sdk) and MockBlaaizGateway (in-memory simulator).
 */

export interface CurrencyItem {
  id: string;
  name: string;
  code: string;
  status: string;
}

export interface FeeBreakdownResult {
  you_send: number;
  total_amount_to_send: number;
  recipient_gets: number;
  total_fees: number;
  exchange_rate: number;
  collection_fees?: any[];
  payout_fees?: any[];
}

export interface BankItem {
  id: string;
  name: string;
  code: string;
  country: string;
}

export interface BankAccountLookupResult {
  account_name: string;
  account_number: string;
  bank_name: string;
}

export interface PayeeVerificationResult {
  verified: boolean;
  account_name_matched: boolean;
  message: string;
}

export interface IbanVerificationResult {
  verified: boolean;
  bank_name?: string;
  country?: string;
  message: string;
}

export interface CustomerInput {
  first_name: string;
  last_name: string;
  type: "individual" | "business";
  email: string;
  country: string;
  id_type: "drivers_license" | "passport" | "id_card" | "resident_permit" | "certificate_of_incorporation";
  id_number: string;
}

export interface CustomerResult extends CustomerInput {
  id: string;
  business_id: string;
  verification_status: "PENDING" | "PROCESSING" | "VERIFIED" | "REJECTED";
}

export interface PayoutInput {
  wallet_id: string;
  customer_id: string;
  method: "bank_transfer" | "interac" | "ach" | "wire" | "crypto" | "mobile_money";
  from_currency_id: string;
  to_currency_id: string;
  from_amount?: number;
  to_amount?: number;
  amount?: number;
  country_id?: string;
  type?: "business" | "individual";
  phone_number?: string;
  email?: string;
  interac_first_name?: string;
  interac_last_name?: string;
  bank_id?: string;
  account_number?: string;
  account_name?: string;
  account_type?: "savings" | "checking";
  bank_name?: string;
  routing_number?: string;
  swift_code?: string;
  sort_code?: string;
  iban?: string;
  bic_code?: string;
  note?: string;
  merchant_reference?: string;
}

export interface TransactionResult {
  id: string;
  business_id: string;
  business_customer_id: string | null;
  business_wallet_id: string | null;
  status: "PENDING" | "PROCESSING" | "SUCCESSFUL" | "FAILED" | "EXPIRED" | "REVERSED" | "CANCELLED" | "AWAITING_APPROVAL";
  type: string;
  reference: string | null;
  merchant_reference: string | null;
  currency: string;
  amount: number;
  amount_without_fee: number;
  fee: number;
  rate: number | null;
  date: string;
  recipient?: {
    account_number: string | null;
    account_name: string | null;
    amount: number | null;
    currency: string | null;
    bank_name: string | null;
  } | null;
}

export interface VirtualBankAccountResult {
  id: string;
  account_number: string;
  account_name: string;
  bank_name: string;
  bank_code: string;
  wallet_id: string;
}

export interface GatewayCallRecord {
  timestamp: string;
  method: string;
  endpoint: string;
  mode: "LIVE" | "MOCK";
  requestPayload: any;
  responsePayload: any;
  status: number;
  durationMs: number;
}

export interface BlaaizGateway {
  readonly mode: "live" | "mock";

  testConnection(): Promise<boolean>;
  getCurrencies(): Promise<CurrencyItem[]>;
  getFeeBreakdown(params: {
    from_currency_id: string;
    to_currency_id: string;
    from_amount: number;
  }): Promise<FeeBreakdownResult>;
  lookupBankAccount(accountNumber: string, bankId: string): Promise<BankAccountLookupResult>;
  verifyPayee(params: {
    sort_code: string;
    account_number: string;
    account_name: string;
  }): Promise<PayeeVerificationResult>;
  verifyIban(params: { iban: string }): Promise<IbanVerificationResult>;
  createCustomer(data: CustomerInput): Promise<CustomerResult>;
  initiatePayout(data: PayoutInput): Promise<{ message: string; transaction: TransactionResult }>;
  getTransaction(transactionId: string): Promise<TransactionResult>;
  createVirtualBankAccount(params: {
    wallet_id: string;
    account_name?: string;
  }): Promise<VirtualBankAccountResult>;
  verifyWebhookSignature(payload: string, signature: string, timestamp: string, secret: string): boolean;
  constructWebhookEvent(payload: string, signature: string, timestamp: string, secret: string): any;
  getCallLogs(): GatewayCallRecord[];
}
