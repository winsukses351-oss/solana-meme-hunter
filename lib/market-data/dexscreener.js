/**
 * Server-Side DexScreener API Client (Fallback Provider)
 * Public API for Solana Dex Pair Data.
 */

const DEXSCREENER_BASE_URL = "https://api.dexscreener.com/latest/dex";

export async function fetchDexScreenerHealth() {
  const startTime = Date.now();

  try {
    const response = await fetch(
      `${DEXSCREENER_BASE_URL}/search?q=SOL`,
      {
        method: "GET",
        headers: { accept: "application/json" },
        cache: "no-store",
      }
    );

    const latencyMs = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.pairs)) {
        return {
          status: "CONNECTED",
          provider: "dexscreener",
          latencyMs,
          checkedAt: new Date().toISOString(),
        };
      }
    }

    return {
      status: "ERROR",
      provider: "dexscreener",
      error: `HTTP ${response.status}`,
      latencyMs,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[DexScreener Fetch Error]:", error.message);
    return {
      status: "ERROR",
      provider: "dexscreener",
      error: error.message,
      latencyMs: null,
      checkedAt: new Date().toISOString(),
    };
  }
}

export async function fetchDexScreenerSolanaTokens(limit = 10) {
  try {
    const response = await fetch(
      `${DEXSCREENER_BASE_URL}/search?q=solana`,
      {
        method: "GET",
        headers: { accept: "application/json" },
        cache: "no-store",
      }
    );

    if (!response.ok) return [];

    const json = await response.json();
    if (!json || !Array.isArray(json.pairs)) return [];

    // Strictly filter pairs for Solana chain only
    const solanaPairs = json.pairs
      .filter((pair) => pair.chainId === "solana")
      .slice(0, limit);

    return solanaPairs.map((pair) => ({
      chain: "solana",
      tokenAddress: pair.baseToken?.address || null,
      symbol: pair.baseToken?.symbol || "UNKNOWN",
      name: pair.baseToken?.name || "Unknown Token",
      price: pair.priceUsd ? parseFloat(pair.priceUsd) : 0,
      priceChange24h: pair.priceChange?.h24 ?? 0,
      liquidityUsd: pair.liquidity?.usd ?? 0,
      volume24hUsd: pair.volume?.h24 ?? 0,
      marketCapUsd: pair.marketCap || pair.fdv || null,
      fdvUsd: pair.fdv || null,
      dex: pair.dexId || "Solana DEX",
      pairAddress: pair.pairAddress || null,
      source: "dexscreener",
      timestamp: new Date().toISOString(),
    }));
  } catch (error) {
    console.error("[DexScreener Token Fetch Error]:", error.message);
    return [];
  }
}
