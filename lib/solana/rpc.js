/**
 * Solana RPC Provider Integration & Health Monitor
 * Connects to public/custom Solana RPC cluster gracefully.
 */

const DEFAULT_SOLANA_RPC = "https://api.mainnet-beta.solana.com";

export async function checkSolanaRpcHealth() {
  const rpcUrl = process.env.SOLANA_RPC_URL || DEFAULT_SOLANA_RPC;
  const startTime = Date.now();

  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-[#1]Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getEpochInfo",
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Solana RPC HTTP status ${response.status}`);
    }

    const data = await response.json();
    const latency = Date.now() - startTime;

    if (data.error) {
      throw new Error(data.error.message || "RPC Response Error");
    }

    return {
      status: "CONNECTED",
      rpcUrl: rpcUrl.replace(/\?.*$/, ""), // Strip secret params if any
      epochInfo: data.result || null,
      latencyMs: latency,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: "ERROR",
      rpcUrl: rpcUrl.replace(/\?.*$/, ""),
      error: error.message || "Failed to reach Solana RPC node",
      latencyMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }
}

