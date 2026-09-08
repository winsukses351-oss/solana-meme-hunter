/**
 * Test Suite — Token Hunter Real Discovery & Filter Assertions
 */

import { filterCandidateTokens } from "../lib/token-hunter/filter";

describe("Token Hunter Real Discovery & Asset Exclusions", () => {
  test("Excludes Native SOL address", () => {
    const mockTokens = [{
      chain: "solana",
      tokenAddress: "So11111111111111111111111111111111111111112",
      symbol: "SOL",
      price: 150,
      liquidityUsd: 100000,
      volume24hUsd: 50000,
    }];
    const res = filterCandidateTokens(mockTokens);
    expect(res.candidates.length).toBe(0);
    expect(res.diagnosticsStats.excludedNativeSol).toBe(1);
  });

  test("Passes valid Solana SPL Meme Token", () => {
    const mockTokens = [{
      chain: "solana",
      tokenAddress: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R", // Example SPL Address
      symbol: "RAY",
      price: 1.85,
      liquidityUsd: 150000,
      volume24hUsd: 85000,
      timestamp: new Date().toISOString(),
    }];
    const res = filterCandidateTokens(mockTokens);
    expect(res.candidates.length).toBe(1);
    expect(res.candidates[0].status).toBe("DISCOVERED");
    expect(res.diagnosticsStats.passedAssetFilter).toBe(1);
  });
});
