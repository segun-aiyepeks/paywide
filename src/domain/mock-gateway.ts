import crypto from "crypto";
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

export class MockBlaaizGateway implements BlaaizGateway {
  readonly mode = "mock" as const;
  private callLogs: GatewayCallRecord[] = [];
  private transactions: Map<string, TransactionResult> = new Map();

  // Exchange rates per 1 NGN
  private static RATES: Record<string, number> = {
    USD: 0.000625, // 1 USD = 1,600 NGN
    GBP: 0.000500, // 1 GBP = 2,000 NGN
    EUR: 0.000571, // 1 EUR = 1,751 NGN
    CAD: 0.000847, // 1 CAD = 1,180 NGN
  };

  private recordCall(
    method: string,
    endpoint: string,
    requestPayload: any,
    responsePayload: any,
    status: number = 200,
    durationMs: number = 25
  ) {
    this.callLogs.unshift({
      timestamp: new Date().toISOString(),
      method,
      endpoint,
      mode: "MOCK",
      requestPayload,
      responsePayload,
      status,
      durationMs,
    });
    // Keep last 100 calls in memory
    if (this.callLogs.length > 100) {
      this.callLogs.pop();
    }
  }

  getCallLogs(): GatewayCallRecord[] {
    return [...this.callLogs];
  }

  async testConnection(): Promise<boolean> {
    this.recordCall("GET", "/api/external/currency", {}, { connected: true });
    return true;
  }

  async getCurrencies(): Promise<CurrencyItem[]> {
    const list: CurrencyItem[] = [
      { id: "NGN", name: "Nigerian Naira", code: "NGN", status: "active" },
      { id: "USD", name: "US Dollar", code: "USD", status: "active" },
      { id: "GBP", name: "British Pound", code: "GBP", status: "active" },
      { id: "EUR", name: "Euro", code: "EUR", status: "active" },
      { id: "CAD", name: "Canadian Dollar", code: "CAD", status: "active" },
    ];
    this.recordCall("GET", "/api/external/currency", {}, list);
    return list;
  }

  async getFeeBreakdown(params: {
    from_currency_id: string;
    to_currency_id: string;
    from_amount: number;
  }): Promise<FeeBreakdownResult> {
    const rate = MockBlaaizGateway.RATES[params.to_currency_id] || 0.000625;
    
    // Blaaiz fee formula: 0.5% with a minimum 1,500 NGN
    const rawFee = Math.max(1500, Math.round(params.from_amount * 0.005));
    const youSend = params.from_amount;
    const recipientGets = Number(((youSend - rawFee) * rate).toFixed(2));
    const totalAmountToSend = youSend; // Blaaiz deducts fee from send amount or charges total

    const breakdown: FeeBreakdownResult = {
      you_send: youSend,
      total_amount_to_send: totalAmountToSend,
      recipient_gets: recipientGets,
      total_fees: rawFee,
      exchange_rate: rate,
      collection_fees: [{ name: "Collection Rail Fee", amount: 0, currency: "NGN" }],
      payout_fees: [{ name: "Cross-Border Settlement Fee", amount: rawFee, currency: "NGN" }],
    };

    this.recordCall("POST", "/api/external/fees/breakdown", params, breakdown);
    return breakdown;
  }

  async lookupBankAccount(accountNumber: string, bankId: string): Promise<BankAccountLookupResult> {
    const sampleNames = [
      "ADEWALE OLUWASEUN BAKARE",
      "CHINELO NGOZI OKAFOR",
      "IBRAHIM MUSA DANJUMA",
      "OLUWATOYIN ADESOLA BELLO",
    ];
    const index = Math.abs(parseInt(accountNumber.slice(-2) || "0", 10)) % sampleNames.length;
    const result: BankAccountLookupResult = {
      account_name: sampleNames[index],
      account_number: accountNumber,
      bank_name: "Guaranty Trust Bank (Simulated)",
    };

    this.recordCall(
      "POST",
      "/api/external/bank/account-lookup",
      { account_number: accountNumber, bank_id: bankId },
      result
    );
    return result;
  }

  async verifyPayee(params: {
    sort_code: string;
    account_number: string;
    account_name: string;
  }): Promise<PayeeVerificationResult> {
    const result: PayeeVerificationResult = {
      verified: true,
      account_name_matched: true,
      message: "UK Confirmation of Payee match confirmed.",
    };
    this.recordCall("POST", "/api/external/bank/payee-verification", params, result);
    return result;
  }

