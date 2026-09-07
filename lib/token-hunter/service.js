/**
 * Token Hunter Service Orchestrator
 */

import { fetchDexScreenerSolanaPairs } from "@/lib/market-data/dexscreener";
import { getMarketDataHealth } from "@/lib/market-data/service";
import { HUNTER_CONFIG } from "./config";
import { normalizeRawToken } from "./normalize";
import { deduplicateTokens } from "./deduplicate";
import { filterCandidateTokens } from "./filter";
import { rankCandidates } from "./rank";

let hunterCache = null;
let lastScanTimestamp = 0;
const CACHE_TTL_MS = 5000;

export async function runTokenHunterPipeline() {
  const now = Date.now();

  if (hunterCache && now - lastScanTimestamp < CACHE_TTL_MS) {
    return hunterCache;
  }

  const startTime = Date.now();
  const marketHealth = await getMarketDataHealth();

  const dexResult = await fetchDexScreenerSolanaPairs("solana");

  if (dexResult.status === "ERROR") {
    return {
      status: "ERROR",
      activeProvider: "DexScreener",
      pairsDiscovered: 0,
      solanaPairs: 0,
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

  const rawPairs = dexResult.pairs || [];

  // 1. Normalize Base Tokens
  const normalized = rawPairs.map(normalizeRawToken).filter(Boolean);

  // 2. Deduplicate by Token Address
  const unique = deduplicateTokens(normalized);

  // 3. Filter Diagnostics
  const { candidates: unfilteredCandidates, filtered, rejectionBreakdown, diagnosticsStats } =
    filterCandidateTokens(unique);

  // 4. Rank Candidates
  const rankedCandidates = rankCandidates(unfilteredCandidates);

  const scanDurationMs = Date.now() - startTime;

  const result = {
    status: "CONNECTED",
    activeProvider: "DexScreener",
    birdeyeStatus: marketHealth.birdeyeStatus || "NOT CONFIGURED",
    pairsDiscovered: dexResult.pairsDiscovered,
    solanaPairs: dexResult.solanaPairsCount,
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
