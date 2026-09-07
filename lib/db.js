/**
 * PostgreSQL / Database Client Initialization
 * Gracefully handles missing @prisma/client or DATABASE_URL without breaking Next.js build.
 */

let prisma = null;

// Dynamically attempt to require PrismaClient if available and DATABASE_URL exists
if (process.env.DATABASE_URL) {
  try {
    const { PrismaClient } = require("@prisma/client");
    if (process.env.NODE_ENV === "production") {
      prisma = new PrismaClient();
    } else {
      if (!global.prisma) {
        global.prisma = new PrismaClient();
      }
      prisma = global.prisma;
    }
  } catch (e) {
    prisma = null;
  }
}

export default prisma;

export async function checkDatabaseHealth() {
  if (!process.env.DATABASE_URL || !prisma) {
    return {
      status: "NOT CONFIGURED",
      message: "DATABASE_URL environment variable is not defined or Prisma Client not generated.",
      timestamp: new Date().toISOString(),
    };
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: "CONNECTED",
      message: "Database connection healthy.",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: "ERROR",
      message: error.message || "Failed to connect to database.",
      timestamp: new Date().toISOString(),
    };
  }
}
