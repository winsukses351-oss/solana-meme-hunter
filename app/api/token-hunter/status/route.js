import { NextResponse } from "next/server";
import { runTokenHunterPipeline } from "@/lib/token-hunter/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const hunterData = await runTokenHunterPipeline();

    return NextResponse.json(
      {
        status: hunterData.status,
        chain: "solana",
        activeProvider: hunterData.activeProvider,
        scanned: hunterData.scanned,
        uniqueTokens: hunterData.uniqueTokens,
        filtered: hunterData.filteredCount,
        candidates: hunterData.candidateCount,
        scanDurationMs: hunterData.scanDurationMs,
        checkedAt: hunterData.timestamp,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "ERROR",
        chain: "solana",
        error: error.message,
        checkedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
