/**
 * Token Hunter Engine Configuration & Exclusions
 * Server-side constants for discovery filtering.
 */

export className HUNTER_CONFIG {
  // Minimum liquidity threshold in USD
  static MIN_LIQUIDITY_USD = 2500;

  // Minimum 24h volume threshold in USD
  static MIN_VOLUME_24H_USD = 1000;

  // Maximum age of market data in seconds before considered stale
  static MAX_DATA_AGE_SECONDS = 3600;

  // Known Infrastructure, Native, and Major Stablecoin Mint Addresses on Solana
  static EXCLUDED_TOKEN_ADDRESSES = new Set([
    "So11111111111111111111111111111111111111112", // Native / Wrapped SOL
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
    "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT
    "mSoLzYCAsEHFu8M4Y25U75745544455455555555555", // Marinade Staked SOL
    "bSo13r4TkiE4KumL3h8qG3Szp3E87jLu2qHK73mC2HG", // BlazeStake Staked SOL
    "JitoSOL1111111111111111111111111111111111111", // Jito Staked SOL
    "7dHbWXmci3dT8UFYWYZweBLXgytfS75W6354GR32334", // Lido Staked SOL
    "2b1kV6DmsP93LB5C355835555555555555555555555", // PYUSD
  ]);

  // Symbols to avoid if token address missing
  static EXCLUDED_SYMBOLS = new Set([
    "SOL",
    "WSOL",
    "USDC",
    "USDT",
    "MSOL",
    "BSOL",
    "JITOSOL",
    "STSOL",
    "PYUSD",
  ]);
}
