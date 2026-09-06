import { NextResponse } from "next/server";
import { checkDatabaseStatus } from "@/lib/db";
import { checkSolanaRpcHealth } from "@/lib/solana";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [dbStatus, rpcHealth] = await Promise.all([
      checkDatabaseStatus(),
      checkSolanaRpcHealth(),
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
      timestamp: new Date().toISOString(),
      trading_status: "BLOCKED",
      phase: "PHASE 3 — SOLANA MAINNET RPC INTEGRATION",
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        backend: "connected",
        database: "error",
        solana_rpc: {
          status: "ERROR",
          connected: false,
        },
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
