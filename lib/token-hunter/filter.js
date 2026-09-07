/**
 * Diagnostic Candidate Filtering Layer
 * Evaluates tokens against threshold criteria and assigns precise rejection reasons.
 */

import { HUNTER_CONFIG, REJECTION_REASONS } from "./config";

export function filterCandidateTokens(uniqueTokens = []) {
  const passedCandidates = [];
  const filteredOut = [];

  const rejectionBreakdown = {
    [REJECTION_REASONS.INVALID_TOKEN_ADDRESS]: 0,
    [REJECTION_REASONS.WRONG_CHAIN]: 0,
    [REJECTION_REASONS.NATIVE_SOL]: 0,
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
  };

  for (const token of uniqueTokens) {
    const reasons = [];

    // 1. Chain Check
    if (token.chain !== "solana") {
      reasons.push(REJECTION_REASONS.WRONG_CHAIN);
    } else {
      diagnosticsStats.passedChain++;
    }

    // 2. Address & Asset Verification
    if (!token.tokenAddress || token.tokenAddress.trim() === "") {
      reasons.push(REJECTION_REASONS.INVALID_TOKEN_ADDRESS);
    } else if (
      token.tokenAddress === "So11111111111111111111111111111111111111112" ||
      token.symbol === "SOL" ||
      token.symbol === "WSOL"
    ) {
      reasons.push(REJECTION_REASONS.NATIVE_SOL);
    } else if (
      HUNTER_CONFIG.EXCLUDED_TOKEN_ADDRESSES.has(token.tokenAddress) ||
      HUNTER_CONFIG.EXCLUDED_SYMBOLS.has(token.symbol)
    ) {
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

    // 5. Volume Check
    if (token.volume24hUsd === null || token.volume24hUsd === undefined) {
      reasons.push(REJECTION_REASONS.MISSING_VOLUME);
    } else if (token.volume24hUsd < HUNTER_CONFIG.MIN_VOLUME_24H_USD) {
      reasons.push(REJECTION_REASONS.LOW_VOLUME);
    } else {
      diagnosticsStats.passedVolume++;
    }

    // 6. Data Freshness Check
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

    // Determine candidate eligibility
    if (reasons.length === 0) {
      passedCandidates.push({
        ...token,
        status: "CANDIDATE",
      });
    } else {
      // Record primary rejection reason for diagnostics breakdown
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

  return {
    candidates: passedCandidates,
    filtered: filteredOut,
    rejectionBreakdown,
    diagnosticsStats,
  };
}
