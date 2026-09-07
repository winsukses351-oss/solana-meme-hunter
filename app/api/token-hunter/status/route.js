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
        birdeyeStatus: hunterData.birdeyeStatus,
        pairsDiscovered: hunterData.pairsDiscovered,
        solanaPairs: hunterData.solanaPairs,
        uniqueTokens: hunterData.uniqueTokens,
        excludedNativeSol: hunterData.diagnosticsStats?.excludedNativeSol ?? 0,
        excludedStablecoins: hunterData.diagnosticsStats?.excludedStablecoins ?? 0,
        excludedQuoteAssets: hunterData.diagnosticsStats?.excludedQuoteAssets ?? 0,
        filtered: hunterData.filteredCount,
        candidates: hunterData.candidateCount,
        diagnostics: hunterData.rejectionBreakdown || {},
        currentThresholds: hunterData.currentThresholds || {},
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
