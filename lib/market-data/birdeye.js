/**
 * Server-Side Birdeye API Client (Primary Provider)
 * Strictly read-only market data fetcher.
 */

const BIRDEYE_BASE_URL = "https://public-api.birdeye.so";

export async function fetchBirdeyeHealth() {
  const apiKey = process.env.BIRDEYE_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    return {
      status: "NOT_CONFIGURED",
      provider: "birdeye",
      latencyMs: null,
      checkedAt: new Date().toISOString(),
    };
  }

  const startTime = Date.now();

  try {
    const response = await fetch(
      `${BIRDEYE_BASE_URL}/defi/tokenlist?sort_by=v24hUSD&sort_type=desc&offset=0&limit=1`,
      {
        method: "GET",
        headers: {
          "X-API-KEY": apiKey,
          "x-chain": "solana",
          accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const latencyMs = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return {
          status: "CONNECTED",
          provider: "birdeye",
          latencyMs,
          checkedAt: new Date().toISOString(),
        };
      }
    }

    if (response.status === 401 || response.status === 403) {
      console.error("[Birdeye API Error]: Invalid API Key or Unauthorized");
      return {
        status: "ERROR",
        provider: "birdeye",
        error: "Unauthorized or Invalid API Key",
        latencyMs,
        checkedAt: new Date().toISOString(),
      };
    }

    if (response.status === 429) {
      return {
        status: "ERROR",
        provider: "birdeye",
        error: "Rate Limit Exceeded",
        latencyMs,
        checkedAt: new Date().toISOString(),
      };
    }

    return {
      status: "ERROR",
      provider: "birdeye",
      error: `HTTP ${response.status}`,
      latencyMs,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[Birdeye Fetch Error]:", error.message);
    return {
      status: "ERROR",
      provider: "birdeye",
      error: error.message,
      latencyMs: null,
      checkedAt: new Date().toISOString(),
    };
  }
}

export async function fetchBirdeyeTrendingTokens(limit = 10) {
  const apiKey = process.env.BIRDEYE_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    return null;
  }

  try {
    const response = await fetch(
      `${BIRDEYE_BASE_URL}/defi/tokenlist?sort_by=v24hUSD&sort_type=desc&offset=0&limit=${limit}`,
      {
        method: "GET",
        headers: {
          "X-API-KEY": apiKey,
          "x-chain": "solana",
          accept: "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return null;
    }

    const json = await response.json();
    if (!json.success || !json.data || !Array.isArray(json.data.tokens)) {
      return null;
    }

    return json.data.tokens.map((token) => ({
      chain: "solana",
      tokenAddress: token.address || null,
      symbol: token.symbol || "UNKNOWN",
      name: token.name || "Unknown Token",
      price: token.price ?? 0,
      priceChange24h: token.v24hChangePercent ?? 0,
      liquidityUsd: token.liquidity ?? 0,
      volume24hUsd: token.v24hUSD ?? 0,
      marketCapUsd: token.mc ?? null,
      fdvUsd: token.fdv ?? null,
      dex: "Raydium/Orca",
      pairAddress: null,
      source: "birdeye",
      timestamp: new Date().toISOString(),
    }));
  } catch (error) {
    console.error("[Birdeye Token Fetch Error]:", error.message);
    return null;
  }
}
