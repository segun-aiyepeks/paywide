"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  Copy,
  Check,
  Zap,
  RefreshCw,
  AlertCircle,
  FileText,
  ShieldCheck,
  Building,
  ExternalLink,
} from "lucide-react";
import { formatMoney } from "../domain/money";
import { getStatusCopy, getStatusColor, TransferStatus } from "../domain/status";

interface LiveTrackerProps {
  transferId: string;
  onOpenReceipt: (transfer?: any) => void;
  onStartNew: () => void;
}

export function LiveTracker({ transferId, onOpenReceipt, onStartNew }: LiveTrackerProps) {
  const [transfer, setTransfer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSimulatingFunding, setIsSimulatingFunding] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Fetch transfer details
  const fetchTransfer = async () => {
    try {
      const res = await fetch(`/api/transfers/${transferId}`);
      if (res.ok) {
        const data = await res.json();
        setTransfer(data);
      }
    } catch (err) {
      console.error("Failed to fetch transfer", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfer();

    // Setup Server-Sent Events (SSE) for live push updates
    const eventSource = new EventSource(`/api/transfers/${transferId}/events`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "STATUS_UPDATE" || data.type === "TRANSFER_UPDATE") {
          setTransfer(data.transfer);
          setSyncNotice("Live webhook event received via Blaaiz SSE");
          setTimeout(() => setSyncNotice(null), 3000);
        }
      } catch (err) {
        console.error("Error parsing SSE message", err);
      }
    };

    eventSource.onerror = () => {
      // Quietly close on error and rely on polling fallback
      eventSource.close();
    };

    // Polling fallback every 4 seconds
    const interval = setInterval(() => {
      fetchTransfer();
    }, 4000);

    return () => {
      eventSource.close();
      clearInterval(interval);
    };
  }, [transferId]);

  // Simulate funding action in sandbox
  const handleSimulateFunding = async () => {
    setIsSimulatingFunding(true);
    try {
      const res = await fetch(`/api/transfers/${transferId}/fund`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setTransfer(data.transfer);
        setSyncNotice("Simulated deposit processed: Blaaiz collection webhook triggered!");
        setTimeout(() => setSyncNotice(null), 4000);
      }
    } catch (err) {
      console.error("Failed to simulate funding", err);
    } finally {
      setIsSimulatingFunding(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (isLoading && !transfer) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-12 text-center shadow-sm">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary mb-3" />
        <h3 className="font-heading font-semibold text-lg text-on-surface">
          Connecting to Blaaiz Status Gateway...
        </h3>
        <p className="text-xs text-on-surface-variant mt-1">
          Establishing real-time SSE stream for transfer {transferId}
        </p>
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-8 text-center shadow-sm">
        <AlertCircle className="w-8 h-8 mx-auto text-error mb-2" />
        <h3 className="font-heading font-semibold text-lg text-on-surface">Transfer Not Found</h3>
        <p className="text-xs text-on-surface-variant mt-1">
          Unable to locate transaction record for ID {transferId}.
        </p>
        <button
          onClick={onStartNew}
          className="mt-4 px-4 py-2 bg-primary text-white rounded text-xs font-semibold"
        >
          Start New Transfer
        </button>
      </div>
    );
  }

  const status: TransferStatus = transfer.status;
  const statusCopy = getStatusCopy(status);
  const statusColors = getStatusColor(status);

  // Stepper timeline steps
  const steps = [
    {
      id: "CREATED",
      title: "Transfer Created",
      description: "Rate locked and order registered with Blaaiz",
      completed: true,
    },
    {
      id: "AWAITING_FUNDS",
      title: "Waiting for your payment",
      description: "Awaiting NGN deposit into dedicated virtual account",
      completed: status !== "CREATED",
      active: status === "AWAITING_FUNDS" || status === "CREATED",
    },
    {
      id: "PROCESSING",
      title: "On its way",
      description: "Currency exchange & clearing on destination rail",
      completed: status === "COMPLETED",
      active: status === "PROCESSING",
    },
    {
      id: "COMPLETED",
      title: status === "FAILED" ? "Couldn't complete" : "Delivered",
      description:
        status === "FAILED"
          ? "Payment failed. Funds will be refunded to origin account."
          : `Funds received in beneficiary's ${transfer.targetCurrency} account`,
      completed: status === "COMPLETED",
      failed: status === "FAILED",
      active: status === "COMPLETED" || status === "FAILED",
    },
  ];

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-6 sm:p-8 shadow-sm">
      {/* Step Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-bold">
              Step 4 of 4 • Live Status Tracker
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-secondary/15 text-secondary border border-secondary/30">
              REAL-TIME SSE
            </span>
          </div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-on-surface mt-1">
            Tracking {transfer.reference}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenReceipt(transfer)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container text-xs font-medium transition"
          >
            <FileText className="w-3.5 h-3.5 text-primary" />
            <span>Official Receipt</span>
          </button>
        </div>
      </div>

      {/* Sync notification toast */}
      {syncNotice && (
        <div className="mb-4 p-2.5 rounded bg-secondary/10 border border-secondary/20 text-secondary text-xs flex items-center justify-between animate-in fade-in">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {syncNotice}
          </span>
          <span className="font-mono text-[10px] opacity-75">Just now</span>
        </div>
      )}

      {/* Main Status Hero */}
      <div className={`rounded-xl border p-6 mb-8 transition-colors ${statusColors.bg} ${statusColors.border}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${statusColors.bg} border ${statusColors.border}`}>
              {status === "COMPLETED" ? (
                <CheckCircle2 className={`w-6 h-6 ${statusColors.text}`} />
              ) : status === "FAILED" ? (
                <AlertCircle className={`w-6 h-6 ${statusColors.text}`} />
              ) : (
                <RefreshCw className={`w-6 h-6 ${statusColors.text} animate-spin`} />
              )}
            </div>
            <div>
              <div className="text-xs uppercase font-mono font-bold tracking-wider text-on-surface-variant">
                Current Status
              </div>
              <h3 className={`font-heading text-xl sm:text-2xl font-bold ${statusColors.text}`}>
                {statusCopy.title}
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">{statusCopy.description}</p>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[11px] font-mono text-on-surface-variant block">Payout Amount</span>
            <span className="font-heading text-xl font-bold text-primary">
              {formatMoney(BigInt(transfer.targetAmountMinor), 2)} {transfer.targetCurrency}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline Stepper */}
      <div className="mb-8">
        <h4 className="text-xs font-semibold text-on-surface uppercase tracking-wider mb-4">
          Settlement Timeline
        </h4>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-outline-variant/40">
          {steps.map((step, idx) => {
            let dotClass = "bg-surface-container border-outline-variant text-on-surface-variant";
            if (step.completed) {
              dotClass = "bg-secondary text-white border-secondary";
            } else if (step.active) {
              dotClass = "bg-primary text-white border-primary ring-4 ring-primary/20";
            }
            if (step.failed) {
              dotClass = "bg-error text-white border-error";
            }

            return (
              <div key={idx} className="relative flex items-start gap-4">
                <div
                  className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold ${dotClass}`}
                >
                  {step.completed ? "✓" : idx + 1}
                </div>
                <div>
                  <h5
                    className={`text-sm font-semibold ${
                      step.active ? "text-primary font-bold" : "text-on-surface"
                    }`}
                  >
                    {step.title}
                  </h5>
                  <p className="text-xs text-on-surface-variant mt-0.5">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sandbox Virtual Funding Bank Account Details Box */}
      {status === "AWAITING_FUNDS" && (
        <div className="bg-surface-container rounded-xl border border-outline-variant/60 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              <h4 className="font-heading font-bold text-sm text-on-surface">
                NGN Funding Account Details
              </h4>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
              Providus Bank / Wema
            </span>
          </div>

          <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
            Please make a local NGN bank transfer of the exact amount below to fund this cross-border transaction:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs mb-5">
            <div className="bg-surface-container-lowest p-3 rounded border border-outline-variant/40">
              <span className="text-[10px] text-on-surface-variant block uppercase">Bank Name</span>
              <span className="font-bold text-on-surface">Providus Bank (Blaaiz Virtual)</span>
            </div>

            <div className="bg-surface-container-lowest p-3 rounded border border-outline-variant/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-on-surface-variant block uppercase">Account Number</span>
                <span className="font-bold text-primary text-sm">
                  {transfer.virtualAccount || "9928341029"}
                </span>
              </div>
              <button
                onClick={() =>
                  copyToClipboard(transfer.virtualAccount || "9928341029", "acc")
                }
                className="text-on-surface-variant hover:text-primary p-1"
                title="Copy account number"
              >
                {copiedField === "acc" ? (
                  <Check className="w-4 h-4 text-secondary" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="bg-surface-container-lowest p-3 rounded border border-outline-variant/40">
              <span className="text-[10px] text-on-surface-variant block uppercase">Account Name</span>
              <span className="font-bold text-on-surface">PayWide / Blaaiz Escrow</span>
            </div>

            <div className="bg-surface-container-lowest p-3 rounded border border-outline-variant/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-on-surface-variant block uppercase">Exact Amount to Pay</span>
                <span className="font-bold text-primary text-sm">
                  ₦{formatMoney(BigInt(transfer.sourceAmountMinor), 2)} NGN
                </span>
              </div>
              <button
                onClick={() =>
                  copyToClipboard(
                    formatMoney(BigInt(transfer.sourceAmountMinor), 2).replace(/,/g, ""),
                    "amt"
                  )
                }
                className="text-on-surface-variant hover:text-primary p-1"
                title="Copy amount"
              >
                {copiedField === "amt" ? (
                  <Check className="w-4 h-4 text-secondary" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Sandbox Fast-Forward Simulator Action */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-xs text-primary">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Hackathon Sandbox Simulation</span>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                Simulate instant deposit to trigger the Blaaiz webhook and advance the state timeline.
              </p>
            </div>

            <button
              onClick={handleSimulateFunding}
              disabled={isSimulatingFunding}
              className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/90 active:scale-95 text-white font-mono text-xs font-bold flex items-center gap-2 transition shadow-sm shrink-0 cursor-pointer"
            >
              {isSimulatingFunding ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Simulating Webhook...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Simulate NGN Payment</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Transaction Identifiers Box */}
      <div className="bg-surface-container-low rounded-lg p-4 font-mono text-xs border border-outline-variant/40 space-y-2 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-on-surface-variant">PayWide Reference:</span>
          <span className="font-semibold text-on-surface flex items-center gap-1.5">
            {transfer.reference}
            <button
              onClick={() => copyToClipboard(transfer.reference, "ref")}
              className="text-on-surface-variant hover:text-primary"
            >
              {copiedField === "ref" ? <Check className="w-3 h-3 text-secondary" /> : <Copy className="w-3 h-3" />}
            </button>
          </span>
        </div>

        {transfer.blaaizPayoutId && (
          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant">Blaaiz Transaction ID:</span>
            <span className="font-semibold text-primary flex items-center gap-1.5">
              {transfer.blaaizPayoutId}
              <button
                onClick={() => copyToClipboard(transfer.blaaizPayoutId, "blz")}
                className="text-on-surface-variant hover:text-primary"
              >
                {copiedField === "blz" ? <Check className="w-3 h-3 text-secondary" /> : <Copy className="w-3 h-3" />}
              </button>
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-on-surface-variant">Initiated Date:</span>
          <span className="text-on-surface">
            {new Date(transfer.createdAt).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Bottom CTAs */}
      <div className="flex items-center justify-between pt-4 border-t border-outline-variant/30">
        <button
          onClick={onStartNew}
          className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container text-xs font-semibold transition"
        >
          Send Another Transfer
        </button>

        <button
          onClick={fetchTransfer}
          className="text-xs font-mono text-primary hover:text-primary-container flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-surface-container transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Status</span>
        </button>
      </div>
    </div>
  );
}
