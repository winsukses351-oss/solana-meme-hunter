"use client";

import { useEffect, useState } from "react";
import { ApiClient } from "@/lib/api-client";
import { Trade } from "@/types";

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiClient.getTrades()
      .then(setTrades)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-base font-bold text-white">Execution History</h1>

      {loading ? (
        <div className="text-center py-12 text-xs text-gray-400">Loading execution ledger...</div>
      ) : trades.length === 0 ? (
        <div className="text-center py-12 text-xs text-gray-500 bg-surface border border-surfaceBorder rounded-xl">
          No executed trades found in database ledger.
        </div>
      ) : (
        <div className="space-y-2">
          {trades.map((t) => (
            <div key={t.id} className="bg-surface border border-surfaceBorder rounded-xl p-3 flex justify-between items-center text-xs font-mono">
              <div>
                <div className="font-bold text-white">{t.symbol} ({t.side})</div>
                <div className="text-[10px] text-gray-500">{new Date(t.created_at).toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="text-white">${t.price.toFixed(6)}</div>
                <div className="text-[10px] text-brandAccent">Net: ${t.net_pnl_usd.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
