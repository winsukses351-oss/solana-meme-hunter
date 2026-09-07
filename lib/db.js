/**
 * PostgreSQL / Database Client Initialization
 * Gracefully handles unconfigured DATABASE_URL without crashing backend API.
 */

import { PrismaClient } from "@prisma/client";

let prisma;

if (process.env.NODE_ENV === "production") {
  prisma = process.env.DATABASE_URL ? new PrismaClient() : null;
} else {
  if (!global.prisma) {
    global.prisma = process.env.DATABASE_URL ? new PrismaClient() : null;
  }
  prisma = global.prisma;
}

export default prisma;

export async function checkDatabaseHealth() {
  if (!process.env.DATABASE_URL || !prisma) {
    return {
      status: "NOT CONFIGURED",
      message: "DATABASE_URL environment variable is not defined.",
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
