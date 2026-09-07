/**
 * Token Hunter Service Orchestrator
 * Connects Provider -> Normalize -> Deduplicate -> Filter -> Rank
 */

import { getRealSolanaTokens, getMarketDataHealth } from "@/lib/market-data/service";
import { normalizeRawToken } from "./normalize";
import { deduplicateTokens } from "./deduplicate";
import { filterCandidateTokens } from "./filter";
import { rankCandidates } from "./rank";

let hunterCache = null;
let lastScanTimestamp = 0;
const CACHE_TTL_MS = 20000; // 20-second cache

export async function runTokenHunterPipeline() {
  const now = Date.now();

  if (hunterCache && now - lastScanTimestamp < CACHE_TTL_MS) {
    return hunterCache;
  }

  const startTime = Date.now();
  const marketHealth = await getMarketDataHealth();

  if (marketHealth.status === "ERROR" || marketHealth.status === "NOT_CONFIGURED") {
    const errorResult = {
      status: marketHealth.status,
      activeProvider: marketHealth.activeProvider,
      scanned: 0,
      uniqueTokens: 0,
      filteredCount: 0,
      candidateCount: 0,
      scanDurationMs: Date.now() - startTime,
      candidates: [],
      filtered: [],
      timestamp: new Date().toISOString(),
    };
    return errorResult;
  }

  // 1. DISCOVER: Fetch raw token pairs from Phase 4 Market Data Service
  const rawData = await getRealSolanaTokens(30);
  const rawPairs = rawData.tokens || [];

  // 2. NORMALIZE: Convert raw objects to standard internal schema
  const normalized = rawPairs.map(normalizeRawToken).filter(Boolean);

  // 3. DEDUPLICATE: Group by tokenAddress (chain + tokenAddress)
  const unique = deduplicateTokens(normalized);

  // 4. FILTER: Remove Native SOL, stablecoins, low liquidity/volume
  const { candidates: unfilteredCandidates, filtered } = filterCandidateTokens(unique);

  // 5. RANK: Calculate transparent Discovery Score
  const rankedCandidates = rankCandidates(unfilteredCandidates);

  const scanDurationMs = Date.now() - startTime;

  const result = {
    status: "CONNECTED",
    activeProvider: marketHealth.activeProvider,
    scanned: normalized.length,
    uniqueTokens: unique.length,
    filteredCount: filtered.length,
    candidateCount: rankedCandidates.length,
    scanDurationMs,
    candidates: rankedCandidates,
    filtered: filtered,
    timestamp: new Date().toISOString(),
  };

  hunterCache = result;
  lastScanTimestamp = now;

  return result;
}
