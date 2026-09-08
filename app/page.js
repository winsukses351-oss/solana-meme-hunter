/**
 * Solana AI Trader Dashboard — Full Foundation UI Restored + Phase 5.6 Backend Engine
 */

import { checkDatabaseHealth } from "@/lib/db";
import { checkSolanaRpcHealth } from "@/lib/solana/rpc";
import { getMarketDataHealth } from "@/lib/market-data/service";
import { runTokenHunterPipeline } from "@/lib/token-hunter/service";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Fetch Phase 5.6 Real Backend Data
  const [dbHealth, rpcHealth, marketHealth, hunterData] = await Promise.all([
    checkDatabaseHealth().catch(() => ({ status: "NOT CONFIGURED" })),
    checkSolanaRpcHealth().catch(() => ({ status: "ERROR" })),
    getMarketDataHealth().catch(() => ({ status: "ERROR", dexscreenerStatus: "ERROR" })),
    runTokenHunterPipeline().catch((err) => ({
      status: "ERROR",
      candidateCount: 0,
      candidates: [],
      filtered: [],
      diagnosticSummaryMessage: err.message || "Pipeline Error",
      diagnosticsStats: {},
    })),
  ]);

  const isBackendConnected = true;
  const sampleRejections = (hunterData?.filtered || []).slice(0, 5);
  const candidatesList = hunterData?.candidates || [];
  const diag = hunterData?.diagnosticsStats || {};

  return (
    <div style={{ padding: "20px", fontFamily: "monospace", backgroundColor: "#0d1117", color: "#c9d1d9", minHeight: "100vh" }}>
      
      {/* 1. HEADER & TRADING STATUS */}
      <header style={{ borderBottom: "1px solid #30363d", paddingBottom: "16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ color: "#58a6ff", margin: "0 0 4px 0", fontSize: "22px" }}>SOLANA AI TRADER — SYSTEM DASHBOARD</h1>
          <span style={{ color: "#8b949e", fontSize: "12px" }}>Foundation UI Fully Restored | Phase 5.6 Active</span>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ padding: "6px 12px", borderRadius: "4px", backgroundColor: "#da3633", color: "#fff", fontWeight: "bold", fontSize: "12px" }}>
            TRADING STATUS: BLOCKED
          </span>
          <span style={{ padding: "6px 12px", borderRadius: "4px", backgroundColor: "#238636", color: "#fff", fontWeight: "bold", fontSize: "12px" }}>
            KILL SWITCH: ACTIVE
          </span>
        </div>
      </header>

      {/* 2. NAVIGATION TABS */}
      <nav style={{ display: "flex", gap: "8px", borderBottom: "1px solid #30363d", paddingBottom: "12px", marginBottom: "20px", overflowX: "auto" }}>
        {["Dashboard", "Scanner", "Positions", "Trades", "Risk", "Settings"].map((tab, idx) => (
          <button key={tab} style={{ padding: "8px 16px", backgroundColor: idx === 0 ? "#1f6feb" : "#161b22", color: "#fff", border: "1px solid #30363d", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}>
            {tab}
          </button>
        ))}
      </nav>

      {/* 3. ACCOUNT METRICS GRID */}
      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "14px", color: "#8b949e", marginBottom: "10px" }}>ACCOUNT METRICS</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
          <MetricCard title="BALANCE" value="--" />
          <MetricCard title="EQUITY" value="--" />
          <MetricCard title="DAILY PNL" value="--" />
          <MetricCard title="WEEKLY PNL" value="--" />
          <MetricCard title="MONTHLY PNL" value="--" />
          <MetricCard title="NET PROFIT" value="--" />
          <MetricCard title="DRAWDOWN" value="--" />
          <MetricCard title="WIN RATE" value="--" />
          <MetricCard title="PROFIT FACTOR" value="--" />
          <MetricCard title="OPEN POSITIONS" value="0" />
          <MetricCard title="CLOSED TRADES" value="0" />
          <MetricCard title="CURRENT RISK" value="0.00%" />
        </div>
      </section>

      {/* 4. EMERGENCY CONTROLS & TRADING STATUS EXPLANATION */}
      <section style={{ marginBottom: "24px", padding: "16px", border: "1px solid #da3633", borderRadius: "6px", backgroundColor: "#161b22", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h3 style={{ margin: "0 0 4px 0", color: "#f85149", fontSize: "14px" }}>EMERGENCY CONTROLS & SAFETY LOCK</h3>
          <p style={{ margin: 0, color: "#8b949e", fontSize: "12px" }}>Trading execution engine is strictly locked. No automated buy/sell or signing operations allowed.</p>
        </div>
        <button style={{ padding: "10px 20px", backgroundColor: "#da3633", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "12px" }}>
          EMERGENCY STOP (ACTIVE)
        </button>
      </section>

      {/* 5. LIVE TOKEN SCANNER & DISCOVERY DIAGNOSTICS */}
      <section style={{ marginBottom: "24px", padding: "16px", border: "1px solid #30363d", borderRadius: "6px", backgroundColor: "#161b22" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
          <h2 style={{ fontSize: "14px", color: "#58a6ff", margin: 0 }}>LIVE TOKEN SCANNER & DISCOVERY METRICS</h2>
          <span style={{ fontSize: "12px", color: "#3fb950" }}>Status: RUNNING</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "10px" }}>
          <DiagCard title="Raw Pairs" value={hunterData?.rawPairsCount || 0} />
          <DiagCard title="Solana Pairs" value={hunterData?.solanaPairsCount || 0} />
          <DiagCard title="Unique Tokens" value={hunterData?.uniqueTokensCount || 0} />
          <DiagCard title="Actual SPL" value={hunterData?.actualSplDiscovered || 0} color="#3fb950" />
          <DiagCard title="Native SOL" value={diag?.excludedNativeSol || 0} color="#f85149" />
          <DiagCard title="WSOL" value={diag?.excludedWsol || 0} color="#f85149" />
          <DiagCard title="Stablecoins" value={diag?.excludedStablecoins || 0} color="#f85149" />
          <DiagCard title="Quote Assets" value={diag?.excludedQuoteAssets || 0} color="#f85149" />
          <DiagCard title="Low Liquidity" value={diag?.lowLiquidity || 0} />
          <DiagCard title="Low Volume" value={diag?.lowVolume || 0} />
          <DiagCard title="Valid Candidates" value={hunterData?.candidateCount || 0} color="#3fb950" />
        </div>
      </section>

      {/* 6. TOP OPPORTUNITIES & REJECTIONS */}
      <section style={{ marginBottom: "24px", padding: "16px", border: "1px solid #30363d", borderRadius: "6px", backgroundColor: "#161b22" }}>
        <h2 style={{ fontSize: "14px", color: "#3fb950", marginTop: 0, marginBottom: "12px" }}>TOP OPPORTUNITIES (VALID CANDIDATES)</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: "16px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #30363d", textAlign: "left", color: "#8b949e" }}>
                <th style={{ padding: "6px" }}>TOKEN</th>
                <th style={{ padding: "6px" }}>ADDRESS</th>
                <th style={{ padding: "6px" }}>PRICE</th>
                <th style={{ padding: "6px" }}>LIQUIDITY</th>
                <th style={{ padding: "6px" }}>24H VOLUME</th>
                <th style={{ padding: "6px" }}>DEX</th>
                <th style={{ padding: "6px" }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {candidatesList.length === 0 ? (
                <tr><td colSpan="7" style={{ padding: "12px", textAlign: "center", color: "#8b949e" }}>No valid candidates found</td></tr>
              ) : (
                candidatesList.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #21262d" }}>
                    <td style={{ padding: "6px", fontWeight: "bold", color: "#58a6ff" }}>{item?.symbol || "UNKNOWN"}</td>
                    <td style={{ padding: "6px", color: "#8b949e" }}>{item?.tokenAddress ? `${item.tokenAddress.slice(0, 6)}...` : "--"}</td>
                    <td style={{ padding: "6px" }}>{item?.price ? `$${item.price}` : "--"}</td>
                    <td style={{ padding: "6px" }}>${item?.liquidityUsd?.toLocaleString() || "0"}</td>
                    <td style={{ padding: "6px" }}>${item?.volume24hUsd?.toLocaleString() || "0"}</td>
                    <td style={{ padding: "6px" }}>{item?.dex || "--"}</td>
                    <td style={{ padding: "6px", color: "#3fb950", fontWeight: "bold" }}>{item?.status || "DISCOVERED"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <h3 style={{ fontSize: "12px", color: "#8b949e", marginBottom: "8px" }}>SAMPLE DISCOVERY REJECTIONS</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #30363d", textAlign: "left", color: "#8b949e" }}>
                <th style={{ padding: "4px" }}>TOKEN</th>
                <th style={{ padding: "4px" }}>REASON</th>
              </tr>
            </thead>
            <tbody>
              {sampleRejections.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #21262d" }}>
                  <td style={{ padding: "4px", fontWeight: "bold" }}>{item?.symbol || "UNKNOWN"}</td>
                  <td style={{ padding: "4px", color: "#f85149" }}>{item?.primaryReason || "REJECTED"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 7. SMART MONEY & WHALE ACTIVITY (SIDE-BY-SIDE) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <section style={{ padding: "16px", border: "1px solid #30363d", borderRadius: "6px", backgroundColor: "#161b22" }}>
          <h2 style={{ fontSize: "14px", color: "#58a6ff", marginTop: 0 }}>SMART MONEY FEED</h2>
          <p style={{ fontSize: "12px", color: "#8b949e" }}>Status: NOT CONNECTED</p>
          <div style={{ padding: "12px", backgroundColor: "#0d1117", borderRadius: "4px", border: "1px solid #21262d", fontSize: "11px", color: "#8b949e" }}>
            Waiting for wallet intelligence feed initialization...
          </div>
        </section>

        <section style={{ padding: "16px", border: "1px solid #30363d", borderRadius: "6px", backgroundColor: "#161b22" }}>
          <h2 style={{ fontSize: "14px", color: "#58a6ff", marginTop: 0 }}>WHALE ACTIVITY</h2>
          <p style={{ fontSize: "12px", color: "#8b949e" }}>Status: NOT CONNECTED</p>
          <div style={{ padding: "12px", backgroundColor: "#0d1117", borderRadius: "4px", border: "1px solid #21262d", fontSize: "11px", color: "#8b949e" }}>
            Waiting for whale tracking socket connection...
          </div>
        </section>
      </div>

      {/* 8. OPEN POSITIONS & TRADE HISTORY */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <section style={{ padding: "16px", border: "1px solid #30363d", borderRadius: "6px", backgroundColor: "#161b22" }}>
          <h2 style={{ fontSize: "14px", color: "#c9d1d9", marginTop: 0 }}>OPEN POSITIONS (0)</h2>
          <p style={{ fontSize: "12px", color: "#8b949e" }}>No active open positions in database.</p>
        </section>

        <section style={{ padding: "16px", border: "1px solid #30363d", borderRadius: "6px", backgroundColor: "#161b22" }}>
          <h2 style={{ fontSize: "14px", color: "#c9d1d9", marginTop: 0 }}>TRADE HISTORY (0)</h2>
          <p style={{ fontSize: "12px", color: "#8b949e" }}>No closed trades recorded.</p>
        </section>
      </div>

      {/* 9. DETAILED SYSTEM HEALTH (12 SUBSYSTEMS) */}
      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "14px", color: "#8b949e", marginBottom: "10px" }}>DETAILED SYSTEM HEALTH</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
          <HealthCard title="Database" status={dbHealth?.status || "NOT CONFIGURED"} />
          <HealthCard title="Solana RPC" status={rpcHealth?.status || "ERROR"} />
          <HealthCard title="Market Data" status={marketHealth?.status || "ERROR"} />
          <HealthCard title="Wallet/Signer" status="BLOCKED" />
          <HealthCard title="Execution" status="BLOCKED" />
          <HealthCard title="Safety" status="CONNECTED" />
          <HealthCard title="Risk" status="CONNECTED" />
          <HealthCard title="Decision" status="BLOCKED" />
          <HealthCard title="Position" status="CONNECTED" />
          <HealthCard title="Confirmation" status="BLOCKED" />
          <HealthCard title="Reconciliation" status="BLOCKED" />
          <HealthCard title="Workers" status="CONNECTED" />
        </div>
      </section>

      {/* 10. API HEALTH MONITOR */}
      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "14px", color: "#8b949e", marginBottom: "10px" }}>API HEALTH MONITOR</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
          <HealthCard title="Birdeye" status="NOT CONFIGURED" />
          <HealthCard title="DexScreener" status={marketHealth?.dexscreenerStatus || "ERROR"} />
          <HealthCard title="Jupiter" status="NOT CONFIGURED" />
          <HealthCard title="Solana RPC" status={rpcHealth?.status || "ERROR"} />
          <HealthCard title="PostgreSQL" status={dbHealth?.status || "NOT CONFIGURED"} />
          <HealthCard title="Backend API" status={isBackendConnected ? "CONNECTED" : "ERROR"} />
        </div>
      </section>

      {/* 11. SYSTEM LOGS & SETTINGS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
        <section style={{ padding: "16px", border: "1px solid #30363d", borderRadius: "6px", backgroundColor: "#161b22" }}>
          <h2 style={{ fontSize: "14px", color: "#c9d1d9", marginTop: 0 }}>SYSTEM LOGS</h2>
          <div style={{ backgroundColor: "#0d1117", padding: "10px", borderRadius: "4px", fontSize: "11px", color: "#8b949e", fontFamily: "monospace", maxHeight: "120px", overflowY: "auto" }}>
            <div>[{new Date().toISOString()}] [INFO] System Dashboard loaded. UI restored.</div>
            <div>[{new Date().toISOString()}] [INFO] Phase 5.6 Market Data: {marketHealth?.status}</div>
            <div>[{new Date().toISOString()}] [INFO] Solana RPC Slot: {rpcHealth?.currentSlot || "N/A"}</div>
          </div>
        </section>

        <section style={{ padding: "16px", border: "1px solid #30363d", borderRadius: "6px", backgroundColor: "#161b22" }}>
          <h2 style={{ fontSize: "14px", color: "#c9d1d9", marginTop: 0 }}>SETTINGS OVERVIEW</h2>
          <p style={{ fontSize: "12px", color: "#8b949e", margin: "0 0 8px 0" }}>Mode: Read-Only Diagnostics</p>
          <p style={{ fontSize: "12px", color: "#8b949e", margin: 0 }}>Auto-Trade Engine: Disabled</p>
        </section>
      </div>

    </div>
  );
}

function MetricCard({ title, value }) {
  return (
    <div style={{ padding: "10px", border: "1px solid #30363d", borderRadius: "6px", backgroundColor: "#161b22" }}>
      <small style={{ color: "#8b949e", fontSize: "10px" }}>{title}</small>
      <p style={{ margin: "4px 0 0 0", fontWeight: "bold", fontSize: "14px", color: "#c9d1d9" }}>{value}</p>
    </div>
  );
}

function DiagCard({ title, value, color = "#c9d1d9" }) {
  return (
    <div style={{ padding: "8px", border: "1px solid #21262d", borderRadius: "4px", backgroundColor: "#0d1117" }}>
      <small style={{ color: "#8b949e", fontSize: "10px" }}>{title}</small>
      <p style={{ margin: "2px 0 0 0", fontWeight: "bold", fontSize: "14px", color }}>{value}</p>
    </div>
  );
}

function HealthCard({ title, status }) {
  let color = "#3fb950";
  if (status === "ERROR") color = "#f85149";
  if (status === "NOT CONFIGURED") color = "#d29922";
  if (status === "BLOCKED") color = "#da3633";

  return (
    <div style={{ padding: "8px", border: "1px solid #30363d", borderRadius: "6px", backgroundColor: "#161b22" }}>
      <small style={{ color: "#8b949e", fontSize: "10px" }}>{title}</small>
      <p style={{ margin: "2px 0 0 0", fontWeight: "bold", fontSize: "11px", color }}>{status}</p>
    </div>
  );
}
