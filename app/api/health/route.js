import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/db";

/**
 * GET /api/health
 *
 * Real health check — never fakes status.
 * - backend always "connected" if this route is reachable
 * - database is checked for real
 * - trading engine is always BLOCKED in Phase 2
 */
export async function GET() {
  try {
    const dbHealth = await checkDatabaseHealth();

    const response = {
      status: "ok",
      phase: "2",
      timestamp: new Date().toISOString(),
      backend: "connected",
      database: {
        status: dbHealth.status, // CONNECTED | NOT_CONFIGURED | ERROR
        message: dbHealth.message,
      },
      trading_engine: {
        status: "BLOCKED",
        reason:
          "Live trading is disabled in Phase 2. Trading engine not implemented yet.",
      },
      providers: {
        birdeye: "NOT_CONNECTED",
        dexscreener: "NOT_CONNECTED",
        jupiter: "NOT_CONNECTED",
        solana_rpc: "NOT_CONNECTED",
      },
      system_status: "BLOCKED",
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        phase: "2",
        timestamp: new Date().toISOString(),
        backend: "connected",
        database: {
          status: "ERROR",
          message: err.message || "Unexpected health check failure",
        },
        trading_engine: {
          status: "BLOCKED",
          reason: "Live trading is disabled in Phase 2",
        },
        providers: {
          birdeye: "NOT_CONNECTED",
          dexscreener: "NOT_CONNECTED",
          jupiter: "NOT_CONNECTED",
          solana_rpc: "NOT_CONNECTED",
        },
        system_status: "ERROR",
      },
      { status: 200 }
    );
  }
}
