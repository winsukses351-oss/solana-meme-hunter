
"use client";

export default function AccountMetrics() {
  const metrics = [
    { label: "BALANCE", value: "--" },
    { label: "EQUITY", value: "--" },
    { label: "DAILY PNL", value: "--" },
    { label: "WEEKLY PNL", value: "--" },
    { label: "MONTHLY PNL", value: "--" },
    { label: "NET PROFIT", value: "--" },
    { label: "DRAWDOWN", value: "--" },
    { label: "WIN RATE", value: "--" },
    { label: "PROFIT FACTOR", value: "--" },
    { label: "OPEN POSITIONS", value: "--" },
    { label: "CLOSED TRADES", value: "--" },
    { label: "CURRENT RISK", value: "NOT CONNECTED", highlight: true },
  ];

  return (
    <section className="bg-[#121721] border border-slate-800 rounded-lg p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-slate-500"></span>
          Account Metrics
        </h2>
        <span className="text-[10px] text-slate-500 font-mono">STATUS: BLOCKED</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
        {metrics.map((item, idx) => (
          <div
            key={idx}
            className="bg-[#0b0e14] border border-slate-800/60 rounded p-2.5 flex flex-col justify-between"
          >
            <span className="text-[10px] font-mono text-slate-400 tracking-tight">
              {item.label}
            </span>
            <span
              className={`text-sm sm:text-base font-mono font-semibold mt-1 ${
                item.highlight ? "text-amber-500/80" : "text-slate-500"
              }`}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
