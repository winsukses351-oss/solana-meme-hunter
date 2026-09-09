"use client";

import { useEffect, useState } from "react";
import { ApiClient } from "@/lib/api-client";
import { Position } from "@/types";

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiClient.getPositions()
      .then(setPositions)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-base font-bold text-white">Active Positions</h1>

      {loading ? (
        <div className="text-center py-12 text-xs text-gray-400">Loading positions...</div>
      ) : positions.length === 0 ? (
        <div className="text-center py-12 text-xs text-gray-500 bg-surface border border-surfaceBorder rounded-xl">
          Zero active positions in portfolio.
        </div>
      ) : (
        <div className="space-y-2">
          {positions.map((p) => (
            <div key={p.id} className="bg-surface border border-surfaceBorder rounded-xl p-3 flex justify-between items-center text-xs">
              <div>
                <div className="font-bold text-white">{p.symbol}</div>
                <div className="text-[10px] text-gray-400 font-mono">Entry: ${p.entry_price.toFixed(6)}</div>
              </div>
              <div className="text-right">
                <div className={`font-mono font-bold ${p.unrealized_pnl_usd >= 0 ? "text-brandAccent" : "text-brandDanger"}`}>
                  ${p.unrealized_pnl_usd.toFixed(2)}
                </div>
                <div className="text-[10px] text-gray-400 uppercase font-mono">{p.status}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
