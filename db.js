import { Pool } from "pg";

let pool = null;

/**
 * Create a single shared connection pool.
 * Returns null if DATABASE_URL is missing or invalid.
 * Never throws on missing config — returns null so the app stays alive.
 */
export function getPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString || connectionString.trim() === "") {
    return null;
  }

  try {
    pool = new Pool({
      connectionString,
      // Conservative settings for serverless / short-lived processes
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
      // Do not log connection string or credentials
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : undefined,
    });

    // Prevent unhandled errors from crashing the process
    pool.on("error", (err) => {
      console.error("[db] Unexpected pool error:", err.message);
    });

    return pool;
  } catch (err) {
    console.error("[db] Failed to create pool:", err.message);
    return null;
  }
}

/**
 * Real database health check.
 * Returns one of: "CONNECTED" | "NOT_CONFIGURED" | "ERROR"
 */
export async function checkDatabaseHealth() {
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
    // Simple real query — proves the connection works
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
