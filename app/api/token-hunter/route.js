import { NextResponse } from "next/server";
import { runTokenHunterPipeline } from "@/lib/token-hunter/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const hunterData = await runTokenHunterPipeline();
    return NextResponse.json(hunterData, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: "ERROR",
        scanned: 0,
        uniqueTokens: 0,
        filteredCount: 0,
        candidateCount: 0,
        candidates: [],
        filtered: [],
        rejectionBreakdown: {},
        diagnosticsStats: {},
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
