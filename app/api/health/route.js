import { NextResponse } from "next/server";
import { checkDatabaseStatus } from "@/lib/db";
import { checkSolanaRpcHealth } from "@/lib/solana";
import { getMarketDataHealth } from "@/lib/market-data/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [dbStatus, rpcHealth, marketDataHealth] = await Promise.all([
      checkDatabaseStatus(),
      checkSolanaRpcHealth(),
      getMarketDataHealth(),
    ]);

    const responsePayload = {
      status: "ok",
      backend: "connected",
      database: dbStatus.toLowerCase(),
      solana_rpc: {
        status: rpcHealth.status,
        connected: rpcHealth.connected,
        network: rpcHealth.network,
        slot: rpcHealth.slot,
        blockHeight: rpcHealth.blockHeight,
        latencyMs: rpcHealth.latencyMs,
      },
      market_data: {
        status: marketDataHealth.status,
        activeProvider: marketDataHealth.activeProvider,
        birdeyeStatus: marketDataHealth.birdeye.status,
        dexScreenerStatus: marketDataHealth.dexscreener.status,
      },
      timestamp: new Date().toISOString(),
      trading_status: "BLOCKED",
      phase: "PHASE 4 — REAL MARKET DATA INTEGRATION",
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        backend: "connected",
        database: "error",
        solana_rpc: { status: "ERROR", connected: false },
        market_data: { status: "ERROR" },
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
