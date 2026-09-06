import { NextResponse } from "next/server";
import { Pool } from "pg";
import { checkSolanaHealth } from "../../../lib/solana";

// ---------- Database helpers (Phase 2) ----------
let pool = null;

function getPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString || connectionString.trim() === "") {
    return null;
  }

  try {
    pool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : undefined,
    });

    pool.on("error", (err) => {
      console.error("[db] Unexpected pool error:", err.message);
    });

    return pool;
  } catch (err) {
    console.error("[db] Failed to create pool:", err.message);
    return null;
  }
}

async function checkDatabaseHealth() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString || connectionString.trim() === "") {
    return {
      status: "NOT_CONFIGURED",
      message: "DATABASE_URL environment variable is not set",
    };
  }

  const p = getPool();
  if (!p) {
    return {
      status: "ERROR",
      message: "Failed to initialize database pool",
    };
  }

  let client;
  try {
    client = await p.connect();
    await client.query("SELECT 1 AS ok");
    return {
      status: "CONNECTED",
      message: "PostgreSQL connection successful",
    };
  } catch (err) {
    return {
      status: "ERROR",
      message: err.message || "Database connection failed",
    };
  } finally {
    if (client) client.release();
  }
}

// ---------- Main Health Endpoint ----------
export async function GET() {
  try {
    const [dbHealth, solanaHealth] = await Promise.all([
      checkDatabaseHealth(),
      checkSolanaHealth(),
    ]);

    const response = {
      status: "ok",
      phase: "3",
      timestamp: new Date().toISOString(),
      backend: "connected",
      database: {
        status: dbHealth.status,
        message: dbHealth.message,
      },
      solana_rpc: {
        status: solanaHealth.status,
        connected: solanaHealth.connected,
        slot: solanaHealth.slot,
        blockHeight: solanaHealth.blockHeight,
        network: solanaHealth.network,
        latencyMs: solanaHealth.latencyMs,
        message: solanaHealth.message,
        checkedAt: solanaHealth.checkedAt,
      },
      trading_engine: {
        status: "BLOCKED",
        reason:
          "Live trading is disabled. Trading engine not implemented yet.",
      },
      providers: {
        birdeye: "NOT_CONNECTED",
        dexscreener: "NOT_CONNECTED",
        jupiter: "NOT_CONNECTED",
        solana_rpc: solanaHealth.status,
      },
      system_status: "BLOCKED",
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        phase: "3",
        timestamp: new Date().toISOString(),
        backend: "connected",
        database: {
          status: "ERROR",
          message: err.message || "Unexpected health check failure",
        },
        solana_rpc: {
          status: "ERROR",
          connected: false,
          slot: null,
          blockHeight: null,
          network: null,
          latencyMs: null,
          message: err.message || "Unexpected failure",
          checkedAt: new Date().toISOString(),
        },
        trading_engine: {
          status: "BLOCKED",
          reason: "Live trading is disabled",
        },
        providers: {
          birdeye: "NOT_CONNECTED",
          dexscreener: "NOT_CONNECTED",
          jupiter: "NOT_CONNECTED",
          solana_rpc: "ERROR",
        },
        system_status: "ERROR",
      },
      { status: 200 }
    );
  }
}
