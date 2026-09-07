import { NextResponse } from "next/server";
import { getMarketDataHealth } from "@/lib/market-data/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const marketHealth = await getMarketDataHealth();
    return NextResponse.json(marketHealth, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: "ERROR",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
