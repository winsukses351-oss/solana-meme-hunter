/**
 * DexScreener Public API Integration
 * Real Solana Market Data & Pair Discovery Provider
 */

const DEXSCREENER_SEARCH_URL = "https://api.dexscreener.com/latest/dex/search";

export async function fetchDexScreenerSolanaPairs(query = "solana") {
  try {
    const url = `${DEXSCREENER_SEARCH_URL}?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 10 },
    });

    if (!response.ok) {
      throw new Error(`DexScreener API responded with status ${response.status}`);
    }

    const data = await response.json();
    const pairs = data.pairs || [];

    // Filter strictly for Solana chain pairs
    const solanaPairs = pairs.filter(
      (pair) => pair && pair.chainId && pair.chainId.toLowerCase() === "solana"
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
      error: error.message || "Failed to fetch from DexScreener",
      timestamp: new Date().toISOString(),
    };
  }
}
