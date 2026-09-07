/**
 * Token Hunter Service Orchestrator
 * Connects Provider -> Normalize -> Deduplicate -> Filter Diagnostics -> Rank
 */

import { getRealSolanaTokens, getMarketDataHealth } from "@/lib/market-data/service";
import { HUNTER_CONFIG } from "./config";
import { normalizeRawToken } from "./normalize";
import { deduplicateTokens } from "./deduplicate";
import { filterCandidateTokens } from "./filter";
import { rankCandidates } from "./rank";

let hunterCache = null;
let lastScanTimestamp = 0;
const CACHE_TTL_MS = 15000; // 15-second cache

export async function runTokenHunterPipeline() {
  const now = Date.now();

  if (hunterCache && now - lastScanTimestamp < CACHE_TTL_MS) {
    return hunterCache;
  }

  const startTime = Date.now();
  const marketHealth = await getMarketDataHealth();

  if (marketHealth.status === "ERROR" || marketHealth.status === "NOT_CONFIGURED") {
    return {
      status: marketHealth.status,
      activeProvider: marketHealth.activeProvider || "NONE",
      scanned: 0,
      uniqueTokens: 0,
      filteredCount: 0,
      candidateCount: 0,
      scanDurationMs: Date.now() - startTime,
      candidates: [],
      filtered: [],
      rejectionBreakdown: {},
      diagnosticsStats: {},
      currentThresholds: {
        minLiquidityUsd: HUNTER_CONFIG.MIN_LIQUIDITY_USD,
        minVolume24hUsd: HUNTER_CONFIG.MIN_VOLUME_24H_USD,
        maxDataAgeSeconds: HUNTER_CONFIG.MAX_DATA_AGE_SECONDS,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // 1. DISCOVER: Fetch raw token pairs from active provider
  const rawData = await getRealSolanaTokens(30);
  const rawPairs = rawData.tokens || [];

  // 2. NORMALIZE: Parse precision numeric attributes
  const normalized = rawPairs.map(normalizeRawToken).filter(Boolean);

  // 3. DEDUPLICATE: Collapse multi-pair tokens by tokenAddress
  const unique = deduplicateTokens(normalized);

  // 4. FILTER DIAGNOSTICS: Evaluate thresholds & collect rejection stats
  const { candidates: unfilteredCandidates, filtered, rejectionBreakdown, diagnosticsStats } =
    filterCandidateTokens(unique);

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
    filtered,
    rejectionBreakdown,
    diagnosticsStats,
    currentThresholds: {
      minLiquidityUsd: HUNTER_CONFIG.MIN_LIQUIDITY_USD,
      minVolume24hUsd: HUNTER_CONFIG.MIN_VOLUME_24H_USD,
      maxDataAgeSeconds: HUNTER_CONFIG.MAX_DATA_AGE_SECONDS,
    },
    timestamp: new Date().toISOString(),
  };

  hunterCache = result;
  lastScanTimestamp = now;

  return result;
}
