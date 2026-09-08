/**
 * Token Hunter Deduplication Module
 * Deterministic Best Pair Selection Rule: Highest Liquidity USD
 */

export function deduplicateTokens(tokens = []) {
  const tokenMap = new Map();

  for (const token of tokens) {
    if (!token || !token.tokenAddress) continue;

    const key = `${token.chain}:${token.tokenAddress}`;

    if (!tokenMap.has(key)) {
      tokenMap.set(key, token);
    } else {
      const existing = tokenMap.get(key);
      const existingLiq = existing.liquidityUsd || 0;
      const currentLiq = token.liquidityUsd || 0;

      // Deterministic Multi-pair Rule: Keep pair with highest liquidity
      if (currentLiq > existingLiq) {
        tokenMap.set(key, token);
      }
    }
  }

  return Array.from(tokenMap.values());
}
