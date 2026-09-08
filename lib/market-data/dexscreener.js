/**
 * Unified DexScreener API Provider
 * Single Source of Truth for Market Data & Health Probes
 */

const DEXSCREENER_BASE_URL = "https://api.dexscreener.com";
const DEFAULT_TIMEOUT_MS = 6000;

/**
 * Shared Safe Fetch wrapper with timeout and error logging
 */
async function safeFetch(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || DEFAULT_TIMEOUT_MS);
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", ...options.headers },
      signal: controller.signal,
      cache: "no-store",
    });

    const latency = Date.now() - startTime;
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[DEXSCREENER ERROR] HTTP ${response.status} - ${url} (${latency}ms)`);
      return { ok: false, status: response.status, latency, data: null };
    }

    const data = await response.json().catch(() => null);
    return { ok: true, status: response.status, latency, data };
  } catch (error) {
    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;
    console.error(`[DEXSCREENER FETCH FAILED] ${error.message} - ${url} (${latency}ms)`);
    return { ok: false, status: 500, latency, error: error.message, data: null };
  }
}

/**
 * Health check probe using official DexScreener token endpoint
 */
export async function probeDexScreenerHealth() {
  const startTime = Date.now();
  // Query a highly active standard Solana pair (WSOL) to verify real API response
  const SOL_MINT = "So11111111111111111111111111111111111111112";
  const res = await safeFetch(`${DEXSCREENER_BASE_URL}/latest/dex/tokens/${SOL_MINT}`);

  const totalLatency = Date.now() - startTime;

  if (res.ok && res.data && Array.isArray(res.data.pairs)) {
    console.log(`[DEXSCREENER HEALTH] Status: CONNECTED | Latency: ${totalLatency}ms | Timestamp: ${new Date().toISOString()}`);
    return {
      status: "CONNECTED",
      latency: totalLatency,
      httpStatus: res.status,
      timestamp: new Date().toISOString(),
    };
  }

  console.error(`[DEXSCREENER HEALTH] Status: ERROR | Latency: ${totalLatency}ms | Timestamp: ${new Date().toISOString()}`);
  return {
    status: "ERROR",
    latency: totalLatency,
    httpStatus: res.status || 500,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Core Market Data Fetching Engine (Preserving Phase 5.5 Discovery Logic)
 */
export async function fetchSolanaMarketPairs() {
  try {
    // 1. Fetch Top Boosted Tokens
    let tokenAddresses = [];
    const boostRes = await safeFetch(`${DEXSCREENER_BASE_URL}/token-boosts/top/v1`);

    if (boostRes.ok && Array.isArray(boostRes.data)) {
      tokenAddresses = boostRes.data
        .filter((item) => item && item.chainId === "solana" && item.tokenAddress)
        .map((item) => item.tokenAddress);
    }

    // 2. Fallback to SOL Pairs Search if Boosted returns empty
    if (tokenAddresses.length === 0) {
      const searchRes = await safeFetch(`${DEXSCREENER_BASE_URL}/latest/dex/search?q=SOL`);
      if (searchRes.ok && searchRes.data?.pairs && Array.isArray(searchRes.data.pairs)) {
        const solanaPairs = searchRes.data.pairs.filter((p) => p && p.chainId === "solana" && p.baseToken?.address);
        tokenAddresses = Array.from(new Set(solanaPairs.map((p) => p.baseToken.address)));
      }
    }

    const uniqueAddresses = Array.from(new Set(tokenAddresses)).slice(0, 30);

    if (uniqueAddresses.length === 0) {
      return { success: true, pairs: [], rawCount: 0, solanaCount: 0, endpointUsed: "NONE" };
    }

    // 3. Multi-token Pairs Batch Lookup
    const pairsRes = await safeFetch(`${DEXSCREENER_BASE_URL}/latest/dex/tokens/${uniqueAddresses.join(",")}`);

    if (!pairsRes.ok || !pairsRes.data?.pairs) {
      return { success: false, error: "DexScreener API Multi-Token Lookup Failed", pairs: [], rawCount: 0, solanaCount: 0 };
    }

    const rawPairs = Array.isArray(pairsRes.data.pairs) ? pairsRes.data.pairs : [];
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
