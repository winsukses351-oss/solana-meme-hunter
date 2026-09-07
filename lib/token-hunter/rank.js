/**
 * Token Hunter Deterministic Ranking Engine
 * Calculates a transparent "Discovery Score" based on market data metrics.
 * NOT a buy score or profitability signal.
 */

export function rankCandidates(candidates = []) {
  return candidates
    .map((token) => {
      // 1. Volume to Liquidity Ratio Score (Weight 40%)
      // Higher ratio indicates active trading momentum relative to pool depth
      const volLiqRatio =
        token.liquidityUsd > 0 ? token.volume24hUsd / token.liquidityUsd : 0;
      const volLiqScore = Math.min(volLiqRatio * 20, 40);

      // 2. Liquidity Depth Score (Weight 30%)
      // Logarithmic scale for liquidity up to $100k
      const liqScore = Math.min((Math.log10(Math.max(token.liquidityUsd, 1)) / 5) * 30, 30);

      // 3. Price Momentum Score (Weight 30%)
      // Absolute 24h percent change momentum
      const absChange = Math.abs(token.priceChange24h);
      const momentumScore = Math.min((absChange / 50) * 30, 30);

      // Calculate final Discovery Score (Max 100)
      const rawScore = volLiqScore + liqScore + momentumScore;
      const discoveryScore = Math.round(Math.min(Math.max(rawScore, 1), 99) * 10) / 10;

      return {
        ...token,
        discoveryScore,
      };
    })
    .sort((a, b) => b.discoveryScore - a.discoveryScore);
}
