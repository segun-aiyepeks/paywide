"use client";

import React from "react";
import Link from "next/link";
import { ArrowRightLeft, ShieldCheck, Terminal, History, Send } from "lucide-react";

interface HeaderProps {
  onOpenInspector: () => void;
}

export function Header({ onOpenInspector }: HeaderProps) {
  return (
    <header className="border-b border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur sticky top-[37px] z-30 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-xl font-bold tracking-tight text-primary">
                PayWide
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-secondary/10 text-secondary border border-secondary/20">
                Blaaiz RaaS
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-none">
              Institutional Zero-Float Remittance
            </p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1 sm:gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-on-surface hover:text-primary hover:bg-surface-container transition-colors"
          >
            <Send className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">Send Money</span>
          </Link>

          <Link
            href="/transfers"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-on-surface hover:text-primary hover:bg-surface-container transition-colors"
          >
            <History className="w-4 h-4 text-primary" />
            <span>Activity</span>
          </Link>

          <button
            onClick={onOpenInspector}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 transition-colors ml-2"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Inspector</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
