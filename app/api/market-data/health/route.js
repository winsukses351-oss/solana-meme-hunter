import { NextResponse } from "next/server";
import { getMarketDataHealth } from "@/lib/market-data/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const health = await getMarketDataHealth();

    let statusCode = 200;
    if (health.status === "ERROR") statusCode = 500;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: "ERROR",
        activeProvider: "none",
        error: error.message,
        checkedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
