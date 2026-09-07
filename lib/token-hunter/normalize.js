/**
 * Token Hunter Schema Normalization Layer
 * Precision parsing for token attributes from raw market data providers.
 */

export function normalizeRawToken(raw) {
  if (!raw) return null;

  const tokenAddress = raw.tokenAddress || raw.address || null;
  const pairAddress = raw.pairAddress || null;
  const symbol = raw.symbol ? String(raw.symbol).trim().toUpperCase() : "UNKNOWN";
  const name = raw.name ? String(raw.name).trim() : "Unknown Token";

  // Parse price accurately without losing precision on micro-cap tokens
  let price = null;
  if (raw.price !== undefined && raw.price !== null) {
    const parsedPrice = typeof raw.price === "number" ? raw.price : parseFloat(raw.price);
    if (!isNaN(parsedPrice)) {
      price = parsedPrice;
    }
  }

  // Parse priceChange24h
  let priceChange24h = null;
  if (raw.priceChange24h !== undefined && raw.priceChange24h !== null) {
    const parsedChange =
      typeof raw.priceChange24h === "number"
        ? raw.priceChange24h
        : parseFloat(raw.priceChange24h);
    if (!isNaN(parsedChange)) {
      priceChange24h = parsedChange;
    }
  }

  // Parse volume24hUsd (Distinguish explicit null vs 0)
  let volume24hUsd = null;
  if (raw.volume24hUsd !== undefined && raw.volume24hUsd !== null) {
    const parsedVol =
      typeof raw.volume24hUsd === "number"
        ? raw.volume24hUsd
        : parseFloat(raw.volume24hUsd);
    if (!isNaN(parsedVol)) {
      volume24hUsd = parsedVol;
    }
  }

  // Parse liquidityUsd (Distinguish explicit null vs 0)
  let liquidityUsd = null;
  if (raw.liquidityUsd !== undefined && raw.liquidityUsd !== null) {
    const parsedLiq =
      typeof raw.liquidityUsd === "number"
        ? raw.liquidityUsd
        : parseFloat(raw.liquidityUsd);
    if (!isNaN(parsedLiq)) {
      liquidityUsd = parsedLiq;
    }
  }

  const marketCapUsd =
    typeof raw.marketCapUsd === "number" && !isNaN(raw.marketCapUsd)
      ? raw.marketCapUsd
      : null;
  const fdvUsd =
    typeof raw.fdvUsd === "number" && !isNaN(raw.fdvUsd) ? raw.fdvUsd : null;

  const chain = raw.chain ? String(raw.chain).toLowerCase() : "solana";
  const dex = raw.dex || "Solana DEX";
  const source = raw.source || "unknown";
  const timestamp = raw.timestamp || new Date().toISOString();

  return {
    chain,
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
