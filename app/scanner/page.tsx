"use client";

import { useState, useEffect } from "react";
import { ApiClient } from "@/lib/api-client";
import { Opportunity } from "@/types";

export default function ScannerPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ApiClient.getOpportunities()
      .then(setOpportunities)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-bold text-white">Live Scanner Feed</h1>
        <span className="text-xs text-gray-400 font-mono">Interval: 5s</span>
      </div>

      {loading && <div className="text-center py-12 text-xs text-gray-400">Scanning Solana Pools...</div>}
      {error && <div className="p-3 bg-brandDanger/10 border border-brandDanger/30 text-brandDanger text-xs rounded-xl">{error}</div>}

      {!loading && !error && opportunities.length === 0 && (
        <div className="text-center py-12 text-xs text-gray-500 bg-surface border border-surfaceBorder rounded-xl">
          No tokens found matching filter thresholds.
        </div>
      )}

      <div className="space-y-2">
        {opportunities.map((opp) => (
          <div key={opp.token_mint} className="bg-surface border border-surfaceBorder rounded-xl p-3 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-bold text-sm text-white">{opp.symbol}</span>
                <span className="text-xs text-gray-400 ml-2">{opp.name}</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                opp.tier === "ELITE" ? "bg-purple-500/20 text-purple-400" :
                opp.tier === "HIGH POTENTIAL" ? "bg-brandAccent/20 text-brandAccent" : "bg-gray-800 text-gray-400"
              }`}>
                {opp.tier}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-background p-2 rounded-lg border border-surfaceBorder">
              <div>
                <div className="text-[10px] text-gray-500">LIQUIDITY</div>
                <div className="text-white">${opp.liquidity_usd.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500">24H VOLUME</div>
                <div className="text-white">${opp.volume_24h_usd.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500">OPP SCORE</div>
                <div className="text-brandAccent font-bold">{opp.opportunity_score}/100</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
