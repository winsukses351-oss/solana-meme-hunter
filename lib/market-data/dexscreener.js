/**
 * DexScreener API Integration Provider
 * Real Solana SPL Token Discovery Service
 */

const DEXSCREENER_BASE_URL = "https://api.dexscreener.com";

export async function fetchSolanaMarketPairs() {
  try {
    // 1. Fetch Top/Latest Boosted Tokens on Solana to find active SPL meme tokens
    const boostResponse = await fetch(`${DEXSCREENER_BASE_URL}/token-boosts/top/v1`, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 30 },
    });

    let tokenAddresses = [];

    if (boostResponse.ok) {
      const boostData = await boostResponse.json();
      if (Array.isArray(boostData)) {
        tokenAddresses = boostData
          .filter((item) => item.chainId === "solana" && item.tokenAddress)
          .map((item) => item.tokenAddress);
      }
    }

    // Fallback or augment with search pairs if boosted tokens are sparse
    if (tokenAddresses.length === 0) {
      const searchResponse = await fetch(`${DEXSCREENER_BASE_URL}/latest/dex/search?q=pump`, {
        headers: { "Accept": "application/json" },
        next: { revalidate: 30 },
      });
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.pairs && Array.isArray(searchData.pairs)) {
          const solanaPairs = searchData.pairs.filter((p) => p.chainId === "solana" && p.baseToken?.address);
          tokenAddresses = Array.from(new Set(solanaPairs.map((p) => p.baseToken.address)));
        }
      }
    }

    // Deduplicate addresses and limit batch size to 30 tokens for multi-token lookup
    const uniqueAddresses = Array.from(new Set(tokenAddresses)).slice(0, 30);

    if (uniqueAddresses.length === 0) {
      return { success: true, pairs: [], rawCount: 0 };
    }

    // 2. Fetch Pairs for discovered SPL token addresses
    const pairsResponse = await fetch(
      `${DEXSCREENER_BASE_URL}/latest/dex/tokens/${uniqueAddresses.join(",")}`,
      {
        headers: { "Accept": "application/json" },
        cache: "no-store",
      }
    );

    if (!pairsResponse.ok) {
      throw new Error(`DexScreener API status ${pairsResponse.status}`);
    }

    const data = await pairsResponse.json();
    const rawPairs = data.pairs || [];

    // Filter strictly for Solana chain
    const solanaPairs = rawPairs.filter((p) => p.chainId === "solana");

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
