import { NextResponse } from "next/server";
import { checkDatabaseStatus } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await checkDatabaseStatus();

    let statusCode = 200;
    if (status === "ERROR") statusCode = 500;
    if (status === "NOT_CONFIGURED") statusCode = 200;

    return NextResponse.json(
      {
        database: status.toLowerCase(),
        timestamp: new Date().toISOString(),
      },
      { status: statusCode }
    );
  } catch (error) {
    return NextResponse.json(
      {
        database: "error",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
