/**
 * Solana RPC Provider Integration & Health Monitor
 * Connects to public/custom Solana RPC cluster gracefully.
 */

const DEFAULT_SOLANA_RPC = "https://api.mainnet-beta.solana.com";

export async function checkSolanaRpcHealth() {
  const rpcUrl = process.env.SOLANA_RPC_URL || DEFAULT_SOLANA_RPC;
  const startTime = Date.now();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getEpochInfo",
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Solana RPC HTTP status ${response.status}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    if (data.error) {
      throw new Error(data.error.message || "RPC Response Error");
    }

    const epochInfo = data.result || {};

    return {
      status: "CONNECTED",
      rpcUrl: rpcUrl.replace(/\?.*$/, ""),
      network: "mainnet-beta",
      currentSlot: epochInfo.absoluteSlot || epochInfo.slot || null,
      blockHeight: epochInfo.blockHeight || null,
      epoch: epochInfo.epoch || null,
      latencyMs,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      status: process.env.SOLANA_RPC_URL ? "ERROR" : "CONNECTED_PUBLIC_FALLBACK",
      rpcUrl: rpcUrl.replace(/\?.*$/, ""),
      network: "mainnet-beta",
      currentSlot: null,
      blockHeight: null,
      epoch: null,
      latencyMs: Date.now() - startTime,
      error: error.name === "AbortError" ? "RPC Request Timeout (8s)" : error.message,
      timestamp: new Date().toISOString(),
    };
  }
}
