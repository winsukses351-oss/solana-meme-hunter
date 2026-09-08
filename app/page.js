/**
 * Main Solana AI Trader Dashboard — Phase 5.4 Hard Asset Filtering & System Diagnostics
 */

import { checkDatabaseHealth } from "@/lib/db";
import { checkSolanaRpcHealth } from "@/lib/solana/rpc";
import { getMarketDataHealth } from "@/lib/market-data/service";
import { runTokenHunterPipeline } from "@/lib/token-hunter/service";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const dbHealth = await checkDatabaseHealth();
  const rpcHealth = await checkSolanaRpcHealth();
  const marketHealth = await getMarketDataHealth();
  const hunterData = await runTokenHunterPipeline();

  const isBackendConnected = true;
  const volumeStats = hunterData.volumeStats || {};
  const sampleRejections = (hunterData.filtered || []).slice(0, 6);
  const diag = hunterData.diagnosticsStats || {};

  return (
    <div style={{ padding: "24px", fontFamily: "monospace", backgroundColor: "#0d1117", color: "#c9d1d9", minHeight: "100vh" }}>
      <header style={{ borderBottom: "1px solid #30363d", paddingBottom: "16px", marginBottom: "24px" }}>
        <h1 style={{ color: "#58a6ff", margin: "0 0 8px 0" }}>SOLANA AI TRADER — DASHBOARD</h1>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ padding: "4px 8px", borderRadius: "4px", backgroundColor: "#da3633", color: "#fff", fontWeight: "bold" }}>
            TRADING: BLOCKED
          </span>
          <span style={{ color: "#8b949e" }}>Phase 5.4 Hard Asset Filter + RPC Recovery</span>
        </div>
      </header>

      {/* HEALTH CONSISTENCY MONITOR */}
      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "14px", color: "#8b949e", marginBottom: "12px" }}>SYSTEM HEALTH MONITOR</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px" }}>
          <HealthCard title="Backend API" status={isBackendConnected ? "CONNECTED" : "ERROR"} />
          <HealthCard title="PostgreSQL" status={dbHealth.status} />
          <HealthCard title="Solana RPC" status={rpcHealth.status} subtext={rpcHealth.currentSlot ? `Slot: ${rpcHealth.currentSlot}` : null} />
          <HealthCard title="Market Data" status={marketHealth.status} />
          <HealthCard title="DexScreener" status={marketHealth.dexscreenerStatus} />
          <HealthCard title="Token Hunter" status={hunterData.status} />
        </div>
      </section>

      {/* HARD ASSET FILTER DIAGNOSTICS */}
      <section style={{ marginBottom: "24px", padding: "16px", border: "1px solid #30363d", borderRadius: "6px", backgroundColor: "#161b22" }}>
        <h2 style={{ fontSize: "15px", color: "#58a6ff", marginTop: 0 }}>HARD ASSET EXCLUSIONS & DIAGNOSTICS</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
          <div><small style={{ color: "#8b949e" }}>Excluded Native SOL</small><p style={{ fontSize: "18px", margin: "4px 0", color: "#f85149" }}>{diag.excludedNativeSol || 0}</p></div>
          <div><small style={{ color: "#8b949e" }}>Excluded WSOL</small><p style={{ fontSize: "18px", margin: "4px 0", color: "#f85149" }}>{diag.excludedWsol || 0}</p></div>
          <div><small style={{ color: "#8b949e" }}>Excluded Stablecoins</small><p style={{ fontSize: "18px", margin: "4px 0", color: "#f85149" }}>{diag.excludedStablecoins || 0}</p></div>
          <div><small style={{ color: "#8b949e" }}>Excluded Quote Assets</small><p style={{ fontSize: "18px", margin: "4px 0", color: "#f85149" }}>{diag.excludedQuoteAssets || 0}</p></div>
          <div><small style={{ color: "#8b949e" }}>Missing Token Addr</small><p style={{ fontSize: "18px", margin: "4px 0" }}>{diag.missingTokenAddress || 0}</p></div>
          <div><small style={{ color: "#8b949e" }}>Invalid Token Addr</small><p style={{ fontSize: "18px", margin: "4px 0" }}>{diag.invalidTokenAddress || 0}</p></div>
        </div>
      </section>

      {/* TOKEN HUNTER OVERVIEW */}
      <section style={{ marginBottom: "24px", padding: "16px", border: "1px solid #30363d", borderRadius: "6px", backgroundColor: "#161b22" }}>
        <h2 style={{ fontSize: "15px", color: "#3fb950", marginTop: 0 }}>TOKEN HUNTER CANDIDATES ({hunterData.candidateCount})</h2>
        <div style={{ padding: "8px 12px", backgroundColor: "#21262d", borderRadius: "4px", fontSize: "12px", color: "#e6edf3", marginBottom: "16px" }}>
          <strong>Diagnostics:</strong> {hunterData.diagnosticSummaryMessage}
        </div>

        <h3 style={{ fontSize: "13px", color: "#8b949e", marginBottom: "8px" }}>SAMPLE REJECTION DIAGNOSTICS (REAL DEXSCREENER DATA)</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #30363d", textAlign: "left", color: "#8b949e" }}>
              <th style={{ padding: "6px" }}>TOKEN</th>
              <th style={{ padding: "6px" }}>ADDRESS</th>
              <th style={{ padding: "6px" }}>PRICE</th>
              <th style={{ padding: "6px" }}>LIQUIDITY</th>
              <th style={{ padding: "6px" }}>VOLUME 24H</th>
              <th style={{ padding: "6px" }}>DEX / PAIR</th>
              <th style={{ padding: "6px" }}>REJECTION REASON</th>
            </tr>
          </thead>
          <tbody>
            {sampleRejections.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #21262d" }}>
                <td style={{ padding: "6px", fontWeight: "bold" }}>{item.symbol}</td>
                <td style={{ padding: "6px", color: "#8b949e" }}>{item.tokenAddress ? `${item.tokenAddress.slice(0, 4)}...${item.tokenAddress.slice(-4)}` : "--"}</td>
                <td style={{ padding: "6px" }}>{item.price ? `$${item.price}` : "--"}</td>
                <td style={{ padding: "6px" }}>{item.liquidityUsd ? `$${item.liquidityUsd.toLocaleString()}` : "$0"}</td>
                <td style={{ padding: "6px" }}>{item.volume24hUsd ? `$${item.volume24hUsd.toFixed(2)}` : "$0.00"}</td>
                <td style={{ padding: "6px", color: "#8b949e" }}>{item.dex} / {item.pairAddress ? `${item.pairAddress.slice(0, 4)}...` : "--"}</td>
                <td style={{ padding: "6px", color: "#f85149", fontWeight: "bold" }}>{item.primaryReason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function HealthCard({ title, status, subtext }) {
  let color = "#3fb950";
  if (status === "ERROR") color = "#f85149";
  if (status === "NOT CONFIGURED") color = "#d29922";

  return (
    <div style={{ padding: "12px", border: "1px solid #30363d", borderRadius: "6px", backgroundColor: "#161b22" }}>
      <small style={{ color: "#8b949e" }}>{title}</small>
      <p style={{ margin: "4px 0 0 0", fontWeight: "bold", color }}>{status}</p>
      {subtext && <small style={{ color: "#8b949e", fontSize: "10px" }}>{subtext}</small>}
    </div>
  );
}
