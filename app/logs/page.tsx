"use client";

import { useEffect, useState } from "react";
import { ApiClient } from "@/lib/api-client";
import { SystemLog } from "@/types";

export default function LogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);

  useEffect(() => {
    ApiClient.getLogs().then(setLogs).catch(() => {});
  }, []);

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-base font-bold text-white">Structured Audit Logs</h1>

      <div className="space-y-1 font-mono text-[11px]">
        {logs.map((log) => (
          <div key={log.id} className="p-2 rounded bg-surface border border-surfaceBorder flex gap-2">
            <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
            <span className={`font-bold ${log.severity === "CRITICAL" || log.severity === "ERROR" ? "text-brandDanger" : "text-brandAccent"}`}>
              [{log.severity}]
            </span>
            <span className="text-gray-300">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
