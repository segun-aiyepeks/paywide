import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { MockBlaaizGateway } from "../src/domain/mock-gateway";

describe("Webhook Verification & Security", () => {
  const gateway = new MockBlaaizGateway();
  const secret = "whsec_blaaiz_sandbox_secret_key_demo";

  it("verifies valid HMAC-SHA256 signature with raw payload and timestamp", () => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const rawPayload = JSON.stringify({
      event: "payout.successful",
      transaction_id: "tx_12345",
      status: "SUCCESSFUL",
      amount: 100000,
    });

    const signature = crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${rawPayload}`, "utf8")
      .digest("hex");

    const isValid = gateway.verifyWebhookSignature(rawPayload, signature, timestamp, secret);
    expect(isValid).toBe(true);

    const event = gateway.constructWebhookEvent(rawPayload, signature, timestamp, secret);
    expect(event.verified).toBe(true);
    expect(event.transaction_id).toBe("tx_12345");
  });

  it("rejects tampered or forged signatures", () => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const rawPayload = JSON.stringify({ transaction_id: "tx_12345", status: "SUCCESSFUL" });
    const forgedSignature = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    const isValid = gateway.verifyWebhookSignature(rawPayload, forgedSignature, timestamp, secret);
    expect(isValid).toBe(false);

    expect(() =>
      gateway.constructWebhookEvent(rawPayload, forgedSignature, timestamp, secret)
    ).toThrow("Invalid webhook signature");
  });

  it("fails verification if timestamp was tampered with", () => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const rawPayload = JSON.stringify({ transaction_id: "tx_12345" });
    const signature = crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${rawPayload}`, "utf8")
      .digest("hex");

    const tamperedTimestamp = (Number(timestamp) + 10).toString();
    const isValid = gateway.verifyWebhookSignature(rawPayload, signature, tamperedTimestamp, secret);
    expect(isValid).toBe(false);
  });
});
