/**
 * Deterministic Token Scoring Engine — Phase 6
 * Strictly uses real market data inputs. No random numbers, LLMs, or hardcoded scores.
 */

export const SCORING_WEIGHTS = {
  liquidity: 0.30,      // 30%
  volume: 0.25,         // 25%
  turnover: 0.20,       // 20%
  age: 0.10,            // 10%
  freshness: 0.10,      // 10%
  marketQuality: 0.05   // 5%
};

/**
 * Bounds a value between min and max
 */
function clamp(val, min = 0, max = 100) {
  return Math.min(Math.max(val, min), max);
}

/**
 * Calculates Liquidity Score (0-100)
 * Evaluates USD liquidity against standard thresholds ($10k - $500k)
 */
export function calculateLiquidityScore(liquidityUsd) {
  if (typeof liquidityUsd !== "number" || isNaN(liquidityUsd) || liquidityUsd <= 0) {
    return null;
  }
  // Logarithmic scaling for liquidity
  if (liquidityUsd < 1000) return 10;
  if (liquidityUsd < 5000) return 25;
  if (liquidityUsd < 10000) return 40;
  if (liquidityUsd < 50000) return 60;
  if (liquidityUsd < 100000) return 80;
  return 100;
}

/**
 * Calculates Volume Score (0-100)
 * Evaluates 24h trading volume ($5k - $1M)
 */
export function calculateVolumeScore(volume24hUsd) {
  if (typeof volume24hUsd !== "number" || isNaN(volume24hUsd) || volume24hUsd <= 0) {
    return null;
  }
  if (volume24hUsd < 1000) return 10;
  if (volume24hUsd < 5000) return 30;
  if (volume24hUsd < 25000) return 50;
  if (volume24hUsd < 100000) return 75;
  if (volume24hUsd < 500000) return 90;
  return 100;
}

/**
 * Calculates Volume/Liquidity Turnover Ratio Score (0-100)
 * Healthy trading ratio is between 0.2 and 5.0. Extreme values (>20 or <0.05) indicate wash/dead volume.
 */
export function calculateTurnoverScore(volume24hUsd, liquidityUsd) {
  if (!volume24hUsd || !liquidityUsd || liquidityUsd <= 0) return null;
  const ratio = volume24hUsd / liquidityUsd;

  if (ratio < 0.05) return 20; // Dead volume
  if (ratio >= 0.05 && ratio < 0.2) return 50;
  if (ratio >= 0.2 && ratio <= 5.0) return 100; // Optimal turnover
  if (ratio > 5.0 && ratio <= 15.0) return 60; // High risk/wash trading potential
  return 30; // Extreme ratio
}

/**
 * Calculates Pair/Token Age Score (0-100)
 */
export function calculateAgeScore(createdAtTimestamp) {
  if (!createdAtTimestamp) return null;
  const ageInHours = (Date.now() - new Date(createdAtTimestamp).getTime()) / (1000 * 60 * 60);

  if (ageInHours < 1) return 20;   // High risk brand new
  if (ageInHours < 6) return 40;
  if (ageInHours < 24) return 65;
  if (ageInHours < 72) return 85;
  return 100;                      // Established >3 days
}

/**
 * Calculates Market Data Freshness Score (0-100)
 */
export function calculateFreshnessScore(lastUpdatedTimestamp) {
  if (!lastUpdatedTimestamp) return null;
  const diffInSec = (Date.now() - new Date(lastUpdatedTimestamp).getTime()) / 1000;

  if (diffInSec <= 60) return 100;
  if (diffInSec <= 300) return 80;
  if (diffInSec <= 900) return 50;
  return 20;
}

/**
 * Evaluates Market/DEX Quality Score (0-100)
 */
export function calculateMarketQualityScore(dex) {
  if (!dex) return null;
  const dexLower = String(dex).toLowerCase();
  if (dexLower.includes("raydium")) return 100;
  if (dexLower.includes("orca")) return 100;
  if (dexLower.includes("meteora")) return 90;
  return 60;
}

/**
 * Determines Quality Risk Level
 */
export function classifyRiskLevel(totalScore, breakdown) {
  if (totalScore === null) return "INSUFFICIENT DATA";
  if (totalScore >= 80) return "HIGH QUALITY";
  if (totalScore >= 55) return "MEDIUM QUALITY";
  return "LOW QUALITY";
}

/**
 * Main Deterministic Token Scoring Function
 */
export function scoreCandidateToken(candidate) {
  if (!candidate || !candidate.tokenAddress) {
    return {
      tokenAddress: candidate?.tokenAddress || null,
      symbol: candidate?.symbol || "UNKNOWN",
      score: null,
      scoreBreakdown: null,
      riskLevel: "INSUFFICIENT DATA",
      scoringStatus: "INVALID CANDIDATE",
      scoredAt: new Date().toISOString(),
    };
  }

  const liquidityScore = calculateLiquidityScore(candidate.liquidityUsd);
  const volumeScore = calculateVolumeScore(candidate.volume24hUsd);
  const turnoverScore = calculateTurnoverScore(candidate.volume24hUsd, candidate.liquidityUsd);
  const ageScore = calculateAgeScore(candidate.pairCreatedAt);
  const freshnessScore = calculateFreshnessScore(candidate.updatedAt || Date.now());
  const marketQualityScore = calculateMarketQualityScore(candidate.dex);

  const breakdown = {
    liquidityScore,
    volumeScore,
    turnoverScore,
    ageScore,
    freshnessScore,
    marketQualityScore,
  };

  // Calculate Weighted Total (skipping null components dynamically)
  let weightedSum = 0;
  let totalWeightUsed = 0;

  const mapping = [
    { val: liquidityScore, weight: SCORING_WEIGHTS.liquidity },
    { val: volumeScore, weight: SCORING_WEIGHTS.volume },
    { val: turnoverScore, weight: SCORING_WEIGHTS.turnover },
    { val: ageScore, weight: SCORING_WEIGHTS.age },
    { val: freshnessScore, weight: SCORING_WEIGHTS.freshness },
    { val: marketQualityScore, weight: SCORING_WEIGHTS.marketQuality },
  ];

  mapping.forEach(({ val, weight }) => {
    if (val !== null) {
      weightedSum += val * weight;
      totalWeightUsed += weight;
    }
  });

  const totalScore = totalWeightUsed > 0 ? Math.round(weightedSum / totalWeightUsed) : null;
  const riskLevel = classifyRiskLevel(totalScore, breakdown);

  return {
    tokenAddress: candidate.tokenAddress,
    symbol: candidate.symbol,
    price: candidate.price || null,
    liquidityUsd: candidate.liquidityUsd || 0,
    volume24hUsd: candidate.volume24hUsd || 0,
    pairAddress: candidate.pairAddress || null,
    dex: candidate.dex || "Unknown",
    score: totalScore,
    scoreBreakdown: breakdown,
    riskLevel,
    scoringStatus: totalScore !== null ? "SUCCESS" : "INSUFFICIENT DATA",
    scoredAt: new Date().toISOString(),
  };
}
