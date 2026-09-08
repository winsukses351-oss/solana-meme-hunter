/**
 * Solana AI Trader Dashboard — Server Data Container
 */

import { checkDatabaseHealth } from "@/lib/db";
import { checkSolanaRpcHealth } from "@/lib/solana/rpc";
import { getMarketDataHealth } from "@/lib/market-data/service";
import { runTokenHunterPipeline } from "@/lib/token-hunter/service";
import { scoreCandidateToken } from "@/lib/scoring/engine";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [dbHealth, rpcHealth, marketHealth, hunterData] = await Promise.all([
    checkDatabaseHealth().catch(() => ({ status: "NOT CONFIGURED" })),
    checkSolanaRpcHealth().catch(() => ({ status: "ERROR" })),
    getMarketDataHealth().catch(() => ({ status: "ERROR", dexscreenerStatus: "ERROR" })),
    runTokenHunterPipeline().catch((err) => ({
      status: "ERROR",
      candidateCount: 0,
      candidates: [],
      filtered: [],
      diagnosticSummaryMessage: err.message || "Pipeline Error",
      diagnosticsStats: {},
    })),
  ]);

  const rawCandidates = hunterData?.candidates || [];
  const scoredCandidates = rawCandidates.map((item) => scoreCandidateToken(item));
  const sampleRejections = (hunterData?.filtered || []).slice(0, 5);
  const diag = hunterData?.diagnosticsStats || {};

  return (
    <DashboardClient
      dbHealth={dbHealth}
      rpcHealth={rpcHealth}
      marketHealth={marketHealth}
      hunterData={hunterData}
      scoredCandidates={scoredCandidates}
      sampleRejections={sampleRejections}
      diag={diag}
    />
  );
}
