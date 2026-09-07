/**
 * Token Hunter Schema Normalization Layer
 * Converts raw provider pairs into a unified internal representation.
 */

export function normalizeRawToken(raw) {
  if (!raw) return null;

  const tokenAddress = raw.tokenAddress || raw.address || null;
  const pairAddress = raw.pairAddress || null;
  const symbol = raw.symbol ? String(raw.symbol).trim().toUpperCase() : "UNKNOWN";
  const name = raw.name ? String(raw.name).trim() : "Unknown Token";

  const price = typeof raw.price === "number" && !isNaN(raw.price) ? raw.price : 0;
  const priceChange24h =
    typeof raw.priceChange24h === "number" && !isNaN(raw.priceChange24h)
      ? raw.priceChange24h
      : 0;
  const volume24hUsd =
    typeof raw.volume24hUsd === "number" && !isNaN(raw.volume24hUsd)
      ? raw.volume24hUsd
      : 0;
  const liquidityUsd =
    typeof raw.liquidityUsd === "number" && !isNaN(raw.liquidityUsd)
      ? raw.liquidityUsd
      : 0;

  const marketCapUsd =
    typeof raw.marketCapUsd === "number" && !isNaN(raw.marketCapUsd)
      ? raw.marketCapUsd
      : null;
  const fdvUsd =
    typeof raw.fdvUsd === "number" && !isNaN(raw.fdvUsd) ? raw.fdvUsd : null;

  const dex = raw.dex || "Solana DEX";
  const source = raw.source || "unknown";
  const timestamp = raw.timestamp || new Date().toISOString();

  return {
    chain: "solana",
    tokenAddress,
    symbol,
    name,
    decimals: raw.decimals ?? null,
    logo: raw.logo || null,
    price,
    priceChange24h,
    volume24hUsd,
    liquidityUsd,
    marketCapUsd,
    fdvUsd,
    pairAddress,
    dex,
    source,
    timestamp,
    status: "DISCOVERED",
  };
}
