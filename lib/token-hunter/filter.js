/**
 * Token Hunter Filtering, Hard Asset Exclusion & Volume Diagnostics
 */

import { HUNTER_CONFIG, REJECTION_REASONS } from "./config";

export function filterCandidateTokens(uniqueTokens = []) {
  const passedCandidates = [];
  const filteredOut = [];

  const rejectionBreakdown = {
    [REJECTION_REASONS.MISSING_TOKEN_ADDRESS]: 0,
    [REJECTION_REASONS.INVALID_TOKEN_ADDRESS]: 0,
    [REJECTION_REASONS.WRONG_CHAIN]: 0,
    [REJECTION_REASONS.NATIVE_SOL]: 0,
    [REJECTION_REASONS.WRAPPED_SOL]: 0,
    [REJECTION_REASONS.EXCLUDED_STABLECOIN]: 0,
    [REJECTION_REASONS.EXCLUDED_QUOTE_ASSET]: 0,
    [REJECTION_REASONS.EXCLUDED_ASSET]: 0,
    [REJECTION_REASONS.MISSING_PRICE]: 0,
    [REJECTION_REASONS.INVALID_PRICE]: 0,
    [REJECTION_REASONS.MISSING_LIQUIDITY]: 0,
    [REJECTION_REASONS.LOW_LIQUIDITY]: 0,
    [REJECTION_REASONS.MISSING_VOLUME]: 0,
    [REJECTION_REASONS.LOW_VOLUME]: 0,
    [REJECTION_REASONS.STALE_DATA]: 0,
    [REJECTION_REASONS.INVALID_MARKET_DATA]: 0,
    [REJECTION_REASONS.OTHER]: 0,
  };

  const diagnosticsStats = {
    discovered: uniqueTokens.length,
    passedChain: 0,
    passedAssetFilter: 0,
    passedPrice: 0,
    passedLiquidity: 0,
    passedVolume: 0,
    passedFreshness: 0,
    excludedNativeSol: 0,
    excludedWsol: 0,
    excludedStablecoins: 0,
    excludedQuoteAssets: 0,
    missingTokenAddress: 0,
    invalidTokenAddress: 0,
  };

  const observedVolumes = [];

  for (const token of uniqueTokens) {
    const reasons = [];

    if (token.volume24hUsd !== null && token.volume24hUsd !== undefined && !isNaN(token.volume24hUsd)) {
      observedVolumes.push(token.volume24hUsd);
    }

    // 1. Chain Check
    if (token.chain !== "solana") {
      reasons.push(REJECTION_REASONS.WRONG_CHAIN);
    } else {
      diagnosticsStats.passedChain++;
    }

    // 2. Hard Asset Filter (Address Identity Check)
    const addr = token.tokenAddress ? String(token.tokenAddress).trim() : null;
    const sym = token.symbol ? String(token.symbol).trim().toUpperCase() : "";

    if (!addr) {
      reasons.push(REJECTION_REASONS.MISSING_TOKEN_ADDRESS);
      diagnosticsStats.missingTokenAddress++;
    } else if (addr.length < 32) {
      reasons.push(REJECTION_REASONS.INVALID_TOKEN_ADDRESS);
      diagnosticsStats.invalidTokenAddress++;
    } else if (addr === HUNTER_CONFIG.NATIVE_SOL_ADDRESS && sym === "SOL") {
      reasons.push(REJECTION_REASONS.NATIVE_SOL);
      diagnosticsStats.excludedNativeSol++;
    } else if (addr === HUNTER_CONFIG.WRAPPED_SOL_ADDRESS && (sym === "WSOL" || sym === "SOL")) {
      reasons.push(REJECTION_REASONS.WRAPPED_SOL);
      diagnosticsStats.excludedWsol++;
    } else if (HUNTER_CONFIG.STABLECOIN_ADDRESSES.has(addr)) {
      reasons.push(REJECTION_REASONS.EXCLUDED_STABLECOIN);
      diagnosticsStats.excludedStablecoins++;
    } else if (HUNTER_CONFIG.EXCLUDED_INFRASTRUCTURE_ADDRESSES.has(addr)) {
      reasons.push(REJECTION_REASONS.EXCLUDED_QUOTE_ASSET);
      diagnosticsStats.excludedQuoteAssets++;
    } else if (HUNTER_CONFIG.EXCLUDED_SYMBOLS.has(sym) && (sym === "SOL" || sym === "WSOL")) {
      reasons.push(REJECTION_REASONS.NATIVE_SOL);
      diagnosticsStats.excludedNativeSol++;
    } else {
      diagnosticsStats.passedAssetFilter++;
    }

    // 3. Price Validation
    if (token.price === null || token.price === undefined) {
      reasons.push(REJECTION_REASONS.MISSING_PRICE);
    } else if (token.price <= 0 || isNaN(token.price)) {
      reasons.push(REJECTION_REASONS.INVALID_PRICE);
    } else {
      diagnosticsStats.passedPrice++;
    }

    // 4. Liquidity Check
    if (token.liquidityUsd === null || token.liquidityUsd === undefined) {
      reasons.push(REJECTION_REASONS.MISSING_LIQUIDITY);
    } else if (token.liquidityUsd < HUNTER_CONFIG.MIN_LIQUIDITY_USD) {
      reasons.push(REJECTION_REASONS.LOW_LIQUIDITY);
    } else {
      diagnosticsStats.passedLiquidity++;
    }

    // 5. Volume Check (Real 24h Volume USD)
    if (token.volume24hUsd === null || token.volume24hUsd === undefined) {
      reasons.push(REJECTION_REASONS.MISSING_VOLUME);
    } else if (token.volume24hUsd < HUNTER_CONFIG.MIN_VOLUME_24H_USD) {
      reasons.push(REJECTION_REASONS.LOW_VOLUME);
    } else {
      diagnosticsStats.passedVolume++;
    }

    // 6. Freshness Check
    if (token.timestamp) {
      const tokenAgeSec = (Date.now() - new Date(token.timestamp).getTime()) / 1000;
      if (tokenAgeSec > HUNTER_CONFIG.MAX_DATA_AGE_SECONDS) {
        reasons.push(REJECTION_REASONS.STALE_DATA);
      } else {
        diagnosticsStats.passedFreshness++;
      }
    } else {
      diagnosticsStats.passedFreshness++;
    }

    if (reasons.length === 0) {
      passedCandidates.push({
        ...token,
        status: "CANDIDATE",
      });
    } else {
      const primaryReason = reasons[0];
      if (rejectionBreakdown[primaryReason] !== undefined) {
        rejectionBreakdown[primaryReason]++;
      } else {
        rejectionBreakdown[REJECTION_REASONS.OTHER]++;
      }

      filteredOut.push({
        ...token,
        status: "FILTERED",
        primaryReason,
        reasons,
      });
    }
  }

  // Volume Aggregates Calculation
  let observedMinVolume = null;
  let observedMaxVolume = null;
  let observedMedianVolume = null;
  let observedAverageVolume = null;

  if (observedVolumes.length > 0) {
    observedVolumes.sort((a, b) => a - b);
    observedMinVolume = observedVolumes[0];
    observedMaxVolume = observedVolumes[observedVolumes.length - 1];

    const sum = observedVolumes.reduce((acc, val) => acc + val, 0);
    observedAverageVolume = sum / observedVolumes.length;

    const mid = Math.floor(observedVolumes.length / 2);
    if (observedVolumes.length % 2 === 0) {
      observedMedianVolume = (observedVolumes[mid - 1] + observedVolumes[mid]) / 2;
    } else {
      observedMedianVolume = observedVolumes[mid];
    }
  }

  // Diagnostic Note
  let dynamicDiagnosticMessage = "";
  const lowVolCount = rejectionBreakdown[REJECTION_REASONS.LOW_VOLUME] || 0;
  const hardExcludedCount =
    diagnosticsStats.excludedNativeSol +
    diagnosticsStats.excludedWsol +
    diagnosticsStats.excludedStablecoins +
    diagnosticsStats.excludedQuoteAssets;

  if (passedCandidates.length === 0) {
    dynamicDiagnosticMessage = `0 candidates valid. ${lowVolCount} failed volume threshold ($${HUNTER_CONFIG.MIN_VOLUME_24H_USD.toLocaleString()}), ${hardExcludedCount} hard-excluded (SOL/WSOL/Stables/QuoteAssets).`;
  } else {
    dynamicDiagnosticMessage = `${passedCandidates.length} valid token candidates found.`;
  }

  return {
    candidates: passedCandidates,
    filtered: filteredOut,
    rejectionBreakdown,
    diagnosticsStats,
    volumeStats: {
      observedMinVolume,
      observedMaxVolume,
      observedMedianVolume,
      observedAverageVolume,
      sampleSize: observedVolumes.length,
    },
    diagnosticSummaryMessage: dynamicDiagnosticMessage,
  };
}
