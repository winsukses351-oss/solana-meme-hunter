import { RISK_CONFIG } from './config.js';

/**
 * Deterministic Risk Engine
 * Calculates position risk sizing and checks drawdown/exposure boundaries.
 */
export function evaluatePositionRisk(input = {}) {
  const {
    accountEquity = RISK_CONFIG.DEFAULT_ACCOUNT_EQUITY_USD,
    currentExposure = 0,
    dailyPnL = 0,
    peakEquity = accountEquity,
    candidateScore = null,
    candidateLiquidity = 0,
    stopLossPct = RISK_CONFIG.DEFAULT_STOP_LOSS_PCT,
    safetyGatePassed = false
  } = input;

  // 1. Calculate Account Metrics
  const effectiveEquity = Math.max(0, Number(accountEquity) || 0);
  const currentDailyLossPct = effectiveEquity > 0 && dailyPnL < 0 
    ? Math.abs(dailyPnL) / effectiveEquity * 100 
    : 0;

  const currentDrawdownPct = peakEquity > 0 && effectiveEquity < peakEquity 
    ? ((peakEquity - effectiveEquity) / peakEquity) * 100 
    : 0;

  const currentExposurePct = effectiveEquity > 0 
    ? (Number(currentExposure) / effectiveEquity) * 100 
    : 0;

  // 2. Risk Limit Validations
  const isDailyLossExceeded = currentDailyLossPct > RISK_CONFIG.MAX_DAILY_LOSS_PCT;
  const isDrawdownExceeded = currentDrawdownPct > RISK_CONFIG.MAX_DRAWDOWN_PCT;
  const isExposureExceeded = currentExposurePct >= RISK_CONFIG.MAX_TOTAL_EXPOSURE_PCT;
  const isLiquidityInsufficient = candidateLiquidity < RISK_CONFIG.MIN_LIQUIDITY_USD;
  const isScoreInsufficient = candidateScore !== null && candidateScore < RISK_CONFIG.MIN_PHASE6_SCORE;

  // 3. Position Sizing Calculation (Deterministic)
  let maxRiskAmountUsd = 0;
  let calculatedPositionSizeUsd = 0;
  let calculationStatus = 'BLOCKED';

  const isEligibleForSizing = 
    safetyGatePassed && 
    !isDailyLossExceeded && 
    !isDrawdownExceeded && 
    !isExposureExceeded && 
    !isLiquidityInsufficient && 
    !isScoreInsufficient &&
    effectiveEquity > 0;

  if (isEligibleForSizing) {
    maxRiskAmountUsd = (effectiveEquity * RISK_CONFIG.MAX_POSITION_RISK_PCT) / 100;
    const effectiveStopPct = Math.max(stopLossPct, 0.5); // Floor at 0.5% distance
    calculatedPositionSizeUsd = maxRiskAmountUsd / (effectiveStopPct / 100);
    
    // Cap position size to remaining allowed exposure
    const maxAllowedExposureUsd = (effectiveEquity * RISK_CONFIG.MAX_TOTAL_EXPOSURE_PCT) / 100;
    const remainingExposureCapacity = Math.max(0, maxAllowedExposureUsd - currentExposure);
    calculatedPositionSizeUsd = Math.min(calculatedPositionSizeUsd, remainingExposureCapacity);
    
    // Round deterministically
    calculatedPositionSizeUsd = Math.floor(calculatedPositionSizeUsd * 100) / 100;
    maxRiskAmountUsd = Math.floor(maxRiskAmountUsd * 100) / 100;
    
    calculationStatus = calculatedPositionSizeUsd > 0 ? 'CALCULATED' : 'BLOCKED';
  }

  return {
    status: calculationStatus,
    accountMetrics: {
      effectiveEquity,
      currentExposurePct: Number(currentExposurePct.toFixed(2)),
      currentDailyLossPct: Number(currentDailyLossPct.toFixed(2)),
      currentDrawdownPct: Number(currentDrawdownPct.toFixed(2))
    },
    riskLimits: {
      dailyLossExceeded: isDailyLossExceeded,
      drawdownExceeded: isDrawdownExceeded,
      exposureExceeded: isExposureExceeded,
      liquidityInsufficient: isLiquidityInsufficient,
      scoreInsufficient: isScoreInsufficient
    },
    sizing: {
      maxRiskAmountUsd,
      calculatedPositionSizeUsd,
      maxPositionRiskPct: RISK_CONFIG.MAX_POSITION_RISK_PCT,
      stopLossPctUsed: stopLossPct
    }
  };
}
