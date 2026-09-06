"use client";

export function TopOpportunitiesTable() {
  return (
    <section className="bg-[#121721] border border-slate-800 rounded-lg p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800/80 pb-2 mb-3">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Top Opportunities
        </h2>
        <span className="text-[10px] text-amber-500/80 font-mono">
          No market data connected
        </span>
      </div>

      <p className="text-[11px] text-slate-400 mb-3 italic">
        Opportunities will appear when the market-data engine is connected.
      </p>

      {/* Responsive Horizontal Scroll Container */}
      <div className="overflow-x-auto rounded border border-slate-800/60">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#0b0e14] text-slate-400 font-mono border-b border-slate-800">
              <th className="p-2.5 font-normal">TOKEN</th>
              <th className="p-2.5 font-normal">PRICE</th>
              <th className="p-2.5 font-normal">LIQUIDITY</th>
              <th className="p-2.5 font-normal">VOLUME</th>
              <th className="p-2.5 font-normal">SMART MONEY</th>
              <th className="p-2.5 font-normal">WHALE MOMENTUM</th>
              <th className="p-2.5 font-normal">SAFETY</th>
              <th className="p-2.5 font-normal">OPPORTUNITY STATUS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={8} className="p-4 text-center text-slate-500 font-mono bg-[#0b0e14]/50">
                WAITING FOR BACKEND
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function OpenPositionsTable() {
  return (
    <section className="bg-[#121721] border border-slate-800 rounded-lg p-3 sm:p-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Open Positions
        </h2>
        <span className="text-[10px] text-slate-500 font-mono">0 ACTIVE</span>
      </div>

      <p className="text-[11px] text-slate-400 mb-3">No active positions.</p>

      <div className="overflow-x-auto rounded border border-slate-800/60">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#0b0e14] text-slate-400 font-mono border-b border-slate-800">
              <th className="p-2.5 font-normal">TOKEN</th>
              <th className="p-2.5 font-normal">ENTRY</th>
              <th className="p-2.5 font-normal">CURRENT</th>
              <th className="p-2.5 font-normal">SIZE</th>
              <th className="p-2.5 font-normal">PNL</th>
              <th className="p-2.5 font-normal">TP</th>
              <th className="p-2.5 font-normal">SL</th>
              <th className="p-2.5 font-normal">TRAILING</th>
              <th className="p-2.5 font-normal">STATUS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={9} className="p-4 text-center text-slate-500 font-mono bg-[#0b0e14]/50">
                No positions recorded
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function TradeHistoryTable() {
  return (
    <section className="bg-[#121721] border border-slate-800 rounded-lg p-3 sm:p-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Trade History
        </h2>
        <span className="text-[10px] text-slate-500 font-mono">0 TRADES</span>
      </div>

      <p className="text-[11px] text-slate-400 mb-3">No trades recorded.</p>

      <div className="overflow-x-auto rounded border border-slate-800/60">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#0b0e14] text-slate-400 font-mono border-b border-slate-800">
              <th className="p-2.5 font-normal">TIME</th>
              <th className="p-2.5 font-normal">TOKEN</th>
              <th className="p-2.5 font-normal">SIDE</th>
              <th className="p-2.5 font-normal">SIZE</th>
              <th className="p-2.5 font-normal">ENTRY</th>
              <th className="p-2.5 font-normal">EXIT</th>
              <th className="p-2.5 font-normal">GROSS PNL</th>
              <th className="p-2.5 font-normal">COST</th>
              <th className="p-2.5 font-normal">NET PNL</th>
              <th className="p-2.5 font-normal">STATUS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={10} className="p-4 text-center text-slate-500 font-mono bg-[#0b0e14]/50">
                No trade history available
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
