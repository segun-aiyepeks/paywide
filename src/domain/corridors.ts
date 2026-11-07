import { z } from "zod";

export type SupportedCorridor = "USD" | "GBP" | "EUR" | "CAD";

export interface CorridorInfo {
  currency: SupportedCorridor;
  name: string;
  country: string;
  flag: string;
  defaultMethod: "bank_transfer" | "ach" | "wire" | "interac";
  allowedMethods: ("bank_transfer" | "ach" | "wire" | "interac")[];
  eta: string;
  sampleAccount: string;
}

export const CORRIDORS: Record<SupportedCorridor, CorridorInfo> = {
  GBP: {
    currency: "GBP",
    name: "British Pound",
    country: "United Kingdom",
    flag: "🇬🇧",
    defaultMethod: "bank_transfer",
    allowedMethods: ["bank_transfer"],
    eta: "Instant (Faster Payments)",
    sampleAccount: "00123456 / 20-00-00",
  },
  EUR: {
    currency: "EUR",
    name: "Euro",
    country: "European Union",
    flag: "🇪🇺",
    defaultMethod: "bank_transfer",
    allowedMethods: ["bank_transfer"],
    eta: "Within 1 business hour (SEPA)",
    sampleAccount: "DE89 3704 0044 0532 0130 00",
  },
  USD: {
    currency: "USD",
    name: "US Dollar",
    country: "United States",
    flag: "🇺🇸",
    defaultMethod: "ach",
    allowedMethods: ["ach", "wire"],
    eta: "ACH: 1-2 business days | Wire: Same day",
    sampleAccount: "Routing: 021000021 / Acc: 123456789",
  },
  CAD: {
    currency: "CAD",
    name: "Canadian Dollar",
    country: "Canada",
    flag: "🇨🇦",
    defaultMethod: "interac",
    allowedMethods: ["interac"],
    eta: "Within 30 minutes (Interac e-Transfer)",
    sampleAccount: "recipient@example.ca",
  },
};

// --- Zod Corridor Schemas ---

export const gbpRecipientSchema = z.object({
  currency: z.literal("GBP"),
  method: z.literal("bank_transfer").default("bank_transfer"),
  account_name: z.string().min(2, "Account holder name is required"),
  sort_code: z
    .string()
    .transform((val) => val.replace(/[^0-9]/g, ""))
    .pipe(z.string().length(6, "Sort code must be 6 digits")),
  account_number: z
    .string()
    .transform((val) => val.replace(/[^0-9]/g, ""))
    .pipe(z.string().length(8, "Account number must be 8 digits")),
});

export const eurRecipientSchema = z.object({
  currency: z.literal("EUR"),
  method: z.literal("bank_transfer").default("bank_transfer"),
  account_name: z.string().min(2, "Account holder name is required"),
  iban: z
    .string()
    .transform((val) => val.replace(/\s+/g, "").toUpperCase())
    .pipe(
      z
        .string()
        .min(15, "IBAN too short")
        .max(34, "IBAN too long")
        .regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/, "Invalid IBAN format")
    ),
  bic_code: z
    .string()
    .transform((val) => val.replace(/\s+/g, "").toUpperCase())
    .pipe(
      z
        .string()
        .min(8, "BIC/SWIFT code must be 8 or 11 characters")
        .max(11, "BIC/SWIFT code must be 8 or 11 characters")
    ),
});

export const usdRecipientSchema = z.object({
  currency: z.literal("USD"),
  method: z.enum(["ach", "wire"]).default("ach"),
  type: z.enum(["individual", "business"]).default("individual"),
  account_name: z.string().min(2, "Account holder name is required"),
  bank_name: z.string().min(2, "Bank name is required"),
  account_type: z.enum(["checking", "savings"]).default("checking"),
  routing_number: z
    .string()
    .transform((val) => val.replace(/[^0-9]/g, ""))
    .pipe(z.string().length(9, "Routing number must be exactly 9 digits (ABA)")),
  account_number: z
    .string()
    .transform((val) => val.replace(/[^0-9]/g, ""))
    .pipe(z.string().min(4, "Account number too short").max(17, "Account number too long")),
  swift_code: z
    .string()
    .optional()
    .transform((val) => (val ? val.replace(/\s+/g, "").toUpperCase() : undefined)),
}).refine(
  (data) => {
    if (data.method === "wire" && !data.swift_code) {
      return false;
    }
    return true;
  },
  {
    message: "SWIFT code is required for Wire transfers",
    path: ["swift_code"],
  }
);

export const cadRecipientSchema = z.object({
  currency: z.literal("CAD"),
  method: z.literal("interac").default("interac"),
  interac_first_name: z.string().min(1, "First name is required"),
  interac_last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid recipient email is required for Interac"),
});

export const universalRecipientSchema = z.union([
  gbpRecipientSchema,
  eurRecipientSchema,
  usdRecipientSchema,
  cadRecipientSchema,
]);

export type GbpRecipient = z.infer<typeof gbpRecipientSchema>;
export type EurRecipient = z.infer<typeof eurRecipientSchema>;
export type UsdRecipient = z.infer<typeof usdRecipientSchema>;
export type CadRecipient = z.infer<typeof cadRecipientSchema>;
export type UniversalRecipient = z.infer<typeof universalRecipientSchema>;
