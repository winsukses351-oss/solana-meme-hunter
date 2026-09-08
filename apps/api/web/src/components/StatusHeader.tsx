'use client';

import React from 'react';
import { TradingStatus } from '@solana-trader/shared';

interface StatusHeaderProps {
  status: TradingStatus;
  killSwitchActive: boolean;
  onToggleKillSwitch: () => void;
}

export const StatusHeader: React.FC<StatusHeaderProps> = ({ status, killSwitchActive, onToggleKillSwitch }) => {
  const getBadgeColor = () => {
    if (killSwitchActive || status === 'KILLED') return 'bg-red-500/20 text-red-500 border-red-500';
    if (status === 'LIVE') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500';
    if (status === 'READY') return 'bg-blue-500/20 text-blue-400 border-blue-500';
    return 'bg-amber-500/20 text-amber-400 border-amber-500';
  };

  return (
    <div className="bg-cardBg border border-cardBorder rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Trading System Status</div>
        <div className="flex items-center space-x-3 mt-1">
          <span className={`px-3 py-1 text-xs font-bold border rounded-full uppercase tracking-wider ${getBadgeColor()}`}>
            {killSwitchActive ? 'KILLED' : status}
          </span>
        </div>
      </div>

      <button
        onClick={onToggleKillSwitch}
        className={`w-full md:w-auto px-6 py-3 rounded-lg font-bold text-sm tracking-wide transition-all shadow-lg min-h-[48px] ${
          killSwitchActive
            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
            : 'bg-red-600 hover:bg-red-500 text-white'
        }`}
      >
        {killSwitchActive ? 'DEACTIVATE KILL SWITCH' : 'EMERGENCY KILL SWITCH'}
      </button>
    </div>
  );
};
