import { Connection, clusterApiUrl } from "@solana/web3.js";

/**
 * Create a Solana Connection from SOLANA_RPC_URL.
 * Returns null if not configured.
 * Never throws on missing config.
 */
export function getSolanaConnection() {
  const rpcUrl = process.env.SOLANA_RPC_URL;

  if (!rpcUrl || rpcUrl.trim() === "") {
    return null;
  }

  try {
    // commitment "confirmed" is a good balance for health checks
    return new Connection(rpcUrl.trim(), "confirmed");
  } catch (err) {
    console.error("[solana] Failed to create connection:", err.message);
    return null;
  }
}

/**
 * Real Solana RPC health check.
 * Performs actual network requests (getSlot + getBlockHeight).
 * Returns status: CONNECTED | NOT_CONFIGURED | ERROR
 */
export async function checkSolanaHealth() {
  const rpcUrl = process.env.SOLANA_RPC_URL;

  if (!rpcUrl || rpcUrl.trim() === "") {
    return {
      status: "NOT_CONFIGURED",
      connected: false,
      slot: null,
      blockHeight: null,
      network: null,
      latencyMs: null,
      message: "SOLANA_RPC_URL environment variable is not set",
      checkedAt: new Date().toISOString(),
    };
  }

  const connection = getSolanaConnection();
  if (!connection) {
    return {
      status: "ERROR",
      connected: false,
      slot: null,
      blockHeight: null,
      network: null,
      latencyMs: null,
      message: "Failed to create Solana connection",
      checkedAt: new Date().toISOString(),
    };
  }

  const start = Date.now();

  try {
    // Real RPC calls — no mocking
    const [slot, blockHeight] = await Promise.all([
      connection.getSlot(),
      connection.getBlockHeight(),
    ]);

    const latencyMs = Date.now() - start;

    // Basic mainnet heuristic: mainnet slots are currently > 200 million
    // We do not hardcode genesis hash here to keep it simple & robust
    let network = "unknown";
    if (slot > 200_000_000) {
      network = "mainnet-beta";
    } else if (slot < 100_000) {
      network = "localnet-or-test";
    } else {
      network = "devnet-or-testnet";
    }

    return {
      status: "CONNECTED",
      connected: true,
      slot,
      blockHeight,
      network,
      latencyMs,
      message: "Solana RPC responding",
      checkedAt: new Date().toISOString(),
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    return {
      status: "ERROR",
      connected: false,
      slot: null,
      blockHeight: null,
      network: null,
      latencyMs,
      message: err.message || "Solana RPC request failed",
      checkedAt: new Date().toISOString(),
    };
  }
}
