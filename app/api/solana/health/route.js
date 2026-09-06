import { NextResponse } from "next/server";
import { checkSolanaRpcHealth } from "@/lib/solana";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rpcHealth = await checkSolanaRpcHealth();

    let statusCode = 200;
    if (rpcHealth.status === "ERROR") {
      statusCode = 500;
    }

    return NextResponse.json(rpcHealth, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        connected: false,
        status: "ERROR",
        network: null,
        slot: null,
        blockHeight: null,
        latencyMs: null,
        error: error.message,
        checkedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
