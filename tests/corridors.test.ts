import { describe, it, expect } from "vitest";
import {
  gbpRecipientSchema,
  eurRecipientSchema,
  usdRecipientSchema,
  cadRecipientSchema,
  universalRecipientSchema,
} from "../src/domain/corridors";

describe("Corridor Form Zod Validation", () => {
  it("validates GBP bank transfer details (sort code & account number)", () => {
    const validGbp = {
      currency: "GBP",
      method: "bank_transfer",
      account_name: "John Doe",
      sort_code: "20-00-00",
      account_number: "00123456",
    };
    const parsed = gbpRecipientSchema.parse(validGbp);
    expect(parsed.sort_code).toBe("200000");
    expect(parsed.account_number).toBe("00123456");

    expect(() =>
      gbpRecipientSchema.parse({
        currency: "GBP",
        account_name: "John Doe",
        sort_code: "2000", // too short
        account_number: "00123456",
      })
    ).toThrow();
  });

  it("validates EUR IBAN and BIC details", () => {
    const validEur = {
      currency: "EUR",
      method: "bank_transfer",
      account_name: "Hans Gruber",
      iban: "DE89 3704 0044 0532 0130 00",
      bic_code: "DBEUT38B",
    };
    const parsed = eurRecipientSchema.parse(validEur);
    expect(parsed.iban).toBe("DE89370400440532013000");
    expect(parsed.bic_code).toBe("DBEUT38B");

    expect(() =>
      eurRecipientSchema.parse({
        currency: "EUR",
        account_name: "Hans Gruber",
        iban: "INVALID_IBAN",
        bic_code: "123",
      })
    ).toThrow();
  });

  it("validates USD ACH and Wire requirements", () => {
    const validAch = {
      currency: "USD",
      method: "ach",
      type: "individual",
      account_name: "Jane Smith",
      bank_name: "Chase Bank",
      account_type: "checking",
      routing_number: "021000021",
      account_number: "1234567890",
    };
    expect(usdRecipientSchema.parse(validAch)).toBeTruthy();

    // Wire without swift_code must fail
    expect(() =>
      usdRecipientSchema.parse({
        ...validAch,
        method: "wire",
      })
    ).toThrow("SWIFT code is required");
  });

  it("validates CAD Interac requirements", () => {
    const validCad = {
      currency: "CAD",
      method: "interac",
      interac_first_name: "Marie",
      interac_last_name: "Tremblay",
      email: "marie.tremblay@example.ca",
    };
    expect(cadRecipientSchema.parse(validCad)).toBeTruthy();

    expect(() =>
      cadRecipientSchema.parse({
        currency: "CAD",
        interac_first_name: "Marie",
        interac_last_name: "Tremblay",
        email: "not-an-email",
      })
    ).toThrow();
  });

  it("validates through universal discriminated union schema", () => {
    const parsedGbp = universalRecipientSchema.parse({
      currency: "GBP",
      account_name: "John Doe",
      sort_code: "200000",
      account_number: "00123456",
    });
    expect(parsedGbp.currency).toBe("GBP");
  });
});
