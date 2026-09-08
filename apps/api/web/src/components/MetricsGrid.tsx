'use client';

import React from 'react';
import { TradingMetrics } from '@solana-trader/shared';

export const MetricsGrid: React.FC<{ metrics: TradingMetrics | null }> = ({ metrics }) => {
  if (!metrics) return <div className="text-gray-400 text-sm">Loading metrics...</div>;

  const items = [
    { label: 'Wallet Balance', value: `${metrics.balance_sol.toFixed(3)} SOL` },
    { label: 'Total Equity', value: `${metrics.equity_sol.toFixed(3)} SOL` },
    { label: 'Net Profit', value: `${metrics.net_profit_sol.toFixed(3)} SOL`, color: metrics.net_profit_sol >= 0 ? 'text-emerald-400' : 'text-red-400' },
    { label: 'Win Rate', value: `${metrics.win_rate.toFixed(1)}%` },
    { label: 'Open Positions', value: metrics.open_positions_count.toString() },
    { label: 'Closed Trades', value: metrics.closed_trades_count.toString() },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {items.map((item, idx) => (
        <div key={idx} className="bg-cardBg border border-cardBorder rounded-xl p-3 md:p-4">
          <div className="text-xs text-gray-400 font-medium">{item.label}</div>
          <div className={`text-lg md:text-xl font-bold mt-1 ${item.color || 'text-white'}`}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
};
