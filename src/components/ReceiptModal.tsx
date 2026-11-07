"use client";

import React from "react";
import { X, Printer, CheckCircle2, ShieldCheck, ArrowRightLeft, Building } from "lucide-react";
import { formatMoney } from "../domain/money";

interface ReceiptModalProps {
  transfer: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ReceiptModal({ transfer, isOpen, onClose }: ReceiptModalProps) {
  if (!isOpen || !transfer) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Receipt Header Actions */}
        <div className="bg-surface-container-low px-6 py-3 border-b border-outline-variant/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-secondary" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-on-surface">
              Official Transfer Receipt
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div className="p-8 sm:p-10 space-y-6">
          {/* Brand & Reference */}
          <div className="flex items-start justify-between pb-6 border-b border-outline-variant/40">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <span className="font-heading text-xl font-bold text-primary">PayWide</span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Remittance-as-a-Service Rails by Blaaiz
              </p>
            </div>

            <div className="text-right font-mono text-xs">
              <div className="text-on-surface-variant text-[10px] uppercase">Transaction Ref</div>
              <div className="font-bold text-on-surface">{transfer.reference}</div>
              <div className="text-[11px] text-secondary font-semibold mt-1">
                {transfer.status === "COMPLETED" ? "SETTLED / COMPLETED" : transfer.status}
              </div>
            </div>
          </div>

          {/* Amount Paid Big Display */}
          <div className="text-center py-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
            <span className="text-xs font-mono uppercase tracking-wider text-on-surface-variant">
              Net Beneficiary Payout
            </span>
            <div className="font-heading text-3xl sm:text-4xl font-extrabold text-primary tabular-nums mt-1">
              {formatMoney(BigInt(transfer.targetAmountMinor), 2)} {transfer.targetCurrency}
            </div>
            <p className="text-xs text-secondary font-medium mt-1">
              Transferred via {transfer.corridor || transfer.targetCurrency} Clearing Network
            </p>
          </div>

          {/* Details Breakdown */}
          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between py-1.5 border-b border-outline-variant/20">
              <span className="text-on-surface-variant">Date &amp; Time:</span>
              <span className="text-on-surface font-medium">
                {new Date(transfer.createdAt).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-outline-variant/20">
              <span className="text-on-surface-variant">Amount Debited (NGN):</span>
              <span className="text-on-surface font-semibold">
                ₦{formatMoney(BigInt(transfer.sourceAmountMinor), 2)} NGN
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-outline-variant/20">
              <span className="text-on-surface-variant">Blaaiz Network Fee:</span>
              <span className="text-on-surface font-medium">
                ₦{formatMoney(BigInt(transfer.feeMinor), 2)} NGN
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-outline-variant/20">
              <span className="text-on-surface-variant">Guaranteed Exchange Rate:</span>
              <span className="text-on-surface font-medium">
                1 {transfer.targetCurrency} = {Math.round(1 / (transfer.exchangeRate || 0.000625)).toLocaleString()} NGN
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-outline-variant/20">
              <span className="text-on-surface-variant">Beneficiary Name:</span>
              <span className="text-on-surface font-bold">
                {transfer.recipientName || "Authorized Payee"}
              </span>
            </div>

            {transfer.blaaizPayoutId && (
              <div className="flex justify-between py-1.5 border-b border-outline-variant/20">
                <span className="text-on-surface-variant">Blaaiz Core Payout ID:</span>
                <span className="text-primary font-semibold">
                  {transfer.blaaizPayoutId}
                </span>
              </div>
            )}
          </div>

          {/* Compliance & Regulatory footer */}
          <div className="pt-4 border-t border-outline-variant/40 text-[10px] text-on-surface-variant/80 text-center leading-relaxed">
            <p>
              PayWide is a software technology interface. Banking, remittance, foreign exchange conversion, and destination settlement are fulfilled under license by Blaaiz and partner depository banks.
            </p>
            <p className="mt-1 font-mono text-slate-400">
              Digitally sealed • Non-repudiable audit trail
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
