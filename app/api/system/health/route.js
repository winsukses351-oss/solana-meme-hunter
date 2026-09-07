import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/db";
import { checkSolanaRpcHealth } from "@/lib/solana/rpc";
import { getMarketDataHealth } from "@/lib/market-data/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dbHealth = await checkDatabaseHealth();
    const rpcHealth = await checkSolanaRpcHealth();
    const marketHealth = await getMarketDataHealth();

    return NextResponse.json(
      {
        status: "CONNECTED",
        backend: "CONNECTED",
        database: dbHealth.status,
        solanaRpc: rpcHealth.status,
        marketData: marketHealth.status,
        activeProvider: marketHealth.activeProvider,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "ERROR",
        backend: "ERROR",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
