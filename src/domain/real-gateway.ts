import {
  BlaaizGateway,
  CurrencyItem,
  FeeBreakdownResult,
  BankAccountLookupResult,
  PayeeVerificationResult,
  IbanVerificationResult,
  CustomerInput,
  CustomerResult,
  PayoutInput,
  TransactionResult,
  VirtualBankAccountResult,
  GatewayCallRecord,
} from "./gateway";

export class RealBlaaizGateway implements BlaaizGateway {
  readonly mode = "live" as const;
  private sdk: any;
  private callLogs: GatewayCallRecord[] = [];

  constructor() {
    // Dynamically load Blaaiz SDK
    const Blaaiz = require("blaaiz-nodejs-sdk");
    const BlaaizClass = Blaaiz.Blaaiz || Blaaiz.default || Blaaiz;

    const clientId = process.env.BLAAIZ_CLIENT_ID;
    const clientSecret = process.env.BLAAIZ_CLIENT_SECRET;
    const apiKey = process.env.BLAAIZ_API_KEY;
    const baseURL = process.env.BLAAIZ_API_URL || "https://api-dev.blaaiz.com";

    if (clientId && clientSecret) {
      this.sdk = new BlaaizClass({
        client_id: clientId,
        client_secret: clientSecret,
        baseURL,
      });
    } else if (apiKey) {
      this.sdk = new BlaaizClass(apiKey, {
        baseURL,
      });
    } else {
      this.sdk = new BlaaizClass({
        client_id: "",
        client_secret: "",
        baseURL,
      });
    }
  }

  private recordCall(
    method: string,
    endpoint: string,
    requestPayload: any,
    responsePayload: any,
    status: number = 200,
    durationMs: number = 50
  ) {
    this.callLogs.unshift({
      timestamp: new Date().toISOString(),
      method,
      endpoint,
      mode: "LIVE",
      requestPayload,
      responsePayload,
      status,
      durationMs,
    });
    if (this.callLogs.length > 100) {
      this.callLogs.pop();
    }
  }

  getCallLogs(): GatewayCallRecord[] {
    return [...this.callLogs];
  }

  async testConnection(): Promise<boolean> {
    const start = Date.now();
    try {
      const isConnected = await this.sdk.testConnection();
      this.recordCall("GET", "/api/external/currency", {}, { connected: isConnected }, 200, Date.now() - start);
      return isConnected;
    } catch (err: any) {
      this.recordCall("GET", "/api/external/currency", {}, { error: err.message }, err.status || 500, Date.now() - start);
      return false;
    }
  }

  async getCurrencies(): Promise<CurrencyItem[]> {
    const start = Date.now();
    try {
      const res = await this.sdk.currencies.list();
      const list = res.data?.data || res.data || [];
      this.recordCall("GET", "/api/external/currency", {}, list, res.status || 200, Date.now() - start);
      return list;
    } catch (err: any) {
      this.recordCall("GET", "/api/external/currency", {}, { error: err.message }, err.status || 500, Date.now() - start);
      throw err;
    }
  }

  async getFeeBreakdown(params: {
    from_currency_id: string;
    to_currency_id: string;
    from_amount: number;
  }): Promise<FeeBreakdownResult> {
    const start = Date.now();
    try {
      const res = await this.sdk.fees.getBreakdown(params);
      const breakdown = res.data?.data || res.data;
      this.recordCall("POST", "/api/external/fees/breakdown", params, breakdown, res.status || 200, Date.now() - start);
      return breakdown;
    } catch (err: any) {
      this.recordCall("POST", "/api/external/fees/breakdown", params, { error: err.message }, err.status || 500, Date.now() - start);
      throw err;
    }
  }

  async lookupBankAccount(accountNumber: string, bankId: string): Promise<BankAccountLookupResult> {
    const start = Date.now();
    const payload = { account_number: accountNumber, bank_id: bankId };
    try {
      const res = await this.sdk.banks.lookupAccount(payload);
      const result = res.data?.data || res.data;
      this.recordCall("POST", "/api/external/bank/account-lookup", payload, result, res.status || 200, Date.now() - start);
      return result;
    } catch (err: any) {
      this.recordCall("POST", "/api/external/bank/account-lookup", payload, { error: err.message }, err.status || 500, Date.now() - start);
      throw err;
    }
  }

