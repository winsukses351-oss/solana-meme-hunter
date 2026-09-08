/**
 * Token Hunter Engine Service
 * Handles Deduplication, Pair Selection, Asset Filtering, and Volume Diagnostics
 */

import { fetchSolanaMarketPairs } from "../market-data/dexscreener";
import { HUNTER_CONFIG, REJECTION_REASONS } from "./config";
import { filterCandidateTokens } from "./filter";

export async function runTokenHunterPipeline() {
  const marketResult = await fetchSolanaMarketPairs();

  if (!marketResult.success) {
    return {
      status: "ERROR",
      candidateCount: 0,
      candidates: [],
      filtered: [],
      error: marketResult.error,
      diagnosticSummaryMessage: `Market discovery failed: ${marketResult.error}`,
    };
  }

  const rawPairs = marketResult.pairs || [];

  // Group pairs by baseToken.address (Deduplication & Multi-pair Representative Selection)
  const tokensMap = new Map();

  for (const pair of rawPairs) {
    if (!pair.baseToken || !pair.baseToken.address) continue;

    const address = pair.baseToken.address;
    const liquidityUsd = parseFloat(pair.liquidity?.usd || 0);
    const volume24hUsd = parseFloat(pair.volume?.h24 || 0);

    const candidatePairObj = {
      chain: pair.chainId,
      tokenAddress: address,
      symbol: pair.baseToken.symbol || "UNKNOWN",
      name: pair.baseToken.name || "Unknown Token",
      quoteAddress: pair.quoteToken?.address || null,
      quoteSymbol: pair.quoteToken?.symbol || null,
      price: pair.priceUsd ? parseFloat(pair.priceUsd) : null,
      liquidityUsd,
      volume24hUsd,
      pairAddress: pair.pairAddress,
      dex: pair.dexId,
      pairCreatedAt: pair.pairCreatedAt ? new Date(pair.pairCreatedAt).toISOString() : null,
      timestamp: new Date().toISOString(),
    };

    if (!tokensMap.has(address)) {
      tokensMap.set(address, candidatePairObj);
    } else {
      // Deterministic Representative Pair Selection Criteria:
      // 1. Higher Liquidity USD
      // 2. Higher 24h Volume USD
      const existing = tokensMap.get(address);
      if (
        liquidityUsd > existing.liquidityUsd ||
        (liquidityUsd === existing.liquidityUsd && volume24hUsd > existing.volume24hUsd)
      ) {
        tokensMap.set(address, candidatePairObj);
      }
    }
  }

  const uniqueTokens = Array.from(tokensMap.values());

  // Run Hard Asset Filter and Criteria Diagnostics
  const filterResult = filterCandidateTokens(uniqueTokens);

  // Compute Actual SPL Tokens Discovered (Base tokens that passed hard asset exclusion)
  const actualSplDiscovered = filterResult.diagnosticsStats.passedAssetFilter || 0;

  return {
    status: "CONNECTED",
    endpointUsed: marketResult.endpointUsed,
    rawPairsCount: marketResult.rawCount || rawPairs.length,
    solanaPairsCount: marketResult.solanaCount || rawPairs.length,
    uniqueTokensCount: uniqueTokens.length,
    actualSplDiscovered,
    candidateCount: filterResult.candidates.length,
    candidates: filterResult.candidates,
    filtered: filterResult.filtered,
    rejectionBreakdown: filterResult.rejectionBreakdown,
    diagnosticsStats: filterResult.diagnosticsStats,
    volumeStats: filterResult.volumeStats,
    diagnosticSummaryMessage: filterResult.diagnosticSummaryMessage,
    timestamp: new Date().toISOString(),
  };
}
