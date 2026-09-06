import { Pool } from "pg";

let pool = null;

export function getDbPool() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl || dbUrl.trim() === "") {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: dbUrl,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      max: 10,
    });

    pool.on("error", (err) => {
      console.error("[PostgreSQL Pool Error]:", err.message);
    });
  }

  return pool;
}

export async function checkDatabaseStatus() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl || dbUrl.trim() === "") {
    return "NOT_CONFIGURED";
  }

  const currentPool = getDbPool();

  if (!currentPool) {
    return "NOT_CONFIGURED";
  }

  try {
    const client = await currentPool.connect();
    try {
      await client.query("SELECT 1");
      return "CONNECTED";
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("[Database Health Check Failure]:", error.message);
    return "ERROR";
  }
}
