/**
 * Integer Minor Units Money Arithmetic & Formatting Utility
 * All internal money calculations MUST use minor units (kobo, cents, pence).
 * Floats are strictly prohibited for financial operations.
 */

export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  locale: string;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  NGN: {
    code: "NGN",
    name: "Nigerian Naira",
    symbol: "₦",
    decimalPlaces: 2, // 1 NGN = 100 kobo
    locale: "en-NG",
  },
  USD: {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    decimalPlaces: 2, // 1 USD = 100 cents
    locale: "en-US",
  },
  GBP: {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    decimalPlaces: 2, // 1 GBP = 100 pence
    locale: "en-GB",
  },
  EUR: {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    decimalPlaces: 2, // 1 EUR = 100 cents
    locale: "de-DE",
  },
  CAD: {
    code: "CAD",
    name: "Canadian Dollar",
    symbol: "CA$",
    decimalPlaces: 2, // 1 CAD = 100 cents
    locale: "en-CA",
  },
};

/**
 * Converts a major unit decimal number or string to integer minor units (BigInt).
 * e.g. "1500.50" NGN -> 150050n kobo
 */
export function toMinorUnits(amount: number | string, currency: string = "NGN"): bigint {
  const config = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.NGN;
  const strAmount = typeof amount === "number" ? amount.toFixed(config.decimalPlaces) : amount.trim();
  
  if (!strAmount || isNaN(Number(strAmount))) {
    throw new Error(`Invalid amount format: "${amount}"`);
  }

  const [whole, fraction = ""] = strAmount.split(".");
  const paddedFraction = fraction.padEnd(config.decimalPlaces, "0").slice(0, config.decimalPlaces);
  
  return BigInt(`${whole}${paddedFraction}`);
}

/**
 * Converts integer minor units (BigInt) to major unit number for UI display or calculations.
 * e.g. 150050n kobo -> 1500.50
 */
export function toMajorUnits(minor: bigint | number | string, currency: string = "NGN"): number {
  const config = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.NGN;
  const bigMinor = typeof minor === "bigint" ? minor : BigInt(String(minor));
  const divisor = BigInt(10 ** config.decimalPlaces);
  
  const whole = bigMinor / divisor;
  const remainder = bigMinor % divisor;
  const absRemainder = remainder < 0n ? -remainder : remainder;
  const fracStr = absRemainder.toString().padStart(config.decimalPlaces, "0");
  
  return Number(`${whole}.${fracStr}`);
}

/**
 * Formats minor units to human-readable locale string using Intl.NumberFormat.
 * e.g. formatMoney(150050n, 'NGN') -> "₦1,500.50"
 */
export function formatMoney(
  minor: bigint | number | string,
  currencyOrDecimals: string | number = "NGN",
  options?: { showSymbol?: boolean; showCode?: boolean }
): string {
  if (typeof currencyOrDecimals === "number") {
    const decimals = currencyOrDecimals;
    const bigMinor = typeof minor === "bigint" ? minor : BigInt(String(minor));
    const divisor = BigInt(10 ** decimals);
    const whole = bigMinor / divisor;
    const remainder = bigMinor % divisor;
    const absRemainder = remainder < 0n ? -remainder : remainder;
    const fracStr = absRemainder.toString().padStart(decimals, "0");
    const formattedWhole = Number(whole).toLocaleString("en-US");
    return decimals > 0 ? `${formattedWhole}.${fracStr}` : formattedWhole;
  }

  const currency = currencyOrDecimals;
  const config = SUPPORTED_CURRENCIES[currency] || {
    code: currency,
    name: currency,
    symbol: currency,
    decimalPlaces: 2,
    locale: "en-US",
  };

  const major = toMajorUnits(minor, currency);
  
  const formatter = new Intl.NumberFormat(config.locale, {
    style: options?.showSymbol !== false ? "currency" : "decimal",
    currency: config.code,
    minimumFractionDigits: config.decimalPlaces,
    maximumFractionDigits: config.decimalPlaces,
  });

  const formatted = formatter.format(major);

  if (options?.showCode) {
    return `${formatted} ${config.code}`;
  }

  return formatted;
}

/**
 * Calculates recipient amount from sender amount in minor units given exchange rate.
 * senderMinor (kobo) * rate -> recipientMinor (cents/pence)
 */
export function calculateRecipientMinor(
  senderMinor: bigint,
  exchangeRate: number,
  targetCurrency: string
): bigint {
  const targetConfig = SUPPORTED_CURRENCIES[targetCurrency] || SUPPORTED_CURRENCIES.USD;
  // Scaled integer arithmetic to avoid float roundoff: scale by 1,000,000
  const SCALE = 1000000n;
  const rateScaled = BigInt(Math.round(exchangeRate * 1000000));
  
  // Note: NGN (kobo) -> USD (cents)
  // Both have 2 decimal places, so ratio is directly rateScaled / SCALE
  const recipientMinor = (senderMinor * rateScaled) / SCALE;
  return recipientMinor;
}
