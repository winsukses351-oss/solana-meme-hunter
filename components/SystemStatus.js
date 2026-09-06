"use client";

import { useState, useEffect } from "react";

export default function SystemStatus() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Only real frontend initialization logs
    const now = new Date().toISOString().split("T")[1].slice(0, 8);
    setLogs([
      `[${now}] INFO: Frontend initialized`,
      `[${now}] INFO: Phase 1 dashboard loaded`,
    ]);
  }, []);

  const systemHealth = [
    "DATABASE NOT CONNECTED",
    "SOLANA RPC NOT CONNECTED",
    "MARKET DATA NOT CONNECTED",
    "WALLET / SIGNER NOT CONNECTED",
    "EXECUTION PROVIDER NOT CONNECTED",
    "SAFETY ENGINE NOT CONNECTED",
    "RISK ENGINE NOT CONNECTED",
    "DECISION ENGINE NOT CONNECTED",
    "POSITION MONITOR NOT CONNECTED",
    "CONFIRMATION NOT CONNECTED",
    "RECONCILIATION NOT CONNECTED",
    "DUPLICATE PROTECTION NOT CONNECTED",
    "BACKGROUND WORKERS NOT CONNECTED",
  ];

  const apiHealth = [
    { provider: "Birdeye", status: "NOT CONNECTED" },
    { provider: "DexScreener", status: "NOT CONNECTED" },
    { provider: "Jupiter", status: "NOT CONNECTED" },
    { provider: "Solana RPC", status: "NOT CONNECTED" },
    { provider: "PostgreSQL", status: "NOT CONNECTED" },
    { provider: "Backend API", status: "NOT CONNECTED" },
  ];

  return (
    <div className="space-y-4">
      {/* Trading Status & Emergency Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trading Status Banner */}
        <section className="lg:col-span-2 bg-[#121721] border border-red-900/50 rounded-lg p-3 sm:p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                TRADING STATUS
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800">
                BLOCKED
              </span>
            </div>
            <div className="text-sm font-mono font-bold text-slate-200 mt-1">
              Reason: Live trading is not available in Phase 1.
            </div>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Current state: BLOCKED — Foundation UI only
            </p>
          </div>
        </section>

        {/* Emergency Stop Panel */}
        <section className="bg-[#121721] border border-slate-800 rounded-lg p-3 sm:p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Emergency Controls
              </span>
            </div>
            <button
              disabled
              className="w-full py-2 bg-red-950/40 border border-red-800/50 text-red-500/60 font-mono text-xs font-bold rounded cursor-not-allowed uppercase"
            >
              EMERGENCY STOP
            </button>
            <p className="text-[10px] font-mono text-slate-500 text-center mt-2">
              Backend kill switch not connected.
            </p>
          </div>
        </section>
      </div>

      {/* System Health & API Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* System Health */}
        <section className="bg-[#121721] border border-slate-800 rounded-lg p-3 sm:p-4">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 border-b border-slate-800/80 pb-2">
            System Health
          </h2>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {systemHealth.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-[#0b0e14] px-2.5 py-1.5 rounded border border-slate-800/50 text-[11px] font-mono"
              >
                <span className="text-slate-400">{item.split(" ")[0]} ...</span>
                <span className="text-red-400/80 font-semibold">NOT CONNECTED</span>
              </div>
            ))}
          </div>
        </section>

        {/* API Health */}
        <section className="bg-[#121721] border border-slate-800 rounded-lg p-3 sm:p-4">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 border-b border-slate-800/80 pb-2">
            API Health
          </h2>
          <div className="space-y-2">
            {apiHealth.map((api, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-[#0b0e14] px-3 py-2 rounded border border-slate-800/60 text-xs font-mono"
              >
                <span className="text-slate-300 font-medium">{api.provider}</span>
                <span className="text-red-400/80 text-[11px]">{api.status}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* System Logs */}
      <section className="bg-[#121721] border border-slate-800 rounded-lg p-3 sm:p-4">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 border-b border-slate-800/80 pb-2">
          System Logs
        </h2>
        <div className="bg-[#0b0e14] border border-slate-800 rounded p-2.5 font-mono text-[11px] text-slate-400 space-y-1 min-h-[80px]">
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </section>

      {/* Settings */}
      <section className="bg-[#121721] border border-slate-800 rounded-lg p-3 sm:p-4">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 border-b border-slate-800/80 pb-2">
          Settings
        </h2>
        <div className="bg-[#0b0e14] border border-slate-800/60 rounded p-3 text-center">
          <p className="text-xs font-mono text-slate-400 font-semibold">
            Settings backend not connected.
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Configuration panels will be available after the backend is integrated.
          </p>
        </div>
      </section>
    </div>
  );
}
