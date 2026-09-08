import { NextResponse } from "next/server";
import { runTokenHunterPipeline } from "@/lib/token-hunter/service";
import { scoreCandidateToken } from "@/lib/scoring/engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Fetch real candidates from Token Hunter pipeline
    const hunterResult = await runTokenHunterPipeline();
    const rawCandidates = hunterResult?.candidates || [];

    // 2. Score candidates deterministically
    const scoredCandidates = rawCandidates.map((candidate) => scoreCandidateToken(candidate));

    return NextResponse.json({
      status: "SUCCESS",
      timestamp: new Date().toISOString(),
      candidateCount: scoredCandidates.length,
      candidates: scoredCandidates,
      tradingStatus: "BLOCKED",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "ERROR",
        message: error.message || "Failed to score candidates",
        candidates: [],
        tradingStatus: "BLOCKED",
      },
      { status: 500 }
    );
  }
}
