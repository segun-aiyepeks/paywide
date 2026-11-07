import { describe, it, expect } from "vitest";
import {
  toMinorUnits,
  toMajorUnits,
  formatMoney,
  calculateRecipientMinor,
  SUPPORTED_CURRENCIES,
} from "../src/domain/money";

describe("Money Math & Minor Unit Precision", () => {
  it("converts major units to minor units without floating point roundoff", () => {
    expect(toMinorUnits(100.5, "NGN")).toBe(10050n);
    expect(toMinorUnits("500000.75", "NGN")).toBe(50000075n);
    expect(toMinorUnits(0.01, "USD")).toBe(1n);
    expect(toMinorUnits("1250", "GBP")).toBe(125000n);
  });

  it("converts minor units back to major unit numbers accurately", () => {
    expect(toMajorUnits(10050n, "NGN")).toBe(100.5);
    expect(toMajorUnits(50000075n, "NGN")).toBe(500000.75);
    expect(toMajorUnits(1n, "USD")).toBe(0.01);
  });

  it("calculates recipient payout minor units accurately via scaled integer arithmetic", () => {
    // 500,000 NGN (50,000,000 kobo) at rate 0.000625 USD/NGN
    // 500,000 * 0.000625 = 312.50 USD (31,250 cents)
    const senderKobo = 50000000n;
    const rate = 0.000625;
    const recipientCents = calculateRecipientMinor(senderKobo, rate, "USD");
    expect(recipientCents).toBe(31250n);
    expect(toMajorUnits(recipientCents, "USD")).toBe(312.5);
  });

  it("formats currencies using Intl with proper symbols", () => {
    const ngnFormatted = formatMoney(50000000n, "NGN");
    expect(ngnFormatted).toContain("500,000.00");

    const usdFormatted = formatMoney(31250n, "USD");
    expect(usdFormatted).toContain("312.50");
  });

  it("throws on invalid money input strings", () => {
    expect(() => toMinorUnits("invalid", "NGN")).toThrow();
  });
});
