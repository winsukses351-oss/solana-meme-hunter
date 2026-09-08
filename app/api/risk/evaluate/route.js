import { NextResponse } from 'next/server';
import { evaluateSafetyGate } from '@/lib/risk/safety-gate';
import { evaluatePositionRisk } from '@/lib/risk/engine';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { systemState = {}, candidateData = {}, accountData = {} } = body;

    // 1. Evaluate Hard Safety Gate
    const safetyGateResult = evaluateSafetyGate(systemState, candidateData);

    // 2. Evaluate Deterministic Risk Engine
    const riskEngineResult = evaluatePositionRisk({
      accountEquity: accountData.accountEquity,
      currentExposure: accountData.currentExposure,
      dailyPnL: accountData.dailyPnL,
      peakEquity: accountData.peakEquity,
      candidateScore: candidateData.score,
      candidateLiquidity: candidateData.liquidity,
      stopLossPct: candidateData.stopLossPct,
      safetyGatePassed: safetyGateResult.passed
    });

    // 3. System Execution Override Status
    const overallDecision = safetyGateResult.passed && riskEngineResult.status === 'CALCULATED'
      ? 'BLOCK_TRADING_ONLY (SAFETY GATE PASSED)'
      : 'BLOCK';

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      executionStatus: 'BLOCKED',
      decision: overallDecision,
      safetyGate: safetyGateResult,
      riskAssessment: riskEngineResult
    });
  } catch (error) {
    // Fail-Closed on Error
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        executionStatus: 'BLOCKED',
        decision: 'BLOCK',
        error: 'INTERNAL_EVALUATION_ERROR',
        details: error.message,
        safetyGate: { passed: false, violations: ['INTERNAL_ERROR'] }
      },
      { status: 500 }
    );
  }
}
