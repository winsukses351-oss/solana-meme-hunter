'use client';

import { useState } from 'react';

export default function DashboardClient({
  dbHealth,
  rpcHealth,
  marketHealth,
  hunterData,
  scoredCandidates,
  sampleRejections,
  diag,
}) {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [emergencyStopped, setEmergencyStopped] = useState(false);
  const [logs, setLogs] = useState([
    `[${new Date().toISOString()}] [INFO] Dashboard Client initialized. Interactive navigation active.`,
    `[${new Date().toISOString()}] [INFO] Phase 6 Real Scoring Engine integrated. Scored: ${scoredCandidates.length}`,
    `[${new Date().toISOString()}] [INFO] Solana RPC Slot: ${rpcHealth?.currentSlot || 'N/A'}`,
  ]);

  const addLog = (msg) => {
    setLogs((prev) => [`[${new Date().toISOString()}] ${msg}`, ...prev.slice(0, 49)]);
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    addLog(`[NAV] Switched view to: ${tabName}`);
  };

  const handleEmergencyStopToggle = () => {
    const nextState = !emergencyStopped;
    setEmergencyStopped(nextState);
    addLog(`[EMERGENCY] Emergency Stop ${nextState ? 'ENGAGED (MANUAL OVERRIDE)' : 'RELEASED (SYSTEM STILL BLOCKED)'}`);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "monospace", backgroundColor: "#0d1117", color: "#c9d1d9", minHeight: "100vh" }}>
      
      {/* 1. HEADER & TRADING SAFETY STATUS */}
      <header style={{ borderBottom: "1px solid #30363d", paddingBottom: "16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ color: "#58a6ff", margin: "0 0 4px 0", fontSize: "22px" }}>SOLANA AI TRADER — SYSTEM DASHBOARD</h1>
          <span style={{ color: "#8b949e", fontSize: "12px" }}>Full Foundation UI | Interactive Navigation Active | Phase 6 Scored</span>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ padding: "6px 12px", borderRadius: "4px", backgroundColor: "#da3633", color: "#fff", fontWeight: "bold", fontSize: "12px" }}>
            TRADING STATUS: BLOCKED
          </span>
          <span style={{ padding: "6px 12px", borderRadius: "4px", backgroundColor: emergencyStopped ? "#da3633" : "#238636", color: "#fff", fontWeight: "bold", fontSize: "12px" }}>
            KILL SWITCH: {emergencyStopped ? "HALTED" : "ACTIVE"}
          </span>
        </div>
      </header>

      {/* 2. NAVIGATION TABS */}
      <nav style={{ display: "flex", gap: "8px", borderBottom: "1px solid #30363d", paddingBottom: "12px", marginBottom: "20px", overflowX: "auto" }}>
        {["Dashboard", "Scanner", "Positions", "Trades", "Risk", "Settings"].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              style={{
                padding: "8px 16px",
                backgroundColor: isActive ? "#1f6feb" : "#161b22",
                color: isActive ? "#ffffff" : "#8b949e",
                border: isActive ? "1px solid #58a6ff" : "1px solid #30363d",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "12px",
                transition: "all 0.15s ease-in-out",
              }}
            >
              {tab} {isActive ? "•" : ""}
            </button>
          );
        })}
      </nav>

      {/* DYNAMIC TAB VIEW RENDERING */}
      {activeTab === "Dashboard" && (
        <>
          {/* ACCOUNT METRICS GRID */}
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

          {/* EMERGENCY CONTROLS */}
          <section style={{ marginBottom: "24px", padding: "16px", border: "1px solid #da3633", borderRadius: "6px", backgroundColor: "#161b22", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ margin: "0 0 4px 0", color: "#f85149", fontSize: "14px" }}>EMERGENCY CONTROLS & SAFETY LOCK</h3>
              <p style={{ margin: 0, color: "#8b949e", fontSize: "12px" }}>Trading execution engine is strictly locked. No automated buy/sell or signing operations allowed.</p>
            </div>
            <button
              onClick={handleEmergencyStopToggle}
              style={{
                padding: "10px 20px",
                backgroundColor: emergencyStopped ? "#8b949e" : "#da3633",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "12px"
              }}
            >
              {emergencyStopped ? "TRIGGER RE-ARM (STOPPED)" : "EMERGENCY STOP (ACTIVE)"}
            </button>
          </section>

          {/* LIVE TOKEN SCANNER */}
          <ScannerSection hunterData={hunterData} diag={diag} />

          {/* TOP OPPORTUNITIES TABLE */}
          <OpportunitiesSection scoredCandidates={scoredCandidates} sampleRejections={sampleRejections} />

          {/* SMART MONEY & WHALE ACTIVITY */}
          <FeedsSection />

          {/* OPEN POSITIONS & TRADE HISTORY */}
          <PositionsAndTradesSection />

          {/* SYSTEM HEALTH & API HEALTH */}
          <HealthSection dbHealth={dbHealth} rpcHealth={rpcHealth} marketHealth={marketHealth} />
        </>
      )}

      {activeTab === "Scanner" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ padding: "16px", border: "1px solid #1f6feb", borderRadius: "6px", backgroundColor: "#161b22" }}>
            <h2 style={{ fontSize: "16px", color: "#58a6ff", marginTop: 0 }}>LIVE SCANNER VIEW</h2>
            <p style={{ fontSize: "12px", color: "#8b949e" }}>Full Scanner Control & Real-time Candidate Discovery Analysis</p>
          </div>
          <ScannerSection hunterData={hunterData} diag={diag} />
          <OpportunitiesSection scoredCandidates={scoredCandidates} sampleRejections={sampleRejections} />
        </div>
      )}

      {activeTab === "Positions" && (
        <div style={{ padding: "20px", border: "1px solid #30363d", borderRadius: "6px", backgroundColor: "#161b22" }}>
          <h2 style={{ fontSize: "16px", color: "#58a6ff", marginTop: 0 }}>ACTIVE OPEN POSITIONS</h2>
          <p style={{ fontSize: "12px", color: "#8b949e" }}>Status: NO ACTIVE POSITIONS</p>
          <div style={{ padding: "24px", border: "1px dashed #30363d", borderRadius: "6px", textAlign: "center", color: "#8b949e", fontSize: "13px" }}>
            Trading is currently BLOCKED. Zero open positions in database.
          </div>
        </div>
      )}

      {activeTab === "Trades" && (
        <div style={{ padding: "20px", border: "1px solid #30363d", borderRadius: "6px", backgroundColor: "#161b22" }}>
          <h2 style={{ fontSize: "16px", color: "#58a6ff", marginTop: 0 }}>CLOSED TRADE HISTORY</h2>
          <p style={{ fontSize: "12px", color: "#8b949e" }}>Status: NO HISTORICAL TRADES</p>
          <div style={{ padding: "24px", border: "1px dashed #30363d", borderRadius: "6px", textAlign: "center", color: "#8b949e", fontSize: "13px" }}>
            No executed trades recorded. Automated execution is strictly BLOCKED.
          </div>
        </div>
      )}

      {activeTab === "Risk" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ padding: "20px", border: "1px solid #30363d", borderRadius: "6px", backgroundColor: "#161b22" }}>
            <h2 style={{ fontSize: "16px", color: "#58a6ff", marginTop: 0 }}>RISK CONTROLS & SAFETY STATUS</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginTop: "16px" }}>
              <div style={{ padding: "12px", backgroundColor: "#0d1117", border: "1px solid #21262d", borderRadius: "4px" }}>
                <div style={{ fontSize: "11px", color: "#8b949e" }}>MAX DRAWDOWN LIMIT</div>
                <div style={{ fontSize: "16px", fontWeight: "bold", color: "#f85149" }}>15.00%</div>
              </div>
              <div style={{ padding: "12px", backgroundColor: "#0d1117", border: "1px solid #21262d", borderRadius: "4px" }}>
                <div style={{ fontSize: "11px", color: "#8b949e" }}>DAILY LOSS LIMIT</div>
                <div style={{ fontSize: "16px", fontWeight: "bold", color: "#f85149" }}>5.00%</div>
              </div>
              <div style={{ padding: "12px", backgroundColor: "#0d1117", border: "1px solid #21262d", borderRadius: "4px" }}>
                <div style={{ fontSize: "11px", color: "#8b949e" }}>MAX POSITION SIZE</div>
                <div style={{ fontSize: "16px", fontWeight: "bold", color: "#e3b341" }}>1.00 SOL</div>
              </div>
              <div style={{ padding: "12px", backgroundColor: "#0d1117", border: "1px solid #21262d", borderRadius: "4px" }}>
                <div style={{ fontSize: "11px", color: "#8b949e" }}>SLIPPAGE TOLERANCE</div>
                <div style={{ fontSize: "16px", fontWeight: "bold", color: "#3fb950" }}>1.50%</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Settings" && (
        <div style={{ padding: "20px", border: "1px solid #30363d", borderRadius: "6px", backgroundColor: "#161b22" }}>
          <h2 style={{ fontSize: "16px", color: "#58a6ff", marginTop: 0 }}>SYSTEM & ENGINE SETTINGS</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px", fontSize: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px", backgroundColor: "#0d1117", borderRadius: "4px" }}>
              <span>Execution Engine Mode:</span>
              <strong style={{ color: "#da3633" }}>READ-ONLY / BLOCKED</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px", backgroundColor: "#0d1117", borderRadius: "4px" }}>
              <span>Token Hunter Interval:</span>
              <strong style={{ color: "#3fb950" }}>REAL-TIME / ON-DEMAND</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px", backgroundColor: "#0d1117", borderRadius: "4px" }}>
              <span>Scoring Engine Strategy:</span>
              <strong style={{ color: "#58a6ff" }}>DETERMINISTIC MARKET-WEIGHTED (PHASE 6)</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px", backgroundColor: "#0d1117", borderRadius: "4px" }}>
              <span>Database Provider:</span>
              <strong style={{ color: "#d29922" }}>NOT CONFIGURED</strong>
            </div>
          </div>
        </div>
      )}

      {/* SYSTEM LOGS SECTION (ALWAYS VISIBLE AT BOTTOM) */}
      <section style={{ marginTop: "24px", padding: "16px", border: "1px solid #30363d", borderRadius: "6px", backgroundColor: "#161b22" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <h2 style={{ fontSize: "14px", color: "#c9d1d9", margin: 0 }}>SYSTEM LOGS STREAM</h2>
          <button
            onClick={() => addLog("[USER] Manual log refresh requested.")}
            style={{ padding: "4px 8px", backgroundColor: "#21262d", color: "#c9d1d9", border: "1px solid #30363d", borderRadius: "4px", cursor: "pointer", fontSize: "10px" }}
          >
            Clear / Touch Logs
          </button>
        </div>
        <div style={{ backgroundColor: "#0d1117", padding: "10px", borderRadius: "4px", fontSize: "11px", color: "#8b949e", fontFamily: "monospace", maxHeight: "140px", overflowY: "auto" }}>
          {logs.map((log, index) => (
            <div key={index} style={{ marginBottom: "2px" }}>{log}</div>
          ))}
        </div>
      </section>

    </div>
  );
}

