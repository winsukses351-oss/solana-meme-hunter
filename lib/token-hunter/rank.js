/**
 * Token Candidate Ranking Module
 */

export function rankCandidates(candidates = []) {
  return candidates
    .map((candidate) => {
      const liq = candidate.liquidityUsd || 0;
      const vol = candidate.volume24hUsd || 0;

      // Deterministic discovery score calculation
      const liqScore = Math.min(50, (liq / 50000) * 50);
      const volScore = Math.min(50, (vol / 100000) * 50);
      const discoveryScore = Math.round(liqScore + volScore);

      return {
        ...candidate,
        discoveryScore,
      };
    })
    .sort((a, b) => b.discoveryScore - a.discoveryScore);
}
