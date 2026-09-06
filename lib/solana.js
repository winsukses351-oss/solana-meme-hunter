import { Connection } from "@solana/web3.js";

let connectionInstance = null;
let currentRpcUrl = null;

export function getSolanaConnection() {
  const rpcUrl = process.env.SOLANA_RPC_URL;

  if (!rpcUrl || rpcUrl.trim() === "") {
    return null;
  }

  if (!connectionInstance || currentRpcUrl !== rpcUrl) {
    connectionInstance = new Connection(rpcUrl, {
      commitment: "confirmed",
      confirmTransactionInitialTimeout: 5000,
    });
    currentRpcUrl = rpcUrl;
  }

  return connectionInstance;
}

export async function checkSolanaRpcHealth() {
  const rpcUrl = process.env.SOLANA_RPC_URL;

  if (!rpcUrl || rpcUrl.trim() === "") {
    return {
      connected: false,
      status: "NOT_CONFIGURED",
      network: null,
      slot: null,
      blockHeight: null,
      latencyMs: null,
      checkedAt: new Date().toISOString(),
    };
  }

  const connection = getSolanaConnection();

  if (!connection) {
    return {
      connected: false,
      status: "NOT_CONFIGURED",
      network: null,
      slot: null,
      blockHeight: null,
      latencyMs: null,
      checkedAt: new Date().toISOString(),
    };
  }

  const startTime = Date.now();

  try {
    // Perform lightweight genuine RPC checks
    const [slot, blockHeight, epochInfo] = await Promise.all([
      connection.getSlot("confirmed"),
      connection.getBlockHeight("confirmed"),
      connection.getEpochInfo("confirmed"),
    ]);

    const latencyMs = Date.now() - startTime;

    // Detect network environment if possible, default to mainnet-beta if slot height indicates mainnet scale
    let network = "mainnet-beta";
    if (rpcUrl.includes("devnet")) {
      network = "devnet";
    } else if (rpcUrl.includes("testnet")) {
      network = "testnet";
    }

    return {
      connected: true,
      status: "CONNECTED",
      network,
      slot,
      blockHeight,
      epoch: epochInfo.epoch,
      latencyMs,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[Solana RPC Health Error]:", error.message);
    return {
      connected: false,
      status: "ERROR",
      network: null,
      slot: null,
      blockHeight: null,
      latencyMs: null,
      error: error.message || "Failed to communicate with Solana RPC endpoint",
      checkedAt: new Date().toISOString(),
    };
  }
}
