"use client";

import { useEffect, useState } from "react";
import { ApiClient } from "@/lib/api-client";
import { SystemHealth } from "@/types";

export default function SystemHealthPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);

  useEffect(() => {
    ApiClient.getHealth().then(setHealth).catch(() => {});
  }, []);

  if (!health) return <div className="p-4 text-xs text-gray-400">Checking system diagnostics...</div>;

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-base font-bold text-white">System Diagnostics & Health</h1>

      <div className="bg-surface border border-surfaceBorder rounded-xl p-4 space-y-2 text-xs font-mono">
        {Object.entries(health).map(([key, val]) => {
          if (typeof val === "object") return null;
          return (
            <div key={key} className="flex justify-between py-1 border-b border-surfaceBorder">
              <span className="text-gray-400 uppercase">{key.replace("_", " ")}</span>
              <span className="font-bold text-white">{String(val)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
