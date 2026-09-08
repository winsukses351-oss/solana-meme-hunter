/**
 * Solana AI Trader Dashboard — Phase 5.6
 */
import { checkDatabaseHealth } from "@/lib/db";
import { checkSolanaRpcHealth } from "@/lib/solana/rpc";
import { getMarketDataHealth } from "@/lib/market-data/service";
import { runTokenHunterPipeline } from "@/lib/token-hunter/service";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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
    <div style={{ padding: "24px", fontFamily: "monospace", backgroundColor: "#0d1117", color: "#c9d1d9", minHeight: "100vh" }}>
      <header style={{ borderBottom: "1px solid #30363d", paddingBottom: "16px", marginBottom: "24px" }}>
        <h1 style={{ color: "#58a6ff", margin: "0 0 8px 0" }}>SOLANA AI TRADER — DASHBOARD</h1>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ padding: "4px 8px", borderRadius: "4px", backgroundColor: "#da3633", color: "#fff", fontWeight: "bold" }}>
            TRADING: BLOCKED
          </span>
          <span style={{ color: "#8b949e" }}>Phase 5.6 Health Consistency</span>
        </div>
      </header>

      {/* SYSTEM HEALTH MONITOR */}
      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "14px", color: "#8b949e", marginBottom: "12px" }}>SYSTEM HEALTH MONITOR</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px" }}>
          <HealthCard title="Backend API" status={isBackendConnected ? "CONNECTED" : "ERROR"} />
          <HealthCard title="PostgreSQL" status={dbHealth?.status || "NOT CONFIGURED"} />
          <HealthCard title="Solana RPC" status={rpcHealth?.status || "ERROR"} subtext={rpcHealth?.currentSlot ? `Slot: ${rpcHealth.currentSlot}` : null} />
          <HealthCard title="Market Data" status={marketHealth?.status || "ERROR"} />
          <HealthCard title="DexScreener" status={marketHealth?.dexscreenerStatus || "ERROR"} />
          <HealthCard title="Token Hunter" status={hunterData?.status || "ERROR"} />
        </div>
      </section>

      {/* DISCOVERY DIAGNOSTICS */}
      <section style={{ marginBottom: "24px", padding: "16px", border: "1px solid #30363d", borderRadius: "6px", backgroundColor: "#161b22" }}>
        <h2 style={{ fontSize: "15px", color: "#58a6ff", marginTop: 0 }}>REAL SOLANA SPL DISCOVERY DIAGNOSTICS</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
          <div><small style={{ color: "#8b949e" }}>Raw Pairs</small><p style={{ fontSize: "18px", margin: "4px 0" }}>{hunterData?.rawPairsCount || 0}</p></div>
          <div><small style={{ color: "#8b949e" }}>Solana Pairs</small><p style={{ fontSize: "18px", margin: "4px 0" }}>{hunterData?.solanaPairsCount || 0}</p></div>
          <div><small style={{ color: "#8b949e" }}>Unique Base Tokens</small><p style={{ fontSize: "18px", margin: "4px 0" }}>{hunterData?.uniqueTokensCount || 0}</p></div>
          <div><small style={{ color: "#8b949e" }}>Actual SPL Tokens</small><p style={{ fontSize: "18px", margin: "4px 0", color: "#3fb950", fontWeight: "bold" }}>{hunterData?.actualSplDiscovered || 0}</p></div>
          <div><small style={{ color: "#8b949e" }}>Native SOL</small><p style={{ fontSize: "18px", margin: "4px 0", color: "#f85149" }}>{diag?.excludedNativeSol || 0}</p></div>
          <div><small style={{ color: "#8b949e" }}>WSOL</small><p style={{ fontSize: "18px", margin: "4px 0", color: "#f85149" }}>{diag?.excludedWsol || 0}</p></div>
          <div><small style={{ color: "#8b949e" }}>Stablecoins</small><p style={{ fontSize: "18px", margin: "4px 0", color: "#f85149" }}>{diag?.excludedStablecoins || 0}</p></div>
          <div><small style={{ color: "#8b949e" }}>Quote Assets</small><p style={{ fontSize: "18px", margin: "4px 0", color: "#f85149" }}>{diag?.excludedQuoteAssets || 0}</p></div>
          <div><small style={{ color: "#8b949e" }}>Missing Addr</small><p style={{ fontSize: "18px", margin: "4px 0" }}>{diag?.missingTokenAddress || 0}</p></div>
          <div><small style={{ color: "#8b949e" }}>Invalid Addr</small><p style={{ fontSize: "18px", margin: "4px 0" }}>{diag?.invalidTokenAddress || 0}</p></div>
          <div><small style={{ color: "#8b949e" }}>Low Liquidity</small><p style={{ fontSize: "18px", margin: "4px 0" }}>{diag?.lowLiquidity || 0}</p></div>
          <div><small style={{ color: "#8b949e" }}>Low Volume</small><p style={{ fontSize: "18px", margin: "4px 0" }}>{diag?.lowVolume || 0}</p></div>
          <div><small style={{ color: "#8b949e" }}>Valid Candidates</small><p style={{ fontSize: "18px", margin: "4px 0", color: "#3fb950", fontWeight: "bold" }}>{hunterData?.candidateCount || 0}</p></div>
        </div>
      </section>

      {/* DISCOVERED CANDIDATES TABLE */}
      <section style={{ marginBottom: "24px", padding: "16px", border: "1px solid #30363d", borderRadius: "6px", backgroundColor: "#161b22" }}>
        <h2 style={{ fontSize: "15px", color: "#3fb950", marginTop: 0 }}>VALID CANDIDATES DISCOVERED ({candidatesList.length})</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: "16px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #30363d", textAlign: "left", color: "#8b949e" }}>
              <th style={{ padding: "6px" }}>TOKEN</th>
              <th style={{ padding: "6px" }}>ADDRESS</th>
              <th style={{ padding: "6px" }}>PRICE</th>
              <th style={{ padding: "6px" }}>LIQUIDITY</th>
              <th style={{ padding: "6px" }}>24H VOLUME</th>
              <th style={{ padding: "6px" }}>DEX</th>
              <th style={{ padding: "6px" }}>PAIR</th>
              <th style={{ padding: "6px" }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {candidatesList.length === 0 ? (
              <tr><td colSpan="8" style={{ padding: "12px", textAlign: "center", color: "#8b949e" }}>No candidates met threshold criteria ($2.5k Liquidity / $1k Volume)</td></tr>
            ) : (
              candidatesList.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #21262d" }}>
                  <td style={{ padding: "6px", fontWeight: "bold", color: "#58a6ff" }}>{item?.symbol || "UNKNOWN"}</td>
                  <td style={{ padding: "6px", color: "#8b949e" }}>{item?.tokenAddress ? `${item.tokenAddress.slice(0, 6)}...${item.tokenAddress.slice(-4)}` : "--"}</td>
                  <td style={{ padding: "6px" }}>{item?.price ? `$${item.price}` : "--"}</td>
                  <td style={{ padding: "6px" }}>${item?.liquidityUsd?.toLocaleString() || "0"}</td>
                  <td style={{ padding: "6px" }}>${item?.volume24hUsd?.toLocaleString() || "0"}</td>
                  <td style={{ padding: "6px" }}>{item?.dex || "--"}</td>
                  <td style={{ padding: "6px", color: "#8b949e" }}>{item?.pairAddress ? `${item.pairAddress.slice(0, 4)}...` : "--"}</td>
                  <td style={{ padding: "6px", color: "#3fb950", fontWeight: "bold" }}>{item?.status || "DISCOVERED"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* SAMPLE REJECTIONS TABLE */}
        <h3 style={{ fontSize: "13px", color: "#8b949e", marginBottom: "8px" }}>SAMPLE DISCOVERY REJECTIONS (REAL DEXSCREENER DATA)</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #30363d", textAlign: "left", color: "#8b949e" }}>
              <th style={{ padding: "6px" }}>TOKEN</th>
              <th style={{ padding: "6px" }}>ADDRESS</th>
              <th style={{ padding: "6px" }}>PRICE</th>
              <th style={{ padding: "6px" }}>LIQUIDITY</th>
              <th style={{ padding: "6px" }}>24H VOLUME</th>
              <th style={{ padding: "6px" }}>DEX</th>
              <th style={{ padding: "6px" }}>REJECTION REASON</th>
            </tr>
          </thead>
          <tbody>
            {sampleRejections.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #21262d" }}>
                <td style={{ padding: "6px", fontWeight: "bold" }}>{item?.symbol || "UNKNOWN"}</td>
                <td style={{ padding: "6px", color: "#8b949e" }}>{item?.tokenAddress ? `${item.tokenAddress.slice(0, 4)}...${item.tokenAddress.slice(-4)}` : "--"}</td>
                <td style={{ padding: "6px" }}>{item?.price ? `$${item.price}` : "--"}</td>
                <td style={{ padding: "6px" }}>{item?.liquidityUsd ? `$${item.liquidityUsd.toLocaleString()}` : "$0"}</td>
                <td style={{ padding: "6px" }}>{item?.volume24hUsd ? `$${item.volume24hUsd.toLocaleString()}` : "$0"}</td>
                <td style={{ padding: "6px" }}>{item?.dex || "--"}</td>
                <td style={{ padding: "6px", color: "#f85149", fontWeight: "bold" }}>{item?.primaryReason || "REJECTED"}</td>
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
