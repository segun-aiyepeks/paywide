"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, Terminal, CheckCircle2, ShieldCheck } from "lucide-react";

interface SandboxBannerProps {
  onOpenInspector: () => void;
}

export function SandboxBanner({ onOpenInspector }: SandboxBannerProps) {
  const [callCount, setCallCount] = useState<number>(0);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);

  useEffect(() => {
    // Fetch initial logs count and gateway status
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/inspector/logs");
        if (res.ok) {
          const data = await res.json();
          setCallCount(data.totalCalls || 0);
          setIsLiveConnected(data.mode === "live");
        }
      } catch (err) {
        // quiet fallback
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside
      aria-label="Environment and Developer Tools"
      className="bg-primary text-white border-b border-primary/30 text-xs px-4 py-2 sticky top-0 z-40 shadow-sm"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono text-[11px] font-semibold bg-amber-400 text-slate-950">
            {isLiveConnected ? "BLAAIZ SANDBOX LIVE" : "BLAAIZ SIMULATOR / MOCK"}
          </span>
          <span className="text-slate-200 hidden sm:inline">
            {isLiveConnected
              ? "Connected to api-dev.blaaiz.com sandbox credentials."
              : "No live credentials provided in env. Honor-accurate Blaaiz RaaS contracts active."}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-secondary-fixed" />
            <span>Strict Zero-Float Math &amp; Idempotency Active</span>
          </div>

          <button
            onClick={onOpenInspector}
            className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 active:bg-white/25 text-white px-2.5 py-1 rounded transition-colors border border-white/20"
            title="Inspect raw Blaaiz requests and responses"
          >
            <Terminal className="w-3.5 h-3.5 text-amber-300" />
            <span className="font-medium">Blaaiz Inspector</span>
            {callCount > 0 && (
              <span className="bg-secondary text-white font-mono px-1.5 py-0.2 rounded-full text-[10px]">
                {callCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