/* HELPER COMPONENTS */

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

function ScannerSection({ hunterData, diag }) {
  return (
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
  );
}

function OpportunitiesSection({ scoredCandidates, sampleRejections }) {
  return (
    <section style={{ marginBottom: "24px", padding: "16px", border: "1px solid #30363d", borderRadius: "6px", backgroundColor: "#161b22" }}>
      <h2 style={{ fontSize: "14px", color: "#3fb950", marginTop: 0, marginBottom: "12px" }}>TOP OPPORTUNITIES (DETERMINISTIC SCORED CANDIDATES)</h2>
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
              <th style={{ padding: "6px" }}>SCORE</th>
              <th style={{ padding: "6px" }}>RISK QUALITY</th>
            </tr>
          </thead>
          <tbody>
            {scoredCandidates.length === 0 ? (
              <tr><td colSpan="8" style={{ padding: "12px", textAlign: "center", color: "#8b949e" }}>No scored candidates available</td></tr>
            ) : (
              scoredCandidates.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #21262d" }}>
                  <td style={{ padding: "6px", fontWeight: "bold", color: "#58a6ff" }}>{item?.symbol || "UNKNOWN"}</td>
                  <td style={{ padding: "6px", color: "#8b949e" }}>{item?.tokenAddress ? `${item.tokenAddress.slice(0, 6)}...` : "--"}</td>
                  <td style={{ padding: "6px" }}>{item?.price ? `$${item.price}` : "--"}</td>
                  <td style={{ padding: "6px" }}>${item?.liquidityUsd?.toLocaleString() || "0"}</td>
                  <td style={{ padding: "6px" }}>${item?.volume24hUsd?.toLocaleString() || "0"}</td>
                  <td style={{ padding: "6px" }}>{item?.dex || "--"}</td>
                  <td style={{ padding: "6px", fontWeight: "bold", color: "#e3b341" }}>{item?.score !== null ? `${item.score}/100` : "N/A"}</td>
                  <td style={{ padding: "6px", fontWeight: "bold", color: item?.riskLevel === "HIGH QUALITY" ? "#3fb950" : item?.riskLevel === "MEDIUM QUALITY" ? "#e3b341" : "#f85149" }}>
                    {item?.riskLevel}
                  </td>
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
  );
}

function FeedsSection() {
  return (
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
  );
}

function PositionsAndTradesSection() {
  return (
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
  );
}

function HealthSection({ dbHealth, rpcHealth, marketHealth }) {
  return (
    <>
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

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "14px", color: "#8b949e", marginBottom: "10px" }}>API HEALTH MONITOR</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
          <HealthCard title="Birdeye" status="NOT CONFIGURED" />
          <HealthCard title="DexScreener" status={marketHealth?.dexscreenerStatus || "ERROR"} />
          <HealthCard title="Jupiter" status="NOT CONFIGURED" />
          <HealthCard title="Solana RPC" status={rpcHealth?.status || "ERROR"} />
          <HealthCard title="PostgreSQL" status={dbHealth?.status || "NOT CONFIGURED"} />
          <HealthCard title="Backend API" status="CONNECTED" />
        </div>
      </section>
    </>
  );
}
