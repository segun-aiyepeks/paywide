"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, Clock, RefreshCw, Info, ChevronDown, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { formatMoney } from "../domain/money";

export interface QuoteData {
  quoteId: string;
  sourceCurrency: "NGN";
  targetCurrency: "USD" | "GBP" | "EUR" | "CAD";
  sourceAmountMinor: string;
  targetAmountMinor: string;
  feeMinor: string;
  exchangeRate: number;
  rateGuaranteeSeconds: number;
  expiresAt: string;
}

interface QuoteCalculatorProps {
  onQuoteCalculated: (quote: QuoteData) => void;
  initialTargetCurrency?: "USD" | "GBP" | "EUR" | "CAD";
}

const PRESET_AMOUNTS = [
  { label: "₦250K", value: "250000" },
  { label: "₦500K", value: "500000" },
  { label: "₦1.0M", value: "1000000" },
  { label: "₦2.5M", value: "2500000" },
];

const CORRIDORS = [
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧", payout: "UK Faster Payments" },
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸", payout: "ACH & Fedwire" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺", payout: "SEPA Instant" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦", payout: "Interac e-Transfer" },
] as const;

export function QuoteCalculator({ onQuoteCalculated, initialTargetCurrency = "GBP" }: QuoteCalculatorProps) {
  const [sourceAmount, setSourceAmount] = useState<string>("1000000");
  const [targetCurrency, setTargetCurrency] = useState<"USD" | "GBP" | "EUR" | "CAD">(initialTargetCurrency);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [showBreakdown, setShowBreakdown] = useState<boolean>(true);

  // Debounce quote calculation
  const fetchQuote = async (amountStr: string, currency: string) => {
    const num = Number(amountStr.replace(/,/g, ""));
    if (isNaN(num) || num < 5000) {
      setErrorMessage("Minimum transfer amount is ₦5,000 NGN");
      setQuote(null);
      return;
    }
    if (num > 25000000) {
      setErrorMessage("Maximum transfer amount per transaction is ₦25,000,000 NGN");
      setQuote(null);
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceCurrency: "NGN",
          targetCurrency: currency,
          amountMajor: num,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to fetch guaranteed quote");
      }

      const data = await res.json();
      setQuote(data);
      const remaining = Math.max(0, Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000));
      setSecondsRemaining(remaining > 0 ? remaining : 300);
      setIsExpired(false);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to fetch live quote");
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger on initial load or currency change
  useEffect(() => {
    fetchQuote(sourceAmount, targetCurrency);
  }, [targetCurrency]);

  // Countdown timer for quote expiry
  useEffect(() => {
    if (!quote || isExpired) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quote, isExpired]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    setSourceAmount(val);
  };

  const handleAmountBlur = () => {
    fetchQuote(sourceAmount, targetCurrency);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      fetchQuote(sourceAmount, targetCurrency);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const targetCorridor = CORRIDORS.find((c) => c.code === targetCurrency)!;

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-6 sm:p-8 shadow-sm">
      {/* Step Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-outline-variant/30">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-bold">
            Step 1 of 4 • Transparent Quote
          </span>
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-on-surface mt-1">
            Calculate Transfer Cost
          </h2>
        </div>

        {/* Live status badge */}
        {quote && !isExpired && (
          <div className="flex items-center gap-2 bg-secondary/10 border border-secondary/20 text-secondary px-3 py-1.5 rounded-full text-xs font-mono font-medium">
            <Clock className="w-3.5 h-3.5 text-secondary animate-pulse" />
            <span>Rate locked: {formatTimer(secondsRemaining)}</span>
          </div>
        )}
      </div>

      {/* Calculator Body */}
      <div className="space-y-6">
        {/* Source Amount (NGN) */}
        <div>
          <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">
            You Send (Nigerian Naira)
          </label>
          <div className="relative rounded-lg border border-outline-variant focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 bg-surface-container-low transition-all">
            <div className="flex items-center">
              <span className="pl-4 pr-2 text-on-surface-variant font-mono font-bold text-lg select-none">
                ₦
              </span>
              <input
                type="text"
                value={sourceAmount ? Number(sourceAmount).toLocaleString("en-US") : ""}
                onChange={handleAmountChange}
                onBlur={handleAmountBlur}
                onKeyDown={handleKeyDown}
                placeholder="1,000,000"
                className="w-full py-3.5 bg-transparent text-xl font-heading font-bold text-on-surface focus:outline-none tabular-nums"
              />
              <div className="pr-4 shrink-0 flex items-center gap-2">
                <span className="font-mono text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded">
                  NGN
                </span>
              </div>
            </div>
          </div>

          {/* Preset amount pills */}
          <div className="flex flex-wrap gap-2 mt-2.5">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => {
                  setSourceAmount(preset.value);
                  fetchQuote(preset.value, targetCurrency);
                }}
                className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                  sourceAmount === preset.value
                    ? "bg-primary text-white border-primary font-medium"
                    : "bg-surface-container hover:bg-surface-container-high border-outline-variant/40 text-on-surface"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Currency Selector Tabs */}
        <div>
          <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">
            Select Payout Corridor
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {CORRIDORS.map((corridor) => {
              const isSelected = targetCurrency === corridor.code;
              return (
                <button
                  key={corridor.code}
                  type="button"
                  onClick={() => setTargetCurrency(corridor.code)}
                  className={`p-3 rounded-lg border text-left transition-all relative ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                      : "border-outline-variant/40 bg-surface-container-lowest hover:bg-surface-container hover:border-outline-variant/80"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xl" role="img" aria-label={corridor.name}>
                      {corridor.flag}
                    </span>
                    <span className="font-mono font-bold text-sm text-primary">
                      {corridor.code}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-on-surface">{corridor.name}</div>
                  <div className="text-[10px] text-on-surface-variant truncate mt-0.5">
                    {corridor.payout}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-error-container text-error text-xs flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Recipient Gets Box */}
        {quote && !isExpired && (
          <div className="rounded-lg bg-surface-container border border-outline-variant/50 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Recipient Receives Exact Amount
              </span>
              <span className="text-xs font-mono text-secondary font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Guaranteed Delivery
              </span>
            </div>

            <div className="flex items-baseline justify-between mt-2">
              <div className="flex items-baseline gap-1.5">
                <span className="font-heading text-3xl font-extrabold text-primary tabular-nums">
                  {targetCorridor.symbol}
                  {formatMoney(BigInt(quote.targetAmountMinor), 2)}
                </span>
                <span className="font-mono text-sm font-bold text-primary">
                  {quote.targetCurrency}
                </span>
              </div>

              <div className="text-right text-xs text-on-surface-variant">
                <div className="font-mono font-semibold text-on-surface">
                  1 {quote.targetCurrency} = {Math.round(1 / quote.exchangeRate).toLocaleString()} NGN
                </div>
                <div className="text-[11px] text-secondary">Zero FX Markup Guarantee</div>
              </div>
            </div>
          </div>
        )}

        {/* Expired State */}
        {isExpired && (
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Quote lock expired after 5 minutes. Real-time rates fluctuate with market liquidity.</span>
            </div>
            <button
              onClick={() => fetchQuote(sourceAmount, targetCurrency)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-primary text-white font-medium hover:bg-primary-container transition"
            >
              <RefreshCw className="w-3 h-3" /> Refresh Rate
            </button>
          </div>
        )}

        {/* Transparent Fee Breakdown Dropdown */}
        {quote && (
          <div className="border border-outline-variant/40 rounded-lg overflow-hidden bg-surface-container-low text-xs">
            <button
              type="button"
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-surface-container transition-colors"
            >
              <span className="font-semibold text-on-surface flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-primary" />
                Transparent Cost Breakdown
              </span>
              <ChevronDown
                className={`w-4 h-4 text-on-surface-variant transition-transform ${
                  showBreakdown ? "rotate-180" : ""
                }`}
              />
            </button>

            {showBreakdown && (
              <div className="px-4 pb-4 pt-1 space-y-2 border-t border-outline-variant/20 font-mono text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-on-surface-variant">Transfer Amount</span>
                  <span className="text-on-surface font-semibold">
                    ₦{formatMoney(BigInt(quote.sourceAmountMinor), 2)} NGN
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-on-surface-variant">Blaaiz Network Routing Fee</span>
                  <span className="text-on-surface font-semibold">
                    ₦{formatMoney(BigInt(quote.feeMinor), 2)} NGN
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-on-surface-variant">Hidden Markups / Spreads</span>
                  <span className="text-secondary font-bold">₦0.00 (0%)</span>
                </div>
                <div className="flex justify-between py-1 border-t border-outline-variant/30 pt-2 font-bold text-on-surface">
                  <span>Net Payout Conversion</span>
                  <span>
                    ₦
                    {formatMoney(
                      BigInt(quote.sourceAmountMinor) - BigInt(quote.feeMinor),
                      2
                    )}{" "}
                    NGN @ {quote.exchangeRate}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Continue CTA */}
        <button
          type="button"
          disabled={!quote || isExpired || isLoading}
          onClick={() => quote && onQuoteCalculated(quote)}
          className="w-full py-4 rounded-lg bg-primary hover:bg-primary-container active:scale-[0.99] text-white font-heading font-semibold text-base flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Locking Guaranteed Rate...</span>
            </>
          ) : (
            <>
              <span>Continue to Recipient Details</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
