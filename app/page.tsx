"use client";

import { useEffect, useState } from "react";
import { ApiClient } from "@/lib/api-client";
import { SystemHealth, DashboardMetrics, Position, Trade } from "@/types";
import { TradingStatusBanner } from "@/components/TradingStatusBanner";
import { MetricCard } from "@/components/MetricCard";

export default function DashboardPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [hData, mData, pData, tData] = await Promise.all([
        ApiClient.getHealth(),
        ApiClient.getDashboardMetrics(),
        ApiClient.getPositions(),
        ApiClient.getTrades(),
      ]);
      setHealth(hData);
      setMetrics(mData);
      setPositions(pData);
      setTrades(tData);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleKillSwitch = async () => {
    if (confirm("Are you sure you want to activate the EMERGENCY KILL SWITCH?")) {
      await ApiClient.activateKillSwitch();
      loadData();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <TradingStatusBanner health={health} loading={loading} onKillSwitch={handleKillSwitch} />

      <div className="px-4 flex flex-col gap-4">
        {error && (
          <div className="bg-brandDanger/10 border border-brandDanger/30 p-3 rounded-xl text-brandDanger text-xs">
            <span className="font-bold">Dashboard Sync Failure:</span> {error}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <MetricCard
            title="SOL Balance"
            value={metrics ? `${metrics.balance_sol.toFixed(2)} SOL` : "--"}
            subtitle={metrics ? `$${metrics.balance_usd.toFixed(2)} USD` : undefined}
          />
          <MetricCard
            title="Daily PnL"
            value={metrics ? `$${metrics.daily_pnl_usd.toFixed(2)}` : "--"}
            trend={metrics && metrics.daily_pnl_usd >= 0 ? "up" : "down"}
            subtitle="Today"
          />
          <MetricCard
            title="Win Rate"
            value={metrics ? `${metrics.win_rate_pct.toFixed(1)}%` : "--"}
            subtitle={metrics ? `PF: ${metrics.profit_factor.toFixed(2)}` : undefined}
          />
          <MetricCard
            title="Max Drawdown"
            value={metrics ? `${metrics.drawdown_pct.toFixed(1)}%` : "--"}
            trend="down"
            subtitle="Current Peak Risk"
          />
        </div>

        <div className="bg-surface border border-surfaceBorder rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-bold text-white">Active Positions ({positions.length})</h2>
          </div>
          {positions.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-xs">No active positions</div>
          ) : (
            <div className="space-y-2">
              {positions.map((pos) => (
                <div key={pos.id} className="p-2.5 rounded-lg bg-background border border-surfaceBorder flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-white">{pos.symbol}</div>
                    <div className="text-[10px] text-gray-400">Qty: {pos.quantity}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono font-bold ${pos.unrealized_pnl_usd >= 0 ? "text-brandAccent" : "text-brandDanger"}`}>
                      {pos.unrealized_pnl_usd >= 0 ? "+" : ""}${pos.unrealized_pnl_usd.toFixed(2)} ({pos.unrealized_pnl_pct.toFixed(1)}%)
                    </div>
                    <div className="text-[10px] text-gray-400">${pos.current_price.toFixed(6)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface border border-surfaceBorder rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-bold text-white">Recent Trades ({trades.length})</h2>
          </div>
          {trades.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-xs">No execution history recorded</div>
          ) : (
            <div className="space-y-2">
              {trades.map((tr) => (
                <div key={tr.id} className="p-2.5 rounded-lg bg-background border border-surfaceBorder flex justify-between items-center text-xs">
                  <div>
                    <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] mr-2 ${tr.side === "BUY" ? "bg-brandAccent/20 text-brandAccent" : "bg-brandDanger/20 text-brandDanger"}`}>
                      {tr.side}
                    </span>
                    <span className="font-bold text-white">{tr.symbol}</span>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-white">${tr.price.toFixed(6)}</div>
                    <div className="text-[10px] text-gray-400">Net: ${tr.net_pnl_usd.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
