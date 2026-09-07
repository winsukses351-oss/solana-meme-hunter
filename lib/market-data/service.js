/**
 * Market Data Service Layer (Server-Side)
 * Handles provider failover (Birdeye -> DexScreener) & Safe Caching to avoid Rate Limits.
 */

import { fetchBirdeyeHealth, fetchBirdeyeTrendingTokens } from "./birdeye";
import { fetchDexScreenerHealth, fetchDexScreenerSolanaTokens } from "./dexscreener";

// Short Server-Side Cache (30 Seconds TTL)
let cachedTokensData = null;
let lastTokensFetchTime = 0;
const CACHE_TTL_MS = 30000;

export async function getMarketDataHealth() {
  const [birdeye, dexscreener] = await Promise.all([
    fetchBirdeyeHealth(),
    fetchDexScreenerHealth(),
  ]);

  let overallStatus = "NOT_CONFIGURED";
  let activeProvider = "none";

  if (birdeye.status === "CONNECTED") {
    overallStatus = "CONNECTED";
    activeProvider = "birdeye";
  } else if (dexscreener.status === "CONNECTED") {
    overallStatus = "CONNECTED";
    activeProvider = "dexscreener (fallback)";
  } else if (birdeye.status === "ERROR" || dexscreener.status === "ERROR") {
    overallStatus = "ERROR";
  }

  return {
    status: overallStatus,
    activeProvider,
    birdeye,
    dexscreener,
    checkedAt: new Date().toISOString(),
  };
}

export async function getRealSolanaTokens(limit = 10) {
  const now = Date.now();

  // Return cached result if valid
  if (cachedTokensData && now - lastTokensFetchTime < CACHE_TTL_MS) {
    return cachedTokensData;
  }

  // 1. Try Primary Provider (Birdeye)
  let tokens = await fetchBirdeyeTrendingTokens(limit);

  // 2. Fallback to Secondary Provider (DexScreener) if Birdeye failed or not configured
  if (!tokens || tokens.length === 0) {
    tokens = await fetchDexScreenerSolanaTokens(limit);
  }

  const result = {
    tokens: tokens || [],
    count: tokens ? tokens.length : 0,
    fetchedAt: new Date().toISOString(),
  };

  if (result.tokens.length > 0) {
    cachedTokensData = result;
    lastTokensFetchTime = now;
  }

  return result;
}
