/**
 * Token Hunter Filtering, Volume Statistics & Rejection Diagnostics
 */

import { HUNTER_CONFIG, REJECTION_REASONS } from "./config";

export function filterCandidateTokens(uniqueTokens = []) {
  const passedCandidates = [];
  const filteredOut = [];

  const rejectionBreakdown = {
    [REJECTION_REASONS.INVALID_TOKEN_ADDRESS]: 0,
    [REJECTION_REASONS.WRONG_CHAIN]: 0,
    [REJECTION_REASONS.NATIVE_SOL]: 0,
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
    excludedStablecoins: 0,
    excludedQuoteAssets: 0,
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

    // 2. Identity Check
    if (!token.tokenAddress || token.tokenAddress.trim() === "") {
      reasons.push(REJECTION_REASONS.INVALID_TOKEN_ADDRESS);
    } else if (token.tokenAddress === HUNTER_CONFIG.NATIVE_SOL_ADDRESS) {
      reasons.push(REJECTION_REASONS.NATIVE_SOL);
      diagnosticsStats.excludedNativeSol++;
    } else if (HUNTER_CONFIG.STABLECOIN_ADDRESSES.has(token.tokenAddress)) {
      reasons.push(REJECTION_REASONS.EXCLUDED_STABLECOIN);
      diagnosticsStats.excludedStablecoins++;
    } else if (HUNTER_CONFIG.EXCLUDED_INFRASTRUCTURE_ADDRESSES.has(token.tokenAddress)) {
      reasons.push(REJECTION_REASONS.EXCLUDED_QUOTE_ASSET);
      diagnosticsStats.excludedQuoteAssets++;
    } else if (HUNTER_CONFIG.EXCLUDED_SYMBOLS.has(token.symbol) && !token.tokenAddress) {
      reasons.push(REJECTION_REASONS.EXCLUDED_ASSET);
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

    // 5. Volume Check (Real 24h USD comparison)
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

  // Statistical Calculation for Real Observed Volume 24h
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

  // Accurate diagnostic summary message
  let dynamicDiagnosticMessage = "";
  const lowVolCount = rejectionBreakdown[REJECTION_REASONS.LOW_VOLUME] || 0;
  const lowLiqCount = rejectionBreakdown[REJECTION_REASONS.LOW_LIQUIDITY] || 0;
  const totalFiltered = filteredOut.length;

  if (totalFiltered > 0 && lowVolCount === totalFiltered) {
    dynamicDiagnosticMessage = `${lowVolCount} tokens failed the minimum 24h volume requirement ($${HUNTER_CONFIG.MIN_VOLUME_24H_USD.toLocaleString()}).`;
  } else if (lowVolCount > 0 || lowLiqCount > 0) {
    dynamicDiagnosticMessage = `${lowVolCount} tokens failed 24h volume threshold, ${lowLiqCount} tokens failed liquidity threshold.`;
  } else if (totalFiltered > 0) {
    dynamicDiagnosticMessage = `${totalFiltered} tokens filtered by asset exclusions or missing market metrics.`;
  } else {
    dynamicDiagnosticMessage = "All discovered tokens passed candidate criteria.";
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
