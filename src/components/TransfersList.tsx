"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Filter, ArrowRight, RefreshCw, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { formatMoney } from "../domain/money";
import { getStatusCopy, getStatusColor, TransferStatus } from "../domain/status";

export function TransfersList() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCorridor, setSelectedCorridor] = useState<string>("ALL");

  const fetchTransfers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/transfers");
      if (res.ok) {
        const data = await res.json();
        setTransfers(data.transfers || []);
      }
    } catch (err) {
      console.error("Failed to load transfers", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const filteredTransfers = transfers.filter((tx) => {
    const matchesCorridor =
      selectedCorridor === "ALL" || tx.targetCurrency === selectedCorridor;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !searchQuery ||
      tx.reference?.toLowerCase().includes(q) ||
      tx.recipientName?.toLowerCase().includes(q) ||
      tx.blaaizPayoutId?.toLowerCase().includes(q);
    return matchesCorridor && matchesQuery;
  });

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-6 sm:p-8 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-outline-variant/30">
        <div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-on-surface">
            Transfer Activity &amp; Audit Log
          </h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Real-time history of cross-border transfers initiated through the Blaaiz RaaS gateway
          </p>
        </div>

        <button
          onClick={fetchTransfers}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container text-xs font-medium transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-on-surface-variant" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by reference, recipient, or Blaaiz payout ID..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-low text-xs"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "GBP", "USD", "EUR", "CAD"].map((corr) => (
            <button
              key={corr}
              onClick={() => setSelectedCorridor(corr)}
              className={`px-3 py-2 rounded-lg text-xs font-mono font-medium transition whitespace-nowrap ${
                selectedCorridor === corr
                  ? "bg-primary text-white"
                  : "bg-surface-container hover:bg-surface-container-high text-on-surface"
              }`}
            >
              {corr}
            </button>
          ))}
        </div>
      </div>

      {/* List / Table */}
      {isLoading ? (
        <div className="py-12 text-center text-on-surface-variant text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
          <span>Loading transactions...</span>
        </div>
      ) : filteredTransfers.length === 0 ? (
        <div className="py-12 text-center text-on-surface-variant text-xs border border-dashed border-outline-variant rounded-xl p-8">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-40 text-on-surface-variant" />
          <p className="font-semibold text-sm text-on-surface">No transfers found</p>
          <p className="mt-1">
            {searchQuery || selectedCorridor !== "ALL"
              ? "Try adjusting your search criteria or corridor filter."
              : "You haven't initiated any cross-border transfers yet."}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary-container transition"
          >
            <span>Initiate Transfer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-outline-variant/30">
          {filteredTransfers.map((tx) => {
            const status: TransferStatus = tx.status;
            const statusCopy = getStatusCopy(status);
            const statusColors = getStatusColor(status);

            return (
              <div
                key={tx.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-container-low px-2 rounded-lg transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-xs text-primary">
                      {tx.reference}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}
                    >
                      {statusCopy.title}
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant">
                      NGN → {tx.targetCurrency}
                    </span>
                  </div>

                  <div className="text-xs text-on-surface font-medium">
                    {tx.recipientName || "Recipient"} • {tx.narration || "Family Support"}
                  </div>

                  <div className="text-[11px] text-on-surface-variant font-mono">
                    {new Date(tx.createdAt).toLocaleString()}
                    {tx.blaaizPayoutId && (
                      <span className="ml-2 text-slate-400">
                        Blaaiz ID: {tx.blaaizPayoutId}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6">
                  <div className="text-left sm:text-right font-mono">
                    <div className="font-heading font-bold text-sm text-on-surface">
                      {formatMoney(BigInt(tx.targetAmountMinor), 2)} {tx.targetCurrency}
                    </div>
                    <div className="text-[11px] text-on-surface-variant">
                      ₦{formatMoney(BigInt(tx.sourceAmountMinor), 2)} NGN
                    </div>
                  </div>

                  <Link
                    href={`/transfers/${tx.id}`}
                    className="p-2 rounded-lg border border-outline-variant hover:border-primary text-on-surface hover:text-primary transition"
                    title="Track Transfer"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
