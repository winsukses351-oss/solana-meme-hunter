/**
 * Token Address Deduplication Engine
 * Collapses multiple market pairs into unique tokens using chain + tokenAddress.
 */

export function deduplicateTokens(normalizedTokens = []) {
  const tokenMap = new Map();

  for (const token of normalizedTokens) {
    if (!token || !token.tokenAddress) continue;

    const key = `solana:${token.tokenAddress.toLowerCase()}`;

    if (!tokenMap.has(key)) {
      tokenMap.set(key, token);
    } else {
      // If the token already exists, pick the pair with highest liquidity
      const existing = tokenMap.get(key);
      if (token.liquidityUsd > existing.liquidityUsd) {
        tokenMap.set(key, token);
      }
    }
  }

  return Array.from(tokenMap.values());
}
