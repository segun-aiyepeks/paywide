"use client";

import React, { useState } from "react";
import { ArrowLeft, CheckCircle2, ShieldCheck, Lock, AlertCircle, RefreshCw, Send } from "lucide-react";
import { QuoteData } from "./QuoteCalculator";
import { formatMoney } from "../domain/money";

interface ReviewConfirmProps {
  quote: QuoteData;
  recipient: any;
  onBack: () => void;
  onSuccess: (transfer: any) => void;
}

const PURPOSES = [
  "Family Support / Maintenance",
  "Overseas Education & Tuition",
  "Technology & Software Services",
  "International Trade & Invoicing",
  "Medical & Healthcare Expenses",
  "Professional Consulting",
];

export function ReviewConfirm({ quote, recipient, onBack, onSuccess }: ReviewConfirmProps) {
  const [senderName, setSenderName] = useState<string>("Tunde Adeleke");
  const [senderEmail, setSenderEmail] = useState<string>("tunde.adeleke@example.com");
  const [purpose, setPurpose] = useState<string>(PURPOSES[0]);
  const [hasAgreed, setHasAgreed] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getRecipientSummary = () => {
    if (recipient.currency === "GBP") {
      return {
        name: recipient.account_name,
        details: `Sort Code: ${recipient.sort_code} • Account: ${recipient.account_number}`,
        method: "UK Faster Payments",
      };
    }
    if (recipient.currency === "EUR") {
      return {
        name: recipient.account_name,
        details: `IBAN: ${recipient.iban} ${recipient.bic_code ? "• BIC: " + recipient.bic_code : ""}`,
        method: "SEPA Credit Transfer",
      };
    }
    if (recipient.currency === "USD") {
      return {
        name: recipient.account_name,
        details: `${recipient.bank_name || "US Bank"} • Routing: ${recipient.routing_number} • Account: ${recipient.account_number}`,
        method: recipient.method === "wire" ? "Fedwire Same-Day" : "ACH Transfer",
      };
    }
    if (recipient.currency === "CAD") {
      return {
        name: `${recipient.interac_first_name} ${recipient.interac_last_name}`,
        details: `Interac Email: ${recipient.email}`,
        method: "Interac e-Transfer",
      };
    }
    return { name: "Recipient", details: "Direct Bank Transfer", method: "Standard" };
  };

  const recipientSummary = getRecipientSummary();

  const handleConfirmAndPay = async () => {
    if (!hasAgreed) {
      setErrorMessage("Please acknowledge the Blaaiz rails regulatory disclosure.");
      return;
    }
    if (!senderName || !senderEmail) {
      setErrorMessage("Sender name and email are required for transfer compliance.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // Generate unique idempotency key
    const idempotencyKey = `wp_idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    try {
      const res = await fetch("/api/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: quote.quoteId,
          sourceAmountMinor: quote.sourceAmountMinor,
          targetAmountMinor: quote.targetAmountMinor,
          feeMinor: quote.feeMinor,
          targetCurrency: quote.targetCurrency,
          narration: purpose,
          idempotencyKey,
          sender: {
            name: senderName,
            email: senderEmail,
          },
          recipient,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate transfer");
      }

      onSuccess(data.transfer);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred while routing the transfer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-6 sm:p-8 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-outline-variant/30">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-bold">
            Step 3 of 4 • Pre-Payment Verification
          </span>
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-on-surface mt-1">
            Review Transfer Summary
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-secondary text-xs font-mono font-medium bg-secondary/10 px-2.5 py-1 rounded">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Locked Rate Protected</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Financial Breakdown Card */}
        <div className="rounded-lg bg-surface-container-low border border-outline-variant/40 p-5 font-mono text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
            <span className="text-on-surface-variant uppercase tracking-wider text-[11px]">
              Transfer Debit Amount
            </span>
            <span className="text-sm font-bold text-on-surface">
              ₦{formatMoney(BigInt(quote.sourceAmountMinor), 2)} NGN
            </span>
          </div>

          <div className="py-2.5 space-y-1.5 border-b border-outline-variant/30">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Blaaiz Network Processing Fee:</span>
              <span className="text-on-surface">
                ₦{formatMoney(BigInt(quote.feeMinor), 2)} NGN
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Guaranteed Exchange Rate:</span>
              <span className="text-on-surface font-semibold">
                1 {quote.targetCurrency} = {Math.round(1 / quote.exchangeRate).toLocaleString()} NGN
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Hidden Markups / Spreads:</span>
              <span className="text-secondary font-bold">₦0.00 (0.0%)</span>
            </div>
          </div>

          <div className="flex items-baseline justify-between pt-3 text-sm">
            <span className="font-bold text-on-surface uppercase tracking-wider">
              Recipient Receives:
            </span>
            <span className="font-heading text-2xl font-extrabold text-primary">
              {formatMoney(BigInt(quote.targetAmountMinor), 2)} {quote.targetCurrency}
            </span>
          </div>
        </div>

        {/* Recipient Details Card */}
        <div className="rounded-lg bg-surface-container-low border border-outline-variant/40 p-5">
          <h3 className="text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">
            Beneficiary Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-on-surface-variant block text-[11px]">Legal Name</span>
              <span className="font-bold text-on-surface">{recipientSummary.name}</span>
            </div>
            <div>
              <span className="text-on-surface-variant block text-[11px]">Payment Rail</span>
              <span className="font-mono text-primary font-medium">{recipientSummary.method}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-on-surface-variant block text-[11px]">Routing &amp; Account</span>
              <span className="font-mono text-on-surface font-medium">{recipientSummary.details}</span>
            </div>
          </div>
        </div>

        {/* Sender Information & Purpose */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1.5">
                Sender Full Name
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-low text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1.5">
                Receipt Notification Email
              </label>
              <input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-low text-xs font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1.5">
              Transfer Purpose / Regulatory Narration
            </label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-low text-xs font-medium"
            >
              {PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mandatory Regulatory Checkbox */}
        <div className="p-4 rounded-lg bg-surface-container border border-outline-variant/50">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasAgreed}
              onChange={(e) => setHasAgreed(e.target.checked)}
              className="mt-0.5 rounded border-outline-variant text-primary focus:ring-primary"
            />
            <span className="text-xs text-on-surface-variant leading-relaxed">
              I acknowledge that <strong>PayWide</strong> is a technology software platform and not a bank.
              Payment fulfillment, currency exchange, and cross-border settlement are executed exclusively via <strong>Blaaiz Remittance-as-a-Service</strong>. I confirm the beneficiary account details provided are accurate.
            </span>
          </label>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-error-container text-error text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Navigation CTAs */}
        <div className="flex items-center justify-between pt-4 border-t border-outline-variant/30">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onBack}
            className="px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container text-sm font-medium flex items-center gap-2 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Edit Details</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting || !hasAgreed}
            onClick={handleConfirmAndPay}
            className="px-6 py-3 rounded-lg bg-primary hover:bg-primary-container disabled:opacity-50 text-white font-heading font-semibold text-sm flex items-center gap-2 transition shadow-md cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Initiating Payout via Blaaiz...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Authorize &amp; Initiate Payout</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