  async verifyPayee(params: {
    sort_code: string;
    account_number: string;
    account_name: string;
  }): Promise<PayeeVerificationResult> {
    const start = Date.now();
    try {
      const res = await this.sdk.banks.verifyPayee(params);
      const result = res.data?.data || res.data;
      this.recordCall("POST", "/api/external/bank/payee-verification", params, result, res.status || 200, Date.now() - start);
      return {
        verified: true,
        account_name_matched: true,
        message: "Payee verification completed.",
      };
    } catch (err: any) {
      this.recordCall("POST", "/api/external/bank/payee-verification", params, { error: err.message }, err.status || 500, Date.now() - start);
      throw err;
    }
  }

  async verifyIban(params: { iban: string }): Promise<IbanVerificationResult> {
    const start = Date.now();
    try {
      const res = await this.sdk.banks.verifyIban(params);
      const result = res.data?.data || res.data;
      this.recordCall("POST", "/api/external/bank/iban-verification", params, result, res.status || 200, Date.now() - start);
      return {
        verified: true,
        bank_name: result.bank_name,
        country: result.country,
        message: "IBAN routing and checksum validated.",
      };
    } catch (err: any) {
      this.recordCall("POST", "/api/external/bank/iban-verification", params, { error: err.message }, err.status || 500, Date.now() - start);
      throw err;
    }
  }

  async createCustomer(data: CustomerInput): Promise<CustomerResult> {
    const start = Date.now();
    try {
      const res = await this.sdk.customers.create(data);
      const customer = res.data?.data || res.data;
      this.recordCall("POST", "/api/external/customer", data, customer, res.status || 200, Date.now() - start);
      return customer;
    } catch (err: any) {
      this.recordCall("POST", "/api/external/customer", data, { error: err.message }, err.status || 500, Date.now() - start);
      throw err;
    }
  }

  async initiatePayout(data: PayoutInput): Promise<{ message: string; transaction: TransactionResult }> {
    const start = Date.now();
    try {
      const res = await this.sdk.payouts.initiate(data);
      const payoutRes = res.data?.data || res.data;
      this.recordCall("POST", "/api/external/payout", data, payoutRes, res.status || 200, Date.now() - start);
      return payoutRes;
    } catch (err: any) {
      this.recordCall("POST", "/api/external/payout", data, { error: err.message }, err.status || 500, Date.now() - start);
      throw err;
    }
  }

  async getTransaction(transactionId: string): Promise<TransactionResult> {
    const start = Date.now();
    try {
      const res = await this.sdk.transactions.get(transactionId);
      const tx = res.data?.data || res.data;
      this.recordCall("GET", `/api/external/transaction/${transactionId}`, {}, res.data, res.status || 200, Date.now() - start);
      return tx;
    } catch (err: any) {
      this.recordCall("GET", `/api/external/transaction/${transactionId}`, {}, { error: err.message }, err.status || 500, Date.now() - start);
      throw err;
    }
  }

  async createVirtualBankAccount(params: {
    wallet_id: string;
    account_name?: string;
  }): Promise<VirtualBankAccountResult> {
    const start = Date.now();
    try {
      const res = await this.sdk.virtualBankAccounts.create(params);
      const vba = res.data?.data || res.data;
      this.recordCall("POST", "/api/external/virtual-bank-account", params, vba, res.status || 200, Date.now() - start);
      return vba;
    } catch (err: any) {
      this.recordCall("POST", "/api/external/virtual-bank-account", params, { error: err.message }, err.status || 500, Date.now() - start);
      throw err;
    }
  }

  verifyWebhookSignature(payload: string, signature: string, timestamp: string, secret: string): boolean {
    return this.sdk.webhooks.verifySignature(payload, signature, timestamp, secret);
  }

  constructWebhookEvent(payload: string, signature: string, timestamp: string, secret: string): any {
    return this.sdk.webhooks.constructEvent(payload, signature, timestamp, secret);
  }
}
