/**
 * Conservative Risk & Safety Configuration
 * Phase 7A Implementation
 */

export const RISK_CONFIG = {
  // Exposure & Sizing Limits
  MAX_POSITION_RISK_PCT: 2.0,      // Max 2.0% equity risk per position
  MAX_TOTAL_EXPOSURE_PCT: 20.0,    // Max 20.0% total portfolio exposure
  
  // Loss & Drawdown Limits
  MAX_DAILY_LOSS_PCT: 5.0,         // Max 5.0% daily loss limit
  MAX_DRAWDOWN_PCT: 15.0,          // Max 15.0% maximum drawdown limit
  
  // Market & Candidate Filters
  MIN_LIQUIDITY_USD: 10000,        // Minimum required pool liquidity
  MIN_PHASE6_SCORE: 55,            // Minimum required Phase 6 score
  MAX_STALE_DATA_AGE_SEC: 60,      // Data staleness threshold (60 seconds)

  // System Fallbacks
  DEFAULT_ACCOUNT_EQUITY_USD: 10000,
  DEFAULT_STOP_LOSS_PCT: 5.0       // Standard fallback stop-loss distance
};
