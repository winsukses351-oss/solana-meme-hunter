"use client";

export default function SmartMoneyWhales() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Smart Money Feed */}
      <section className="bg-[#121721] border border-slate-800 rounded-lg p-3 sm:p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Smart Money Feed
            </h2>
            <span className="text-[10px] font-mono text-amber-500/80 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
              Offline
            </span>
          </div>

          <div className="bg-[#0b0e14] border border-slate-800/60 rounded p-4 text-center my-2">
            <p className="text-xs font-semibold text-slate-400">
              Smart Money Engine Offline
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              No wallet intelligence data connected.
            </p>
          </div>
        </div>
      </section>

      {/* Whale Activity */}
      <section className="bg-[#121721] border border-slate-800 rounded-lg p-3 sm:p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Whale Activity
            </h2>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              Disconnected
            </span>
          </div>

          <div className="bg-[#0b0e14] border border-slate-800/60 rounded p-4 text-center my-2">
            <p className="text-xs font-semibold text-slate-400">
              No whale data connected.
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Real-time large transaction stream is offline.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
