import React from "react";

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
}

export function MetricCard({ title, value, subtitle, trend }: Props) {
  return (
    <div className="bg-surface border border-surfaceBorder rounded-xl p-3.5 flex flex-col justify-between">
      <span className="text-xs font-medium text-gray-400">{title}</span>
      <div className="my-1">
        <span className="text-lg font-bold font-mono text-white">{value}</span>
      </div>
      {subtitle && (
        <span className={`text-[10px] font-medium ${
          trend === "up" ? "text-brandAccent" : trend === "down" ? "text-brandDanger" : "text-gray-400"
        }`}>
          {subtitle}
        </span>
      )}
    </div>
  );
}
