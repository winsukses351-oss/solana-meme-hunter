"use client";

import { useState, useEffect } from "react";

export default function SystemStatus({
  backendStatus = "CHECKING",
  dbStatus = "CHECKING",
  solanaRpcData = null,
  marketDataHealth = null,
  hunterData = null,
}) {
  const [logs, setLogs] = useState([]);

  const rpcStatus = solanaRpcData?.status || "CHECKING";
  const marketStatus = marketDataHealth?.status || "CHECKING";
  const hunterStatus = hunterData?.status || "CHECKING";
  const birdeyeStatus = marketDataHealth?.birdeyeStatus || "NOT_CONFIGURED";
  const dexscreenerStatus = marketDataHealth?.dexScreenerStatus || "CHECKING";

  useEffect(() => {
    const now = new Date().toISOString().split("T")[1].slice(0, 8);

    let hunterLogMsg = `TOKEN HUNTER: Not configured`;
    if (hunterStatus === "CONNECTED") {
      hunterLogMsg = `TOKEN HUNTER: Active (${hunterData?.candidateCount ?? 0} Candidates Found)`;
    } else if (hunterStatus === "ERROR") {
      hunterLogMsg = `TOKEN HUNTER: Engine offline`;
    }

    const initialLogs = [
      `[${now}] INFO: Terminal Phase 1–5 active`,
      `[${now}] BACKEND: API status -> ${backendStatus}`,
      `[${now}] DATABASE: Connection status -> ${dbStatus}`,
      `[${now}] SOLANA RPC: ${rpcStatus}`,
      `[${now}] MARKET DATA: ${marketStatus} via ${marketDataHealth?.activeProvider || "none"}`,
      `[${now}] ${hunterLogMsg}`,
    ];
    setLogs(initialLogs);
  }, [
    backendStatus,
    dbStatus,
    rpcStatus,
    marketStatus,
    hunterStatus,
    hunterData?.candidateCount,
    marketDataHealth?.activeProvider,
  ]);

  const getDbDisplayStatus = () => {
    if (dbStatus === "connected") return "CONNECTED";
    if (dbStatus === "not_configured") return "NOT CONFIGURED";
    if (dbStatus === "error") return "ERROR";
    return "CHECKING...";
  };

  const getRpcDisplayStatus = () => {
    if (rpcStatus === "CONNECTED") return "CONNECTED";
    if (rpcStatus === "NOT_CONFIGURED") return "NOT CONFIGURED";
    if (rpcStatus === "ERROR") return "ERROR";
    return "CHECKING...";
  };

  const getMarketDisplayStatus = () => {
    if (marketStatus === "CONNECTED") return "CONNECTED";
    if (marketStatus === "NOT_CONFIGURED") return "NOT CONFIGURED";
    if (marketStatus === "ERROR") return "ERROR";
    return "CHECKING...";
  };

  const getHunterDisplayStatus = () => {
    if (hunterStatus === "CONNECTED") return "CONNECTED";
    if (hunterStatus === "NOT_CONFIGURED") return "NOT CONFIGURED";
    if (hunterStatus === "ERROR") return "ERROR";
    return "CHECKING...";
  };

  const getProviderDisplay = (statusStr) => {
    if (statusStr === "CONNECTED") return "CONNECTED";
    if (statusStr === "NOT_CONFIGURED") return "NOT CONFIGURED";
    if (statusStr === "ERROR") return "ERROR";
    return "NOT CONNECTED";
  };

  const systemHealth = [
    { label: "DATABASE", status: getDbDisplayStatus() },
    { label: "SOLANA RPC", status: getRpcDisplayStatus() },
    { label: "MARKET DATA", status: getMarketDisplayStatus() },
    { label: "TOKEN HUNTER ENGINE", status: getHunterDisplayStatus() },
    { label: "WALLET / SIGNER", status: "NOT CONNECTED" },
    { label: "EXECUTION PROVIDER", status: "NOT CONNECTED" },
    { label: "SAFETY ENGINE", status: "NOT CONNECTED" },
    { label: "RISK ENGINE", status: "NOT CONNECTED" },
    { label: "DECISION ENGINE", status: "NOT CONNECTED" },
    { label: "POSITION MONITOR", status: "NOT CONNECTED" },
    { label: "CONFIRMATION", status: "NOT CONNECTED" },
    { label: "RECONCILIATION", status: "NOT CONNECTED" },
    { label: "DUPLICATE PROTECTION", status: "NOT CONNECTED" },
    { label: "BACKGROUND WORKERS", status: "NOT CONNECTED" },
  ];

  const apiHealth = [
    { provider: "Birdeye", status: getProviderDisplay(birdeyeStatus) },
    { provider: "DexScreener", status: getProviderDisplay(dexscreenerStatus) },
    { provider: "Token Hunter Engine", status: getHunterDisplayStatus() },
    { provider: "Solana RPC", status: getRpcDisplayStatus() },
    { provider: "PostgreSQL", status: getDbDisplayStatus() },
    { provider: "Backend API", status: backendStatus === "connected" ? "CONNECTED" : "ERROR" },
  ];

  return (
    <div className="space-y-4">
      {/* Trading Status & Emergency Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
              Reason: Token Hunter candidate discovery active. Live trading remains disabled in Phase 5.
            </div>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Current state: BLOCKED — Read-Only Candidate Discovery & Ranking
            </p>
          </div>
        </section>

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
              Execution engine not connected.
            </p>
          </div>
        </section>
      </div>

      {/* Solana Telemetry Banner */}
      {rpcStatus === "CONNECTED" && solanaRpcData && (
        <section className="bg-[#121721] border border-emerald-900/40 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Solana Mainnet Telemetry (Real-time RPC)
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Network: <strong className="text-slate-200 uppercase">{solanaRpcData.network || "mainnet-beta"}</strong>
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
            <div className="bg-[#0b0e14] p-2 rounded border border-slate-800/60">
              <div className="text-[10px] text-slate-500">CURRENT SLOT</div>
              <div className="text-slate-200 font-bold">{solanaRpcData.slot?.toLocaleString() || "N/A"}</div>
            </div>
            <div className="bg-[#0b0e14] p-2 rounded border border-slate-800/60">
              <div className="text-[10px] text-slate-500">BLOCK HEIGHT</div>
              <div className="text-slate-200 font-bold">{solanaRpcData.blockHeight?.toLocaleString() || "N/A"}</div>
            </div>
            <div className="bg-[#0b0e14] p-2 rounded border border-slate-800/60">
              <div className="text-[10px] text-slate-500">LATENCY</div>
              <div className="text-emerald-400 font-bold">{solanaRpcData.latencyMs ?? "N/A"} ms</div>
            </div>
            <div className="bg-[#0b0e14] p-2 rounded border border-slate-800/60">
              <div className="text-[10px] text-slate-500">EPOCH</div>
              <div className="text-slate-200 font-bold">{solanaRpcData.epoch ?? "N/A"}</div>
            </div>
          </div>
        </section>
      )}

      {/* System Health & API Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <span className="text-slate-400">{item.label} ...</span>
                <span
                  className={`font-semibold ${
                    item.status === "CONNECTED"
                      ? "text-emerald-400"
                      : item.status === "NOT CONFIGURED"
                      ? "text-amber-400"
                      : "text-red-400/80"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </section>

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
                <span
                  className={`text-[11px] font-semibold ${
                    api.status === "CONNECTED"
                      ? "text-emerald-400"
                      : api.status === "NOT CONFIGURED"
                      ? "text-amber-400"
                      : "text-red-400/80"
                  }`}
                >
                  {api.status}
                </span>
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
            Configuration panels will be available after the full engine integration.
          </p>
        </div>
      </section>
    </div>
  );
}
