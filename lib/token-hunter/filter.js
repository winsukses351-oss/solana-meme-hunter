/**
 * Basic Candidate Filtering Layer
 * Filters out Native SOL, major stablecoins, low-liquidity, and invalid tokens.
 */

import { HUNTER_CONFIG } from "./config";

export function filterCandidateTokens(uniqueTokens = []) {
  const passedCandidates = [];
  const filteredOut = [];

  for (const token of uniqueTokens) {
    const reasons = [];

    // 1. Must have valid tokenAddress
    if (!token.tokenAddress || token.tokenAddress.trim() === "") {
      reasons.push("MISSING_TOKEN_ADDRESS");
    } else {
      // 2. Exclude Native SOL & Major Infrastructure assets by Address
      if (HUNTER_CONFIG.EXCLUDED_TOKEN_ADDRESSES.has(token.tokenAddress)) {
        reasons.push("EXCLUDED_NATIVE_OR_STABLECOIN_ADDRESS");
      }
    }

    // 3. Exclude Native SOL & Major Infrastructure assets by Symbol
    if (HUNTER_CONFIG.EXCLUDED_SYMBOLS.has(token.symbol)) {
      reasons.push("EXCLUDED_NATIVE_OR_STABLECOIN_SYMBOL");
    }

    // 4. Must have valid price
    if (!token.price || token.price <= 0) {
      reasons.push("INVALID_PRICE");
    }

    // 5. Minimum Liquidity Check
    if (token.liquidityUsd < HUNTER_CONFIG.MIN_LIQUIDITY_USD) {
      reasons.push(`INSUFFICIENT_LIQUIDITY (<$${HUNTER_CONFIG.MIN_LIQUIDITY_USD})`);
    }

    // 6. Minimum Volume Check
    if (token.volume24hUsd < HUNTER_CONFIG.MIN_VOLUME_24H_USD) {
      reasons.push(`INSUFFICIENT_VOLUME (<$${HUNTER_CONFIG.MIN_VOLUME_24H_USD})`);
    }

    if (reasons.length === 0) {
      passedCandidates.push({
        ...token,
        status: "CANDIDATE",
      });
    } else {
      filteredOut.push({
        ...token,
        status: "FILTERED",
        filterReasons: reasons,
      });
    }
  }

  return {
    candidates: passedCandidates,
    filtered: filteredOut,
  };
}
