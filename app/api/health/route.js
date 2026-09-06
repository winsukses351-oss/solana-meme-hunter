import { NextResponse } from "next/server";
import { checkDatabaseStatus } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dbStatus = await checkDatabaseStatus();

    const responsePayload = {
      status: "ok",
      backend: "connected",
      database: dbStatus.toLowerCase(),
      timestamp: new Date().toISOString(),
      trading_status: "BLOCKED",
      phase: "PHASE 2 — BACKEND FOUNDATION",
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        backend: "connected",
        database: "error",
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
