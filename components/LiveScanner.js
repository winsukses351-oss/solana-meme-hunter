"use client";

export default function LiveScanner() {
  const scannerMetrics = [
    { label: "SCANNER STATUS", value: "NOT CONNECTED" },
    { label: "LAST SCAN", value: "--" },
    { label: "TOKENS FOUND", value: "--" },
    { label: "VALID CANDIDATES", value: "--" },
    { label: "SAFE CANDIDATES", value: "--" },
  ];

  return (
    <section className="bg-[#121721] border border-slate-800 rounded-lg p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 border-b border-slate-800/80 pb-2">
        <div className="flex items-center space-x-2">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Live Token Scanner
          </h2>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
            OFFLINE
          </span>
        </div>

        <button
          disabled
          className="w-full sm:w-auto px-4 py-1.5 bg-slate-800 border border-slate-700 text-slate-500 text-xs font-semibold rounded cursor-not-allowed opacity-60 text-center"
        >
          Scan (Backend Not Connected)
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {scannerMetrics.map((m, idx) => (
          <div key={idx} className="bg-[#0b0e14] border border-slate-800/60 rounded p-2.5">
            <div className="text-[10px] font-mono text-slate-400">{m.label}</div>
            <div className="text-xs sm:text-sm font-mono text-slate-500 mt-1 font-semibold">
              {m.value}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
