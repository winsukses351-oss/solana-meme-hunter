/**
 * Token Hunter Schema Normalization Layer
 * Strictly extracts real 24h volume USD from DexScreener pair response (pair.volume.h24).
 */

export function normalizeRawToken(rawPair) {
  if (!rawPair) return null;

  const baseToken = rawPair.baseToken || {};
  const quoteToken = rawPair.quoteToken || {};

  const tokenAddress = baseToken.address || rawPair.tokenAddress || rawPair.address || null;
  const symbol = baseToken.symbol
    ? String(baseToken.symbol).trim().toUpperCase()
    : rawPair.symbol
    ? String(rawPair.symbol).trim().toUpperCase()
    : "UNKNOWN";
  const name = baseToken.name
    ? String(baseToken.name).trim()
    : rawPair.name
    ? String(rawPair.name).trim()
    : "Unknown Token";

  const quoteTokenAddress = quoteToken.address || null;
  const quoteTokenSymbol = quoteToken.symbol
    ? String(quoteToken.symbol).trim().toUpperCase()
    : null;

  const pairAddress = rawPair.pairAddress || null;
  const url = rawPair.url || null;

  // Price Parsing
  let price = null;
  const rawPrice = rawPair.priceUsd ?? rawPair.price;
  if (rawPrice !== undefined && rawPrice !== null) {
    const parsedPrice = typeof rawPrice === "number" ? rawPrice : parseFloat(rawPrice);
    if (!isNaN(parsedPrice)) price = parsedPrice;
  }

  // Price Change 24h Parsing
  let priceChange24h = null;
  const rawChange = rawPair.priceChange?.h24;
  if (rawChange !== undefined && rawChange !== null) {
    const parsedChange = typeof rawChange === "number" ? rawChange : parseFloat(rawChange);
    if (!isNaN(parsedChange)) priceChange24h = parsedChange;
  }

  // Volume 24h USD Parsing (Strict mapping to DexScreener volume.h24)
  let volume24hUsd = null;
  const rawVol24h = rawPair.volume?.h24;
  if (rawVol24h !== undefined && rawVol24h !== null) {
    const parsedVol = typeof rawVol24h === "number" ? rawVol24h : parseFloat(rawVol24h);
    if (!isNaN(parsedVol)) volume24hUsd = parsedVol;
  }

  // Liquidity USD Parsing
  let liquidityUsd = null;
  const rawLiq = rawPair.liquidity?.usd;
  if (rawLiq !== undefined && rawLiq !== null) {
    const parsedLiq = typeof rawLiq === "number" ? rawLiq : parseFloat(rawLiq);
    if (!isNaN(parsedLiq)) liquidityUsd = parsedLiq;
  }

  const marketCapUsd =
    typeof rawPair.marketCap === "number" && !isNaN(rawPair.marketCap)
      ? rawPair.marketCap
      : typeof rawPair.fdv === "number" && !isNaN(rawPair.fdv)
      ? rawPair.fdv
      : null;

  const chain = rawPair.chainId ? String(rawPair.chainId).toLowerCase() : "solana";
  const dex = rawPair.dexId ? String(rawPair.dexId) : rawPair.dex || "Solana DEX";
  const source = "DexScreener";
  const timestamp = rawPair.pairCreatedAt
    ? new Date(rawPair.pairCreatedAt).toISOString()
    : new Date().toISOString();

  return {
    chain,
    tokenAddress,
    symbol,
    name,
    quoteTokenAddress,
    quoteTokenSymbol,
    price,
    priceChange24h,
    volume24hUsd,
    liquidityUsd,
    marketCapUsd,
    pairAddress,
    url,
    dex,
    source,
    timestamp,
    status: "DISCOVERED",
  };
}
