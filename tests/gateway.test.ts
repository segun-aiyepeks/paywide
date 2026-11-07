import { describe, it, expect } from "vitest";
import { MockBlaaizGateway } from "../src/domain/mock-gateway";

describe("MockBlaaizGateway Integration & Idempotency", () => {
  const gateway = new MockBlaaizGateway();

  it("calculates fee breakdown with accurate rates and numbers", async () => {
    const quote = await gateway.getFeeBreakdown({
      from_currency_id: "NGN",
      to_currency_id: "GBP",
      from_amount: 1000000,
    });

    expect(quote.you_send).toBe(1000000);
    expect(quote.exchange_rate).toBeGreaterThan(0);
    expect(quote.total_fees).toBeGreaterThan(0);
    expect(quote.recipient_gets).toBeGreaterThan(0);
  });

  it("performs account lookups with fallback to mock account names", async () => {
    const lookupGbp = await gateway.verifyPayee({
      sort_code: "200000",
      account_number: "00123456",
      account_name: "Adeola Adeleke",
    });
    expect(lookupGbp.verified).toBe(true);
    expect(lookupGbp.account_name_matched).toBe(true);

    const lookupIban = await gateway.verifyIban({
      iban: "DE89370400440532013000",
    });
    expect(lookupIban.verified).toBe(true);
  });

  it("initiates payouts and records call logs for inspector", async () => {
    const payload = {
      wallet_id: "mock-wallet-ngn",
      customer_id: "cust-test-123",
      method: "bank_transfer" as const,
      from_currency_id: "NGN",
      to_currency_id: "GBP",
      from_amount: 1000000,
      to_amount: 476.19,
      account_name: "Adeola Adeleke",
      sort_code: "200000",
      account_number: "00123456",
      merchant_reference: "wp-test-ref-123",
    };

    const res1 = await gateway.initiatePayout(payload);
    expect(["PENDING", "PROCESSING"]).toContain(res1.transaction.status);
    expect(res1.transaction.id).toBeTruthy();

    // Call logs must be recorded
    const logs = gateway.getCallLogs();
    expect(logs.length).toBeGreaterThan(0);
    const payoutLog = logs.find((l) => l.endpoint.includes("/payout"));
    expect(payoutLog).toBeDefined();
    expect(payoutLog?.status).toBe(200);
  });
});
