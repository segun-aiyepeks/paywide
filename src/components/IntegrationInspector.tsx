"use client";

import React, { useState, useEffect } from "react";
import { X, RefreshCw, Terminal, Check, Copy, ExternalLink, Shield } from "lucide-react";

interface CallLog {
  timestamp: string;
  method: string;
  endpoint: string;
  mode: "LIVE" | "MOCK";
  status: number;
  durationMs: number;
  requestPayload: any;
  responsePayload: any;
}

interface IntegrationInspectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IntegrationInspector({ isOpen, onClose }: IntegrationInspectorProps) {
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [mode, setMode] = useState<string>("mock");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedLog, setSelectedLog] = useState<CallLog | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/inspector/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setMode(data.mode || "mock");
        if (data.logs && data.logs.length > 0 && !selectedLog) {
          setSelectedLog(data.logs[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load inspector logs", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    if (filter === "ALL") return true;
    if (filter === "PAYOUT") return log.endpoint.includes("payout");
    if (filter === "QUOTE") return log.endpoint.includes("currencies") || log.endpoint.includes("fee");
    if (filter === "VERIFY") return log.endpoint.includes("payee") || log.endpoint.includes("iban") || log.endpoint.includes("bank");
    return true;
  });

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-4xl bg-slate-900 text-slate-100 h-full flex flex-col shadow-2xl border-l border-slate-800 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-primary/20 text-blue-400 border border-primary/40">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-semibold text-white text-base">
                  Blaaiz RaaS Integration Inspector
                </h2>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  {mode.toUpperCase()} MODE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Auditing server-side Blaaiz SDK contracts, idempotency keys, and webhook signatures
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
              title="Refresh logs"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 mr-1">Filter:</span>
            {["ALL", "PAYOUT", "QUOTE", "VERIFY"].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-2.5 py-1 rounded font-mono transition text-[11px] ${
                  filter === cat
                    ? "bg-primary text-white font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="text-slate-400 font-mono text-[11px]">
            {filteredLogs.length} call{filteredLogs.length === 1 ? "" : "s"} recorded
          </div>
        </div>

        {/* Main Content: Split pane */}
        <div className="flex-1 flex overflow-hidden">
          {/* Logs List */}
          <div className="w-2/5 border-r border-slate-800 overflow-y-auto divide-y divide-slate-800/60 font-mono text-xs">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Terminal className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No API calls recorded yet.</p>
                <p className="text-[11px] mt-1 text-slate-600">
                  Calculate a quote or submit a transfer to inspect API telemetry.
                </p>
              </div>
            ) : (
              filteredLogs.map((log, idx) => {
                const isSelected = selectedLog === log;
                const isSuccess = log.status >= 200 && log.status < 300;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedLog(log)}
                    className={`p-3 cursor-pointer transition select-none ${
                      isSelected ? "bg-slate-800 text-white" : "hover:bg-slate-800/40 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          log.method === "POST"
                            ? "bg-blue-900/60 text-blue-300 border border-blue-700/50"
                            : "bg-emerald-900/60 text-emerald-300 border border-emerald-700/50"
                        }`}
                      >
                        {log.method}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          isSuccess
                            ? "text-emerald-400 bg-emerald-950/40"
                            : "text-red-400 bg-red-950/40"
                        }`}
                      >
                        HTTP {log.status}
                      </span>
                    </div>

                    <div className="font-semibold text-slate-200 truncate" title={log.endpoint}>
                      {log.endpoint}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span>{log.durationMs}ms</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Details Pane */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 font-mono text-xs bg-slate-950/40">
            {selectedLog ? (
              <>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                      Endpoint &amp; Metadata
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Executed at: {new Date(selectedLog.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-emerald-400">
                    {selectedLog.method} {selectedLog.endpoint}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-slate-300 text-[11px]">
                    <span>Mode: <strong className="text-amber-300">{selectedLog.mode}</strong></span>
                    <span>Status: <strong className="text-emerald-300">{selectedLog.status}</strong></span>
                    <span>Latency: <strong>{selectedLog.durationMs} ms</strong></span>
                  </div>
                </div>

                {/* Request Payload */}
                <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden">
                  <div className="bg-slate-850 px-3 py-2 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                      Request Payload (Sanitized)
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(JSON.stringify(selectedLog.requestPayload, null, 2), 1)
                      }
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                    >
                      {copiedIndex === 1 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedIndex === 1 ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <pre className="p-3 text-[11px] text-blue-200 overflow-x-auto whitespace-pre-wrap max-h-56">
                    {JSON.stringify(selectedLog.requestPayload, null, 2) || "Empty Body"}
                  </pre>
                </div>

                {/* Response Payload */}
                <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden">
                  <div className="bg-slate-850 px-3 py-2 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                      Blaaiz Response Payload
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(JSON.stringify(selectedLog.responsePayload, null, 2), 2)
                      }
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                    >
                      {copiedIndex === 2 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedIndex === 2 ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <pre className="p-3 text-[11px] text-emerald-300 overflow-x-auto whitespace-pre-wrap max-h-72">
                    {JSON.stringify(selectedLog.responsePayload, null, 2)}
                  </pre>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                Select a call from the left to inspect raw payloads
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-secondary" />
            <span>API secrets &amp; bearer credentials are redacted server-side.</span>
          </div>
          <span>Blaaiz RaaS Spec v1.7.0</span>
        </div>
      </div>
    </div>
  );
}
