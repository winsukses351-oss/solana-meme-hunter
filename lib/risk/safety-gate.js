import { RISK_CONFIG } from './config.js';

/**
 * Hard Safety Gate - Fail-Closed Evaluation
 * Enforces mandatory system, market, and safety checks before any evaluation.
 */
export function evaluateSafetyGate(systemState = {}, candidateData = {}) {
  const violations = [];

  // 1. Emergency Controls & Kill Switches
  if (systemState.killSwitch === true) {
    violations.push('KILL_SWITCH_ACTIVE');
  }
  if (systemState.emergencyStop === true) {
    violations.push('EMERGENCY_STOP_ACTIVE');
  }

  // 2. System & API Connectivity Health
  if (systemState.rpcConnected === false) {
    violations.push('RPC_DISCONNECTED');
  }
  if (systemState.apiConnected === false) {
    violations.push('API_DISCONNECTED');
  }
  if (systemState.systemHealthy === false) {
    violations.push('SYSTEM_UNHEALTHY');
  }

  // 3. Data Freshness & Staleness Check
  const now = Date.now();
  const dataTimestamp = candidateData.timestamp || systemState.dataTimestamp;
  if (!dataTimestamp) {
    violations.push('MISSING_DATA_TIMESTAMP');
  } else {
    const dataAgeSec = (now - Number(dataTimestamp)) / 1000;
    if (isNaN(dataAgeSec) || dataAgeSec > RISK_CONFIG.MAX_STALE_DATA_AGE_SEC) {
      violations.push('STALE_DATA_AGE_EXCEEDED');
    }
  }

  // 4. Candidate & Market Validation
  if (candidateData.address === null || candidateData.address === undefined) {
    violations.push('INVALID_CANDIDATE_ADDRESS');
  }
  if (candidateData.liquidity !== undefined && candidateData.liquidity < RISK_CONFIG.MIN_LIQUIDITY_USD) {
    violations.push('LIQUIDITY_BELOW_MINIMUM');
  }
  if (candidateData.score !== undefined && candidateData.score !== null && candidateData.score < RISK_CONFIG.MIN_PHASE6_SCORE) {
    violations.push('SCORE_BELOW_THRESHOLD');
  }

  // Fail-Closed Logic: Any violation results in BLOCK
  const passed = violations.length === 0;

  return {
    passed,
    decision: passed ? 'ALLOW_EVALUATION' : 'BLOCK',
    violations,
    executionBlocked: true // ALWAYS HARD-BLOCKED REGARDLESS OF SAFETY GATE
  };
}
