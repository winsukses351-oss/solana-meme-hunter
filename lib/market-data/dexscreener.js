/**
 * DexScreener API Integration Provider
 * Real Solana SPL Token Discovery Service
 */

const DEXSCREENER_BASE_URL = "https://api.dexscreener.com";

export async function fetchSolanaMarketPairs() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    // 1. Fetch Top/Latest Boosted Tokens on Solana
    const boostResponse = await fetch(`${DEXSCREENER_BASE_URL}/token-boosts/top/v1`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    }).catch(() => null);

    clearTimeout(timeoutId);

    let tokenAddresses = [];

    if (boostResponse && boostResponse.ok) {
      const boostData = await boostResponse.json().catch(() => []);
      if (Array.isArray(boostData)) {
        tokenAddresses = boostData
          .filter((item) => item && item.chainId === "solana" && item.tokenAddress)
          .map((item) => item.tokenAddress);
      }
    }

    // Fallback if boosted tokens fetch failed or empty
    if (tokenAddresses.length === 0) {
      const fallbackController = new AbortController();
      const fbTimeoutId = setTimeout(() => fallbackController.abort(), 6000);

      const searchResponse = await fetch(`${DEXSCREENER_BASE_URL}/latest/dex/search?q=SOL`, {
        headers: { Accept: "application/json" },
        signal: fallbackController.signal,
        cache: "no-store",
      }).catch(() => null);

      clearTimeout(fbTimeoutId);

      if (searchResponse && searchResponse.ok) {
        const searchData = await searchResponse.json().catch(() => ({}));
        if (searchData && searchData.pairs && Array.isArray(searchData.pairs)) {
          const solanaPairs = searchData.pairs.filter((p) => p && p.chainId === "solana" && p.baseToken?.address);
          tokenAddresses = Array.from(new Set(solanaPairs.map((p) => p.baseToken.address)));
        }
      }
    }

    const uniqueAddresses = Array.from(new Set(tokenAddresses)).slice(0, 30);

    if (uniqueAddresses.length === 0) {
      return { success: true, pairs: [], rawCount: 0, solanaCount: 0, endpointUsed: "NONE" };
    }

    // 2. Multi-token pairs lookup
    const pairController = new AbortController();
    const pairTimeoutId = setTimeout(() => pairController.abort(), 6000);

    const pairsResponse = await fetch(
      `${DEXSCREENER_BASE_URL}/latest/dex/tokens/${uniqueAddresses.join(",")}`,
      {
        headers: { Accept: "application/json" },
        signal: pairController.signal,
        cache: "no-store",
      }
    ).catch(() => null);

    clearTimeout(pairTimeoutId);

    if (!pairsResponse || !pairsResponse.ok) {
      return { success: false, error: "DexScreener API Timeout or Error", pairs: [], rawCount: 0, solanaCount: 0 };
    }

    const data = await pairsResponse.json().catch(() => ({}));
    const rawPairs = (data && data.pairs && Array.isArray(data.pairs)) ? data.pairs : [];
    const solanaPairs = rawPairs.filter((p) => p && p.chainId === "solana");

    return {
      success: true,
      pairs: solanaPairs,
      rawCount: rawPairs.length,
      solanaCount: solanaPairs.length,
      endpointUsed: `${DEXSCREENER_BASE_URL}/latest/dex/tokens/`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to fetch DexScreener market data",
      pairs: [],
      rawCount: 0,
      solanaCount: 0,
    };
  }
}
