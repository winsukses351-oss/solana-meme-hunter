export function calculateOpportunityScore(metrics) {
  if (metrics.safetyScore < 60) {
    return {
      score: 0,
      category: "AVOID (High Rug Risk)",
      action: "REJECT"
    };
  }

  const weighted = 
    (metrics.safetyScore * 0.35) +
    (metrics.smartMoneyScore * 0.30) +
    (metrics.momentumScore * 0.20) +
    (metrics.whaleScore * 0.15);

  const score = Number(weighted.toFixed(1));

  let category = "Avoid";
  let action = "IGNORE";

  if (score >= 90) {
    category = "Elite";
    action = "AUTO_BUY";
  } else if (score >= 80) {
    category = "High Potential";
    action = "AUTO_BUY";
  } else if (score >= 70) {
    category = "Moderate";
    action = "WATCHLIST";
  }

  return { score, category, action };
}

export async function fetchLatestSolanaTokens() {
  try {
    const res = await fetch('https://api.dexscreener.com/token-profiles/latest/v1');
    const data = await res.json();
    const solanaTokens = data.filter(token => token.chainId === 'solana');
    return solanaTokens.slice(0, 10);
  } catch (error) {
    console.error("Error scanning tokens:", error);
    return [];
  }
}
