"use client";

import { useEffect, useState } from "react";
import { ApiClient } from "@/lib/api-client";
import { SystemSettings } from "@/types";

export default function RiskPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  useEffect(() => {
    ApiClient.getSettings().then(setSettings).catch(() => {});
  }, []);

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-base font-bold text-white">Risk Parameters & Limits</h1>

      {!settings ? (
        <div className="text-center py-12 text-xs text-gray-400">Loading risk parameters...</div>
      ) : (
        <div className="bg-surface border border-surfaceBorder rounded-xl p-4 space-y-3 text-xs font-mono">
          <div className="flex justify-between py-1 border-b border-surfaceBorder">
            <span className="text-gray-400">Risk Per Trade</span>
            <span className="text-white font-bold">{settings.risk_per_trade_pct}%</span>
          </div>
          <div className="flex justify-between py-1 border-b border-surfaceBorder">
            <span className="text-gray-400">Max Open Positions</span>
            <span className="text-white font-bold">{settings.max_open_positions}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-surfaceBorder">
            <span className="text-gray-400">Daily Loss Limit</span>
            <span className="text-brandDanger font-bold">${settings.daily_loss_limit_usd}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-surfaceBorder">
            <span className="text-gray-400">Max Drawdown Limit</span>
            <span className="text-brandDanger font-bold">{settings.max_drawdown_pct}%</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-400">Compounding Mode</span>
            <span className="text-brandAccent font-bold">{settings.compounding_mode}</span>
          </div>
        </div>
      )}
    </div>
  );
}
