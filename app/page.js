/**
 * Main Solana AI Trader Dashboard (Phase 5.3 Volume Diagnostics UI)
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

  const isBackendConnected = true; // Route evaluated successfully

  const volumeStats = hunterData.volumeStats || {};
  const sampleRejections = (hunterData.filtered || []).slice(0, 5);

  return (
    <div style={{ padding: "24px", fontFamily: "monospace", backgroundColor: "#0d1117", color: "#c9d1d9", minHeight: "100vh" }}>
      <header style={{ borderBottom: "1px solid #30363d", paddingBottom: "16px", marginBottom: "24px" }}>
        <h1 style={{ color: "#58a6ff", margin: "0 0 8px 0" }}>SOLANA AI TRADER — DASHBOARD</h1>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ padding: "4px 8px", borderRadius: "4px", backgroundColor: "#da3633", color: "#fff", fontWeight: "bold" }}>
            TRADING: BLOCKED
          </span>
          <span style={{ color: "#8b949e" }}>Phase 5.3 Real Volume Diagnostics</span>
        </div>
      </header>

      {/* HEALTH CONSISTENCY PANEL */}
      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "16px", color: "#8b949e", marginBottom: "12px" }}>SYSTEM HEALTH MONITOR</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
          <HealthCard title="Backend API" status={isBackendConnected ? "CONNECTED" : "ERROR"} />
          <HealthCard title="PostgreSQL" status={dbHealth.status} />
          <HealthCard title="Solana RPC" status={rpcHealth.status} />
          <HealthCard title="Market Data" status={marketHealth.status} />
          <HealthCard title="DexScreener" status={marketHealth.dexscreenerStatus} />
          <HealthCard title="Token Hunter" status={hunterData.status} />
        </div>
      </section>

      {/* HUNTER OVERVIEW PANEL */}
      <section style={{ marginBottom: "24px", padding: "16px", border: "1px solid #30363d", borderRadius: "6px", backgroundColor: "#161b22" }}>
        <h2 style={{ fontSize: "16px", color: "#58a6ff", marginTop: 0 }}>TOKEN HUNTER METRICS</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
          <div><small style={{ color: "#8b949e" }}>Pairs Discovered</small><p style={{ fontSize: "20px", margin: "4px 0" }}>{hunterData.pairsDiscovered}</p></div>
          <div><small style={{ color: "#8b949e" }}>Unique Tokens</small><p style={{ fontSize: "20px", margin: "4px 0" }}>{hunterData.uniqueTokens}</p></div>
          <div><small style={{ color: "#8b949e" }}>Low Volume (&lt;$1k)</small><p style={{ fontSize: "20px", margin: "4px 0", color: "#f85149" }}>{hunterData.rejectionBreakdown?.LOW_VOLUME || 0}</p></div>
          <div><small style={{ color: "#8b949e" }}>Low Liq (&lt;$2.5k)</small><p style={{ fontSize: "20px", margin: "4px 0", color: "#f85149" }}>{hunterData.rejectionBreakdown?.LOW_LIQUIDITY || 0}</p></div>
          <div><small style={{ color: "#8b949e" }}>Valid Candidates</small><p style={{ fontSize: "20px", margin: "4px 0", color: "#3fb950" }}>{hunterData.candidateCount}</p></div>
        </div>
        <div style={{ marginTop: "12px", padding: "8px 12px", backgroundColor: "#21262d", borderRadius: "4px", fontSize: "13px", color: "#e6edf3" }}>
          <strong>Diagnostic Note:</strong> {hunterData.diagnosticSummaryMessage}
        </div>
      </section>

      {/* REAL VOLUME DIAGNOSTICS */}
      <section style={{ marginBottom: "24px", padding: "16px", border: "1px solid #30363d", borderRadius: "6px", backgroundColor: "#161b22" }}>
        <h2 style={{ fontSize: "16px", color: "#d29922", marginTop: 0 }}>VOLUME DIAGNOSTICS (REAL OBSERVED DATA)</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px" }}>
          <div><small style={{ color: "#8b949e" }}>Required Min Volume</small><p style={{ margin: "4px 0" }}>${hunterData.currentThresholds?.minVolume24hUsd?.toLocaleString()}</p></div>
          <div><small style={{ color: "#8b949e" }}>Observed Min Volume</small><p style={{ margin: "4px 0" }}>{volumeStats.observedMinVolume !== null ? `$${volumeStats.observedMinVolume.toFixed(2)}` : "--"}</p></div>
          <div><small style={{ color: "#8b949e" }}>Observed Max Volume</small><p style={{ margin: "4px 0" }}>{volumeStats.observedMaxVolume !== null ? `$${volumeStats.observedMaxVolume.toFixed(2)}` : "--"}</p></div>
          <div><small style={{ color: "#8b949e" }}>Observed Median Volume</small><p style={{ margin: "4px 0" }}>{volumeStats.observedMedianVolume !== null ? `$${volumeStats.observedMedianVolume.toFixed(2)}` : "--"}</p></div>
          <div><small style={{ color: "#8b949e" }}>Observed Avg Volume</small><p style={{ margin: "4px 0" }}>{volumeStats.observedAverageVolume !== null ? `$${volumeStats.observedAverageVolume.toFixed(2)}` : "--"}</p></div>
        </div>

        <h3 style={{ fontSize: "14px", color: "#8b949e", marginBottom: "8px" }}>LOW VOLUME REAL SAMPLE REJECTIONS</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #30363d", textAlign: "left", color: "#8b949e" }}>
              <th style={{ padding: "6px" }}>TOKEN</th>
              <th style={{ padding: "6px" }}>ADDRESS</th>
              <th style={{ padding: "6px" }}>PRICE</th>
              <th style={{ padding: "6px" }}>LIQUIDITY</th>
              <th style={{ padding: "6px" }}>VOLUME 24H</th>
              <th style={{ padding: "6px" }}>REQUIRED</th>
              <th style={{ padding: "6px" }}>REJECTION</th>
            </tr>
          </thead>
          <tbody>
            {sampleRejections.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #21262d" }}>
                <td style={{ padding: "6px", fontWeight: "bold" }}>{item.symbol}</td>
                <td style={{ padding: "6px", color: "#8b949e" }}>{item.tokenAddress ? `${item.tokenAddress.slice(0, 4)}...${item.tokenAddress.slice(-4)}` : "--"}</td>
                <td style={{ padding: "6px" }}>{item.price ? `$${item.price}` : "--"}</td>
                <td style={{ padding: "6px" }}>{item.liquidityUsd ? `$${item.liquidityUsd.toLocaleString()}` : "$0"}</td>
                <td style={{ padding: "6px", color: "#f85149" }}>{item.volume24hUsd ? `$${item.volume24hUsd.toFixed(2)}` : "$0.00"}</td>
                <td style={{ padding: "6px" }}>${hunterData.currentThresholds?.minVolume24hUsd?.toLocaleString()}</td>
                <td style={{ padding: "6px", color: "#f85149" }}>{item.primaryReason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function HealthCard({ title, status }) {
  let color = "#3fb950"; // Green for CONNECTED
  if (status === "ERROR") color = "#f85149";
  if (status === "NOT CONFIGURED") color = "#d29922";

  return (
    <div style={{ padding: "12px", border: "1px solid #30363d", borderRadius: "6px", backgroundColor: "#161b22" }}>
      <small style={{ color: "#8b949e" }}>{title}</small>
      <p style={{ margin: "4px 0 0 0", fontWeight: "bold", color }}>{status}</p>
    </div>
  );
}
