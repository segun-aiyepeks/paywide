import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, ExternalLink, Globe } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-outline-variant/40 bg-surface-container-low text-on-surface-variant text-xs mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Regulatory Disclosure Banner */}
        <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-5 mb-8 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded bg-secondary/10 text-secondary shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-semibold text-on-surface text-sm mb-1">
                Regulatory Disclosure &amp; Banking Rails
              </h4>
              <p className="text-on-surface-variant leading-relaxed text-xs">
                <strong>WayPay is a financial technology software interface and is NOT a bank, licensed deposit institution, or foreign exchange dealer.</strong> Remittance-as-a-Service, cross-border payouts, foreign exchange conversions, and fund custody are provided exclusively by <strong>Blaaiz</strong> (api-dev.blaaiz.com / blaaiz.com) and its regulated partner financial institutions. WayPay never holds customer funds directly.
              </p>
            </div>
          </div>
        </div>

        {/* Links & Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-outline-variant/30">
          <div>
            <div className="font-heading font-bold text-base text-primary mb-2">WayPay</div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Institutional-grade cross-border remittance engineered for total transparency, deterministic integer arithmetic, and live status observability.
            </p>
          </div>

          <div>
            <h5 className="font-semibold text-on-surface uppercase tracking-wider text-[11px] mb-3">
              Active Corridors
            </h5>
            <ul className="space-y-1.5 text-xs">
              <li className="flex items-center gap-1.5">
                <span className="font-mono text-primary font-bold">NGN → GBP</span> (UK Faster Payments)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="font-mono text-primary font-bold">NGN → USD</span> (US ACH &amp; Wire)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="font-mono text-primary font-bold">NGN → EUR</span> (SEPA &amp; Instant)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="font-mono text-primary font-bold">NGN → CAD</span> (Interac e-Transfer)
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-on-surface uppercase tracking-wider text-[11px] mb-3">
              Developer &amp; Hackathon
            </h5>
            <ul className="space-y-1.5 text-xs">
              <li>
                <a
                  href="https://blaaiz.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary flex items-center gap-1"
                >
                  <span>Blaaiz RaaS Platform</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://docs.blaaiz.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary flex items-center gap-1"
                >
                  <span>Blaaiz API Documentation</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li className="text-slate-500">
                <span>GDG Ilorin Buildathon 2026</span>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-on-surface uppercase tracking-wider text-[11px] mb-3">
              Security Architecture
            </h5>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-secondary">
                <Lock className="w-3.5 h-3.5" />
                <span>HMAC-SHA256 Webhooks</span>
              </div>
              <div className="flex items-center gap-1.5 text-secondary">
                <Lock className="w-3.5 h-3.5" />
                <span>Zero Float Integer Minor Units</span>
              </div>
              <div className="flex items-center gap-1.5 text-secondary">
                <Lock className="w-3.5 h-3.5" />
                <span>Idempotency-Key Enforced</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-on-surface-variant/80">
          <div>
            &copy; {new Date().getFullYear()} WayPay. Built for Blaaiz Buildathon.
          </div>
          <div className="flex items-center gap-4">
            <span>Server-side Blaaiz Node.js SDK v1.7.0</span>
            <span>TypeScript Strict</span>
            <span>Prisma SQLite</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
