import { NextResponse } from "next/server";
import { getRealSolanaTokens } from "@/lib/market-data/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tokenData = await getRealSolanaTokens(10);
    return NextResponse.json(tokenData, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        tokens: [],
        count: 0,
        error: error.message,
        fetchedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

