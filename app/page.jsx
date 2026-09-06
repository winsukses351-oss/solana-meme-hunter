"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [health, setHealth] = useState(null);
  const [healthError, setHealthError] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleString("en-US", {
          hour12: false,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Real health fetch — no fake data
  useEffect(() => {
    let cancelled = false;

    async function fetchHealth() {
      setHealthLoading(true);
      setHealthError(null);
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!cancelled) {
          setHealth(data);
        }
      } catch (err) {
        if (!cancelled) {
          setHealthError(err.message || "Failed to reach backend");
          setHealth(null);
        }
      } finally {
        if (!cancelled) setHealthLoading(false);
      }
    }

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "scanner", label: "Scanner" },
    { id: "positions", label: "Positions" },
    { id: "trades", label: "Trades" },
    { id: "risk", label: "Risk" },
    { id: "settings", label: "Settings" },
  ];

  const metrics = [
    { label: "BALANCE", value: "--" },
    { label: "EQUITY", value: "--" },
    { label: "DAILY PNL", value: "--" },
    { label: "WEEKLY PNL", value: "--" },
    { label: "MONTHLY PNL", value: "--" },
    { label: "NET PROFIT", value: "--" },
    { label: "DRAWDOWN", value: "--" },
    { label: "WIN RATE", value: "--" },
    { label: "PROFIT FACTOR", value: "--" },
    { label: "OPEN POSITIONS", value: "--" },
    { label: "CLOSED TRADES", value: "--" },
    { label: "CURRENT RISK", value: "NOT CONNECTED" },
  ];

  const systemHealthItems = [
    "DATABASE",
    "SOLANA RPC",
    "MARKET DATA",
    "WALLET / SIGNER",
    "EXECUTION PROVIDER",
    "SAFETY ENGINE",
    "RISK ENGINE",
    "DECISION ENGINE",
    "POSITION MONITOR",
    "CONFIRMATION",
    "RECONCILIATION",
    "DUPLICATE PROTECTION",
    "BACKGROUND WORKERS",
  ];

  const apiProviders = [
    "Birdeye",
    "DexScreener",
    "Jupiter",
    "Solana RPC",
    "PostgreSQL",
    "Backend API",
  ];

  const riskConfigItems = [
    "Risk Per Trade",
    "Maximum Position Size",
    "Maximum Open Positions",
    "Daily Loss Limit",
    "Weekly Loss Limit",
    "Maximum Drawdown",
    "Minimum Liquidity",
    "Maximum Slippage",
    "Maximum Price Impact",
    "Minimum Opportunity Score",
    "Take Profit",
    "Stop Loss",
    "Trailing Stop",
    "Break Even",
    "Compounding",
  ];

  // Derive real statuses from health response
  const getDbStatus = () => {
    if (healthLoading) return "CHECKING...";
    if (healthError) return "ERROR";
    if (!health) return "NOT CONNECTED";
    return health.database?.status || "NOT CONNECTED";
  };

  const getBackendStatus = () => {
    if (healthLoading) return "CHECKING...";
    if (healthError) return "ERROR";
    if (!health) return "NOT CONNECTED";
    return health.backend === "connected" ? "CONNECTED" : "NOT CONNECTED";
  };

  const getSolanaStatus = () => {
    if (healthLoading) return "CHECKING...";
    if (healthError) return "ERROR";
    if (!health) return "NOT CONNECTED";
    return health.solana_rpc?.status || health.providers?.solana_rpc || "NOT CONNECTED";
  };

  const getTradingEngineStatus = () => {
    if (healthLoading) return "CHECKING...";
    if (healthError) return "ERROR";
    if (!health) return "BLOCKED";
    return health.trading_engine?.status || "BLOCKED";
  };

  const getProviderStatus = (name) => {
    if (healthLoading) return "CHECKING...";
    if (healthError) return "ERROR";
    if (!health) return "NOT CONNECTED";
    if (name === "PostgreSQL") return getDbStatus();
    if (name === "Backend API") return getBackendStatus();
    if (name === "Solana RPC") return getSolanaStatus();
    const key = name.toLowerCase().replace(" ", "_");
    return health.providers?.[key] || "NOT CONNECTED";
  };

  const solanaDetails = health?.solana_rpc || null;

  const logs = [
    { time: currentTime || "--", msg: "Frontend initialized" },
    { time: currentTime || "--", msg: "Phase 1 dashboard loaded" },
    {
      time: currentTime || "--",
      msg: `Backend connection: ${getBackendStatus()}`,
    },
    {
      time: currentTime || "--",
      msg: `Database: ${getDbStatus()}`,
    },
    {
      time: currentTime || "--",
      msg: `Solana RPC: ${getSolanaStatus()}`,
    },
    {
      time: currentTime || "--",
      msg: `Trading engine: ${getTradingEngineStatus()}`,
    },
    { time: currentTime || "--", msg: "Phase 3 Solana RPC health active" },
  ];

  const StatusBadge = ({ status, variant = "blocked" }) => {
    const colors = {
      blocked: "bg-red-900/60 text-red-300 border-red-700",
      offline: "bg-zinc-800 text-zinc-400 border-zinc-600",
      waiting: "bg-amber-900/40 text-amber-300 border-amber-700",
      connected: "bg-emerald-900/50 text-emerald-300 border-emerald-700",
      error: "bg-red-900/60 text-red-300 border-red-700",
      checking: "bg-zinc-800 text-zinc-400 border-zinc-600",
    };

    let v = variant;
    const s = (status || "").toUpperCase();
    if (s === "CONNECTED") v = "connected";
    else if (s === "ERROR" || s === "NOT_CONFIGURED") v = "error";
    else if (s === "CHECKING..." || s === "CHECKING") v = "checking";
    else if (s === "NOT CONNECTED" || s === "NOT_CONNECTED") v = "offline";
    else if (s === "BLOCKED") v = "blocked";

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${colors[v] || colors.blocked}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        {status}
      </span>
    );
  };

  const SectionCard = ({ title, children, className = "" }) => (
    <div
      className={`bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden ${className}`}
    >
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-200 tracking-wide uppercase">
          {title}
        </h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );

  const EmptyState = ({ title, subtitle }) => (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-3">
        <svg
          className="w-6 h-6 text-zinc-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <p className="text-sm font-medium text-zinc-300">{title}</p>
      {subtitle && (
        <p className="text-xs text-zinc-500 mt-1 max-w-xs">{subtitle}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-white">
                  SOLANA AI TRADER
                </h1>
                <p className="text-[10px] sm:text-xs text-zinc-500 leading-none">
                  PHASE 3 — SOLANA RPC FOUNDATION
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <StatusBadge status="SYSTEM BLOCKED" variant="blocked" />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300"
                aria-label="Toggle menu"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {mobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-800 bg-zinc-900">
            <nav className="flex flex-col p-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-4 py-3 rounded-lg text-left text-sm font-medium transition-colors ${
                    activeSection === item.id
                      ? "bg-violet-600/20 text-violet-300"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Desktop Nav */}
      <div className="hidden md:block border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-1 py-2 overflow-x-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeSection === item.id
                    ? "bg-violet-600/20 text-violet-300 border border-violet-700/50"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* TRADING STATUS — ALWAYS BLOCKED */}
        <div className="bg-gradient-to-r from-red-950/40 to-zinc-900 border border-red-900/50 rounded-xl p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
                  Trading Status
                </span>
                <StatusBadge status="BLOCKED" variant="blocked" />
              </div>
              <p className="text-sm text-zinc-300">
                Live trading is disabled in Phase 3. Trading engine not
                implemented yet.
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Current state: BLOCKED — Solana RPC read-only only
              </p>
            </div>
            <div className="text-right text-xs text-zinc-500 font-mono">
              {currentTime || "--"}
            </div>
          </div>
        </div>

        {/* DASHBOARD SECTION */}
        {(activeSection === "dashboard" || activeSection === "settings") && (
          <>
            {/* METRICS GRID */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3 px-1">
                Account Metrics
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3">
                {metrics.map((m) => (
                  <div
                    key={m.label}
                    className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 sm:p-4"
                  >
                    <p className="text-[10px] sm:text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">
                      {m.label}
                    </p>
                    <p className="text-base sm:text-lg font-semibold text-zinc-200 font-mono truncate">
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* TOP OPPORTUNITIES */}
            <SectionCard title="Top Opportunities">
              <EmptyState
                title="No market data connected"
                subtitle="Opportunities will appear when the market-data engine is connected."
              />
            </SectionCard>

            {/* TWO COLUMN: SCANNER + SMART MONEY */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SectionCard title="Live Token Scanner">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "SCANNER STATUS", value: "NOT CONNECTED" },
                      { label: "LAST SCAN", value: "--" },
                      { label: "TOKENS FOUND", value: "--" },
                      { label: "VALID CANDIDATES", value: "--" },
                      { label: "SAFE CANDIDATES", value: "--" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="bg-zinc-950/60 rounded-lg p-3 border border-zinc-800/80"
                      >
                        <p className="text-[10px] text-zinc-500 uppercase mb-0.5">
                          {item.label}
                        </p>
                        <p className="text-sm font-medium text-zinc-300 font-mono">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                  <button
                    disabled
                    className="w-full py-3 rounded-lg bg-zinc-800 text-zinc-500 text-sm font-medium cursor-not-allowed border border-zinc-700"
                  >
                    Scan (Backend Required)
                  </button>
                </div>
              </SectionCard>

              <SectionCard title="Smart Money Feed">
                <EmptyState
                  title="Smart Money Engine Offline"
                  subtitle="No wallet intelligence data connected."
                />
              </SectionCard>
            </div>

            {/* WHALE ACTIVITY */}
            <SectionCard title="Whale Activity">
              <EmptyState title="No whale data connected." />
            </SectionCard>

            {/* OPEN POSITIONS */}
            <SectionCard title="Open Positions">
              <EmptyState title="No active positions." />
            </SectionCard>

            {/* TRADE HISTORY */}
            <SectionCard title="Trade History">
              <EmptyState title="No trades recorded." />
            </SectionCard>
          </>
        )}

        {/* SCANNER SECTION */}
        {activeSection === "scanner" && (
          <SectionCard title="Token Scanner">
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "SCANNER STATUS", value: "NOT CONNECTED" },
                  { label: "LAST SCAN", value: "--" },
                  { label: "TOKENS FOUND", value: "--" },
                  { label: "VALID CANDIDATES", value: "--" },
                  { label: "SAFE CANDIDATES", value: "--" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-zinc-950/60 rounded-lg p-3 border border-zinc-800"
                  >
                    <p className="text-[10px] text-zinc-500 uppercase mb-1">
                      {item.label}
                    </p>
                    <p className="text-sm font-semibold text-zinc-300 font-mono">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
              <button
                disabled
                className="w-full py-3.5 rounded-xl bg-zinc-800 text-zinc-500 text-sm font-medium cursor-not-allowed border border-zinc-700"
              >
                Start Scan — Backend Required
              </button>
              <EmptyState
                title="Scanner offline"
                subtitle="Connect market-data engine to begin discovering tokens."
              />
            </div>
          </SectionCard>
        )}

        {/* POSITIONS SECTION */}
        {activeSection === "positions" && (
          <SectionCard title="Open Positions">
            <EmptyState
              title="No active positions."
              subtitle="Positions will appear here once the trading engine is connected and live."
            />
          </SectionCard>
        )}

        {/* TRADES SECTION */}
        {activeSection === "trades" && (
          <SectionCard title="Trade History">
            <EmptyState
              title="No trades recorded."
              subtitle="Completed trades will be listed here after the execution layer is online."
            />
          </SectionCard>
        )}

        {/* RISK SECTION */}
        {activeSection === "risk" && (
          <>
            <SectionCard title="Risk Panel">
              <p className="text-sm text-zinc-400 mb-4">
                Configuration backend not connected.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {riskConfigItems.map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2.5"
                  >
                    <span className="text-xs text-zinc-400">{item}</span>
                    <span className="text-xs font-mono text-zinc-500">--</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <div className="bg-red-950/30 border border-red-900/60 rounded-xl p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-red-300 uppercase tracking-wide mb-2">
                Emergency Kill Switch
              </h2>
              <p className="text-xs text-zinc-400 mb-4">
                Backend kill switch not connected. This control is visual only
                and cannot execute any action in Phase 3.
              </p>
              <button
                disabled
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-red-900/40 text-red-400/70 text-sm font-semibold cursor-not-allowed border border-red-800/50"
              >
                KILL SWITCH — NOT CONNECTED
              </button>
            </div>
          </>
        )}

        {/* SYSTEM HEALTH + API + LOGS */}
        {(activeSection === "dashboard" || activeSection === "settings") && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SectionCard title="System Health">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {systemHealthItems.map((item) => {
                    let status = "NOT CONNECTED";
                    if (item === "DATABASE") status = getDbStatus();
                    else if (item === "SOLANA RPC") status = getSolanaStatus();
                    return (
                      <div
                        key={item}
                        className="flex items-center justify-between bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2"
                      >
                        <span className="text-xs text-zinc-400">{item}</span>
                        <StatusBadge status={status} />
                      </div>
                    );
                  })}
                </div>

                {/* Solana RPC Details (only when data available) */}
                {solanaDetails && solanaDetails.status === "CONNECTED" && (
                  <div className="mt-4 p-3 bg-zinc-950/70 border border-zinc-800 rounded-lg text-xs space-y-1">
                    <p className="text-zinc-400">
                      Network:{" "}
                      <span className="text-zinc-200 font-mono">
                        {solanaDetails.network || "solana-mainnet"}
                      </span>
                    </p>
                    <p className="text-zinc-400">
                      Slot:{" "}
                      <span className="text-zinc-200 font-mono">
                        {solanaDetails.slot ?? "--"}
                      </span>
                    </p>
                    <p className="text-zinc-400">
                      Block Height:{" "}
                      <span className="text-zinc-200 font-mono">
                        {solanaDetails.blockHeight ?? "--"}
                      </span>
                    </p>
                    <p className="text-zinc-400">
                      Latency:{" "}
                      <span className="text-zinc-200 font-mono">
                        {solanaDetails.latencyMs != null
                          ? `${solanaDetails.latencyMs} ms`
                          : "--"}
                      </span>
                    </p>
                    <p className="text-zinc-500 text-[10px]">
                      Last Check: {solanaDetails.checkedAt || "--"}
                    </p>
                  </div>
                )}
              </SectionCard>

              <SectionCard title="API Health">
                <div className="space-y-2">
                  {apiProviders.map((p) => (
                    <div
                      key={p}
                      className="flex items-center justify-between bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2.5"
                    >
                      <span className="text-sm text-zinc-300">{p}</span>
                      <StatusBadge status={getProviderStatus(p)} />
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>

            {/* SYSTEM LOGS */}
            <SectionCard title="System Logs">
              <div className="space-y-1.5 font-mono text-xs">
                {logs.map((log, i) => (
                  <div
                    key={i}
                    className="flex gap-3 py-1.5 border-b border-zinc-800/50 last:border-0"
                  >
                    <span className="text-zinc-600 shrink-0 w-36 sm:w-40">
                      {log.time}
                    </span>
                    <span className="text-zinc-400">{log.msg}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </>
        )}

        {/* SETTINGS PLACEHOLDER */}
        {activeSection === "settings" && (
          <SectionCard title="Settings">
            <EmptyState
              title="Settings backend not connected"
              subtitle="Configuration panels will be available after the backend is integrated."
            />
          </SectionCard>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-800 mt-8 py-4">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-600">
          <span>Solana AI Trader — Phase 3 Solana RPC Foundation</span>
          <span className="font-mono">
            SYSTEM BLOCKED • TRADING ENGINE OFF
          </span>
        </div>
      </footer>
    </div>
  );
}
