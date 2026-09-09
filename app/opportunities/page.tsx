"use client";

import { useEffect, useState } from "react";
import { ApiClient } from "@/lib/api-client";
import { Opportunity } from "@/types";

export default function OpportunitiesPage() {
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiClient.getOpportunities()
      .then(setOpps)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-base font-bold text-white">Analysis & Scoring Matrix</h1>

      {loading ? (
        <div className="text-center py-12 text-xs text-gray-400">Loading scored tokens...</div>
      ) : opps.length === 0 ? (
        <div className="text-center py-12 text-xs text-gray-500 bg-surface border border-surfaceBorder rounded-xl">
          No scored opportunities evaluated yet.
        </div>
      ) : (
        <div className="space-y-3">
          {opps.map((o) => (
            <div key={o.token_mint} className="bg-surface border border-surfaceBorder rounded-xl p-3 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">{o.symbol}</span>
                <span className="font-mono text-xs text-brandAccent font-bold">SCORE: {o.opportunity_score}</span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-center">
                <div className="bg-background p-1.5 rounded">
                  <div className="text-gray-500">SAFETY</div>
                  <div className="text-white font-bold">{o.safety_score}</div>
                </div>
                <div className="bg-background p-1.5 rounded">
                  <div className="text-gray-500">SMART M.</div>
                  <div className="text-white font-bold">{o.smart_money_score}</div>
                </div>
                <div className="bg-background p-1.5 rounded">
                  <div className="text-gray-500">WHALE</div>
                  <div className="text-white font-bold">{o.whale_score}</div>
                </div>
                <div className="bg-background p-1.5 rounded">
                  <div className="text-gray-500">MOMENTUM</div>
                  <div className="text-white font-bold">{o.momentum_score}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
