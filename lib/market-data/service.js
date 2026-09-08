/**
 * Market Data Service Orchestrator
 * Ensures true DexScreener & Market Data status consistency.
 */

import { fetchDexScreenerSolanaPairs } from "./dexscreener";

export async function getMarketDataHealth() {
  const birdeyeApiKey = process.env.BIRDEYE_API_KEY;
  let birdeyeStatus = "NOT CONFIGURED";

  if (birdeyeApiKey) {
    try {
      const res = await fetch("https://public-api.birdeye.so/defi/networks", {
        headers: { "X-API-KEY": birdeyeApiKey },
        cache: "no-store",
      });
      birdeyeStatus = res.ok ? "CONNECTED" : "ERROR";
    } catch {
      birdeyeStatus = "ERROR";
    }
  }

  // Live DexScreener Health Verification
  const dexResult = await fetchDexScreenerSolanaPairs("solana");
  const dexscreenerStatus = dexResult.status;

  const marketDataStatus =
    birdeyeStatus === "CONNECTED" || dexscreenerStatus === "CONNECTED"
      ? "CONNECTED"
      : "ERROR";

  return {
    status: marketDataStatus,
    activeProvider: dexscreenerStatus === "CONNECTED" ? "DexScreener" : "NONE",
    birdeyeStatus,
    dexscreenerStatus,
    pairsDiscovered: dexResult.pairsDiscovered || 0,
    solanaPairsCount: dexResult.solanaPairsCount || 0,
    timestamp: new Date().toISOString(),
  };
}
