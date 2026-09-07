/**
 * DexScreener Public API Integration
 * Real Solana Market Data & Pair Discovery Provider
 * No API Key required. Resilience built for public endpoints.
 */

const DEXSCREENER_SEARCH_URL = "https://api.dexscreener.com/latest/dex/search";

export async function fetchDexScreenerSolanaPairs(query = "solana") {
  try {
    const url = `${DEXSCREENER_SEARCH_URL}?q=${encodeURIComponent(query)}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`DexScreener API error: HTTP ${response.status}`);
    }

    const data = await response.json();
    const pairs = Array.isArray(data?.pairs) ? data.pairs : [];

    // Filter strictly for Solana chain pairs
    const solanaPairs = pairs.filter(
      (pair) => pair && pair.chainId && String(pair.chainId).toLowerCase() === "solana"
    );

    return {
      status: "CONNECTED",
      provider: "DexScreener",
      pairsDiscovered: pairs.length,
      solanaPairsCount: solanaPairs.length,
      pairs: solanaPairs,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: "ERROR",
      provider: "DexScreener",
      pairsDiscovered: 0,
      solanaPairsCount: 0,
      pairs: [],
      error: error.message || "Failed to connect to DexScreener",
      timestamp: new Date().toISOString(),
    };
  }
}
