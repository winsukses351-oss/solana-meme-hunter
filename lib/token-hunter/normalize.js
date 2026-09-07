/**
 * Token Hunter Schema Normalization Layer
 * Base Token vs Quote Token Extraction for Solana Pairs
 */

export function normalizeRawToken(rawPair) {
  if (!rawPair) return null;

  // Extract baseToken as target asset to discover
  const baseToken = rawPair.baseToken || {};
  const quoteToken = rawPair.quoteToken || {};

  // Extract primary token address strictly from baseToken
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

  // Price Parsing
  let price = null;
  const rawPrice = rawPair.priceUsd ?? rawPair.price;
  if (rawPrice !== undefined && rawPrice !== null) {
    const parsedPrice = typeof rawPrice === "number" ? rawPrice : parseFloat(rawPrice);
    if (!isNaN(parsedPrice)) price = parsedPrice;
  }

  // Price Change 24h Parsing
  let priceChange24h = null;
  const rawChange = rawPair.priceChange?.h24 ?? rawPair.priceChange24h ?? rawPair.priceChange;
  if (rawChange !== undefined && rawChange !== null) {
    const parsedChange = typeof rawChange === "number" ? rawChange : parseFloat(rawChange);
    if (!isNaN(parsedChange)) priceChange24h = parsedChange;
  }

  // Volume Parsing
  let volume24hUsd = null;
  const rawVol = rawPair.volume?.h24 ?? rawPair.volume24hUsd ?? rawPair.volume;
  if (rawVol !== undefined && rawVol !== null) {
    const parsedVol = typeof rawVol === "number" ? rawVol : parseFloat(rawVol);
    if (!isNaN(parsedVol)) volume24hUsd = parsedVol;
  }

  // Liquidity Parsing
  let liquidityUsd = null;
  const rawLiq = rawPair.liquidity?.usd ?? rawPair.liquidityUsd ?? rawPair.liquidity;
  if (rawLiq !== undefined && rawLiq !== null) {
    const parsedLiq = typeof rawLiq === "number" ? rawLiq : parseFloat(rawLiq);
    if (!isNaN(parsedLiq)) liquidityUsd = parsedLiq;
  }

  const marketCapUsd =
    typeof rawPair.marketCap === "number" && !isNaN(rawPair.marketCap)
      ? rawPair.marketCap
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
    dex,
    source,
    timestamp,
    status: "DISCOVERED",
  };
}
