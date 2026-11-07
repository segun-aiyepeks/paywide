"use client";

import React, { useState } from "react";
import { QuoteCalculator, QuoteData } from "../components/QuoteCalculator";
import { RecipientForm } from "../components/RecipientForm";
import { ReviewConfirm } from "../components/ReviewConfirm";
import { LiveTracker } from "../components/LiveTracker";
import { ReceiptModal } from "../components/ReceiptModal";
import { ShieldCheck, Zap, ArrowRightLeft, Clock, Lock, CheckCircle2 } from "lucide-react";

type FlowStep = "QUOTE" | "RECIPIENT" | "REVIEW" | "TRACK";

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<FlowStep>("QUOTE");
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [recipient, setRecipient] = useState<any>(null);
  const [activeTransfer, setActiveTransfer] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);

  // Handlers
  const handleQuoteCalculated = (calculatedQuote: QuoteData) => {
    setQuote(calculatedQuote);
    setCurrentStep("RECIPIENT");
  };

  const handleRecipientSubmitted = (recipientData: any) => {
    setRecipient(recipientData);
    setCurrentStep("REVIEW");
  };

  const handleTransferCreated = (transfer: any) => {
    setActiveTransfer(transfer);
    setCurrentStep("TRACK");
  };

  const handleStartNew = () => {
    setQuote(null);
    setRecipient(null);
    setActiveTransfer(null);
    setCurrentStep("QUOTE");
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-medium">
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Blaaiz Remittance-as-a-Service Rails</span>
        </div>

        <h1 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-on-surface">
          Cross-Border Transfers with <span className="text-primary underline decoration-secondary decoration-4 underline-offset-8">Total Transparency</span>
        </h1>

        <p className="text-sm sm:text-base text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
          Send money from Nigeria (NGN) to the United Kingdom, United States, Europe, and Canada. See your guaranteed exchange rate, network fee, and exact recipient payout upfront before sending a single kobo.
        </p>

        {/* Value Prop Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs font-medium text-on-surface-variant">
          <span className="flex items-center gap-1.5 bg-surface-container px-3 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
            Zero Hidden FX Spread
          </span>
          <span className="flex items-center gap-1.5 bg-surface-container px-3 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 text-secondary" />
            5-Minute Rate Lock
          </span>
          <span className="flex items-center gap-1.5 bg-surface-container px-3 py-1 rounded-full">
            <Lock className="w-3.5 h-3.5 text-secondary" />
            Zero-Float Integer Math
          </span>
        </div>
      </section>

      {/* Main Flow Card */}
      <section className="max-w-2xl mx-auto">
        {/* Step Progression Bar */}
        <div className="flex items-center justify-between mb-4 px-2">
          {[
            { id: "QUOTE", label: "1. Quote" },
            { id: "RECIPIENT", label: "2. Recipient" },
            { id: "REVIEW", label: "3. Review" },
            { id: "TRACK", label: "4. Track" },
          ].map((s, idx) => {
            const isCurrent = currentStep === s.id;
            const isPast =
              (currentStep === "RECIPIENT" && idx === 0) ||
              (currentStep === "REVIEW" && idx <= 1) ||
              (currentStep === "TRACK" && idx <= 2);

            return (
              <div key={s.id} className="flex items-center gap-1.5">
                <span
                  className={`text-xs font-mono font-semibold ${
                    isCurrent
                      ? "text-primary border-b-2 border-primary pb-0.5"
                      : isPast
                      ? "text-secondary"
                      : "text-outline"
                  }`}
                >
                  {s.label}
                </span>
                {idx < 3 && <span className="text-outline-variant text-xs">→</span>}
              </div>
            );
          })}
        </div>

        {/* Step 1: Quote Calculator */}
        {currentStep === "QUOTE" && (
          <QuoteCalculator
            onQuoteCalculated={handleQuoteCalculated}
            initialTargetCurrency={quote?.targetCurrency || "GBP"}
          />
        )}

        {/* Step 2: Recipient Form */}
        {currentStep === "RECIPIENT" && quote && (
          <RecipientForm
            corridor={quote.targetCurrency}
            onBack={() => setCurrentStep("QUOTE")}
            onSubmit={handleRecipientSubmitted}
          />
        )}

        {/* Step 3: Review & Confirm */}
        {currentStep === "REVIEW" && quote && recipient && (
          <ReviewConfirm
            quote={quote}
            recipient={recipient}
            onBack={() => setCurrentStep("RECIPIENT")}
            onSuccess={handleTransferCreated}
          />
        )}

        {/* Step 4: Live Status Tracker */}
        {currentStep === "TRACK" && activeTransfer && (
          <LiveTracker
            transferId={activeTransfer.id}
            onOpenReceipt={() => setIsReceiptOpen(true)}
            onStartNew={handleStartNew}
          />
        )}
      </section>

      {/* Corridor Rates Grid */}
      <section className="max-w-5xl mx-auto pt-8 border-t border-outline-variant/30">
        <div className="text-center mb-8">
          <h3 className="font-heading font-bold text-xl text-on-surface">
            Supported Settlement Corridors
          </h3>
          <p className="text-xs text-on-surface-variant mt-1">
            Real-time clearing across major international payment networks via Blaaiz RaaS
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              corridor: "United Kingdom",
              code: "GBP (£)",
              rail: "Faster Payments Service (FPS)",
              speed: "Within 10-30 mins",
              flag: "🇬🇧",
              features: "Sort Code & Account • CoP Check",
            },
            {
              corridor: "United States",
              code: "USD ($)",
              rail: "Automated Clearing House (ACH) & Wire",
              speed: "Same-day Fedwire / Next-day ACH",
              flag: "🇺🇸",
              features: "ABA Routing • Checking & Savings",
            },
            {
              corridor: "Eurozone",
              code: "EUR (€)",
              rail: "Single Euro Payments Area (SEPA)",
              speed: "SEPA Instant Settlement",
              flag: "🇪🇺",
              features: "IBAN • BIC / Swift Validation",
            },
            {
              corridor: "Canada",
              code: "CAD (C$)",
              rail: "Interac e-Transfer Rail",
              speed: "Instant autodeposit",
              flag: "🇨🇦",
              features: "Email • No transit number needed",
            },
          ].map((card, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-2 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl" role="img" aria-label={card.corridor}>
                  {card.flag}
                </span>
                <span className="font-mono text-xs font-bold text-primary">
                  {card.code}
                </span>
              </div>
              <h4 className="font-heading font-bold text-sm text-on-surface">
                {card.corridor}
              </h4>
              <p className="text-xs text-on-surface-variant font-mono">
                {card.rail}
              </p>
              <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[11px]">
                <span className="text-secondary font-medium">{card.speed}</span>
                <span className="text-slate-400 font-mono text-[10px]">{card.features}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Official Receipt Modal */}
      {activeTransfer && (
        <ReceiptModal
          transfer={activeTransfer}
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
        />
      )}
    </div>
  );
}
