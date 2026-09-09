"use client";

import { SystemHealth } from "@/types";

interface Props {
  health: SystemHealth | null;
  loading: boolean;
  onKillSwitch: () => void;
}

export function TradingStatusBanner({ health, loading, onKillSwitch }: Props) {
  if (loading || !health) {
    return (
      <div className="bg-surface border-b border-surfaceBorder px-4 py-2 text-xs text-gray-400 flex justify-between items-center animate-pulse">
        <span>Loading System Status...</span>
      </div>
    );
  }

  const isLive = health.status === "LIVE";
  const isBlocked = health.status === "BLOCKED" || health.status === "KILLED";

  return (
    <div className={`px-4 py-2 text-xs border-b border-surfaceBorder flex flex-col md:flex-row md:items-center justify-between gap-2 ${
      isLive ? "bg-brandAccent/10 border-brandAccent/30 text-brandAccent" :
      isBlocked ? "bg-brandDanger/10 border-brandDanger/30 text-brandDanger" : "bg-brandWarning/10 border-brandWarning/30 text-brandWarning"
    }`}>
      <div className="flex items-center gap-2">
        <span className="font-bold">TRADING STATUS:</span>
        <span className="px-2 py-0.5 rounded font-mono font-bold uppercase bg-surface border border-current">
          {health.status}
        </span>
        {health.kill_switch && (
          <span className="px-2 py-0.5 rounded font-mono font-bold bg-brandDanger text-white">
            KILL SWITCH: ACTIVE
          </span>
        )}
      </div>

      {health.blockers && health.blockers.length > 0 && (
        <div className="text-xs text-gray-300 flex items-center gap-1 overflow-x-auto">
          <span className="font-semibold text-brandDanger">Blockers:</span>
          <span>{health.blockers.join(" | ")}</span>
        </div>
      )}

      <button
        onClick={onKillSwitch}
        className="px-3 py-1 rounded font-bold text-xs bg-brandDanger text-white hover:bg-red-600 transition-colors self-start md:self-auto"
      >
        EMERGENCY KILL SWITCH
      </button>
    </div>
  );
}