  async verifyIban(params: { iban: string }): Promise<IbanVerificationResult> {
    const cleanIban = params.iban.replace(/\s+/g, "").toUpperCase();
    const country = cleanIban.slice(0, 2);
    const result: IbanVerificationResult = {
      verified: true,
      bank_name: `${country} Partner Clearing Bank`,
      country,
      message: "IBAN routing and checksum validated.",
    };
    this.recordCall("POST", "/api/external/bank/iban-verification", params, result);
    return result;
  }

  async createCustomer(data: CustomerInput): Promise<CustomerResult> {
    const customer: CustomerResult = {
      ...data,
      id: `blz_cust_${crypto.randomBytes(6).toString("hex")}`,
      business_id: "biz_waypay_demo_01",
      verification_status: "VERIFIED",
    };
    this.recordCall("POST", "/api/external/customer", data, customer);
    return customer;
  }

  async initiatePayout(data: PayoutInput): Promise<{ message: string; transaction: TransactionResult }> {
    const txId = `tx_blz_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const rate = MockBlaaizGateway.RATES[data.to_currency_id] || 0.000625;
    const amount = data.from_amount || (data.to_amount ? data.to_amount / rate : 100000);
    const fee = Math.max(1500, Math.round(amount * 0.005));

    const tx: TransactionResult = {
      id: txId,
      business_id: "biz_waypay_demo_01",
      business_customer_id: data.customer_id,
      business_wallet_id: data.wallet_id,
      status: "PROCESSING",
      type: "payout",
      reference: `ref_${txId}`,
      merchant_reference: data.merchant_reference || null,
      currency: data.from_currency_id,
      amount,
      amount_without_fee: amount - fee,
      fee,
      rate,
      date: new Date().toISOString(),
      recipient: {
        account_number: data.account_number || data.email || null,
        account_name: data.account_name || `${data.interac_first_name || ""} ${data.interac_last_name || ""}`.trim() || null,
        amount: Number(((amount - fee) * rate).toFixed(2)),
        currency: data.to_currency_id,
        bank_name: data.bank_name || `${data.to_currency_id} Payout Partner Bank`,
      },
    };

    this.transactions.set(txId, tx);
    const response = {
      message: "Payout initiated successfully in sandbox",
      transaction: tx,
    };

    this.recordCall("POST", "/api/external/payout", data, response);
    return response;
  }

  async getTransaction(transactionId: string): Promise<TransactionResult> {
    let tx = this.transactions.get(transactionId);
    if (!tx) {
      // Generate deterministic simulated response if not found
      tx = {
        id: transactionId,
        business_id: "biz_waypay_demo_01",
        business_customer_id: "blz_cust_mock",
        business_wallet_id: "wal_ngn_mock",
        status: "SUCCESSFUL",
        type: "payout",
        reference: `ref_${transactionId}`,
        merchant_reference: null,
        currency: "NGN",
        amount: 250000,
        amount_without_fee: 248750,
        fee: 1250,
        rate: 0.000625,
        date: new Date().toISOString(),
      };
      this.transactions.set(transactionId, tx);
    }

    this.recordCall("GET", `/api/external/transaction/${transactionId}`, {}, { data: tx });
    return tx;
  }

  async createVirtualBankAccount(params: {
    wallet_id: string;
    account_name?: string;
  }): Promise<VirtualBankAccountResult> {
    const randomAcc = `012${Math.floor(1000000 + Math.random() * 9000000)}`;
    const vba: VirtualBankAccountResult = {
      id: `vba_${crypto.randomBytes(6).toString("hex")}`,
      account_number: randomAcc,
      account_name: params.account_name || "WayPay / Sandbox Settlement Account",
      bank_name: "Wema Bank (Simulated Blaaiz Rails)",
      bank_code: "035",
      wallet_id: params.wallet_id,
    };

    this.recordCall("POST", "/api/external/virtual-bank-account", params, vba);
    return vba;
  }

  verifyWebhookSignature(payload: string, signature: string, timestamp: string, secret: string): boolean {
    if (!payload || !signature || !timestamp || !secret) {
      return false;
    }

    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(signedPayload, "utf8")
      .digest("hex");

    try {
      const sigBuf = Buffer.from(signature.toLowerCase(), "hex");
      const expBuf = Buffer.from(expectedSignature.toLowerCase(), "hex");

      if (sigBuf.length !== expBuf.length) {
        return false;
      }
      return crypto.timingSafeEqual(sigBuf, expBuf);
    } catch {
      return false;
    }
  }

  constructWebhookEvent(payload: string, signature: string, timestamp: string, secret: string): any {
    if (!this.verifyWebhookSignature(payload, signature, timestamp, secret)) {
      throw new Error("Invalid webhook signature: HMAC-SHA256 mismatch");
    }

    const parsed = typeof payload === "string" ? JSON.parse(payload) : payload;
    return {
      ...parsed,
      verified: true,
      timestamp,
    };
  }
}
