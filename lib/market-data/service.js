/**
 * Market Data Service Integration
 */
import { probeDexScreenerHealth } from "./dexscreener";

export async function getMarketDataHealth() {
  const startTime = Date.now();
  const dexProbe = await probeDexScreenerHealth();
  const latency = Date.now() - startTime;

  const isConnected = dexProbe.status === "CONNECTED";

  console.log(`[MARKET DATA HEALTH] Provider: DexScreener | Status: ${isConnected ? "CONNECTED" : "ERROR"} | Latency: ${latency}ms | Timestamp: ${new Date().toISOString()}`);

  return {
    status: isConnected ? "CONNECTED" : "ERROR",
    dexscreenerStatus: dexProbe.status,
    latency,
    provider: "DexScreener",
    timestamp: new Date().toISOString(),
  };
}
